import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { formatPhoneNumber } from '@discover-smes/shared';
import type { AuthTokens, JwtPayload, UserRole } from '@discover-smes/shared';

export class AuthService {
  // ─── OTP ───────────────────────────────────────────────

  async sendOtp(phone: string): Promise<{ message: string; expiresIn: number }> {
    const normalizedPhone = formatPhoneNumber(phone);

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          firstName: 'User',
          lastName: normalizedPhone.slice(-4),
        },
      });
    }

    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    // Invalidate old OTPs
    await prisma.otpCode.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    // Generate OTP
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    await prisma.otpCode.create({
      data: { userId: user.id, code, phone: normalizedPhone, expiresAt },
    });

    // In production, send via SMS/WhatsApp
    if (config.isDev) {
      logger.info(`🔑 OTP for ${normalizedPhone}: ${code}`);
    } else {
      await this.dispatchOtp(normalizedPhone, code);
    }

    return {
      message: 'OTP sent successfully',
      expiresIn: config.otp.expiryMinutes * 60,
    };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ user: object; tokens: AuthTokens }> {
    const normalizedPhone = formatPhoneNumber(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: { vendor: { select: { id: true } } },
    });
    if (!user) throw AppError.notFound('User');

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw AppError.badRequest('OTP expired or not found');

    // Increment attempts
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    if (otpRecord.attempts >= 5) {
      await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } });
      throw AppError.badRequest('Too many failed attempts. Request a new OTP.');
    }

    if (otpRecord.code !== code) {
      throw new AppError('Invalid OTP code', 401, 'INVALID_OTP');
    }

    // Mark OTP used
    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } });

    // Mark phone verified
    if (!user.isPhoneVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true, lastLoginAt: new Date() },
      });
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    }

    const tokens = await this.generateTokens(user.id, user.role as UserRole, user.phone);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        isPhoneVerified: true,
        vendorId: user.vendor?.id,
      },
      tokens,
    };
  }

  // ─── JWT ───────────────────────────────────────────────

  async generateTokens(userId: string, role: UserRole, phone: string): Promise<AuthTokens> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = { 
      sub: userId, 
      role, 
      phone,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { userId, token: await bcrypt.hash(refreshToken, 10), expiresAt },
    });

    return { accessToken, refreshToken, expiresIn: 7 * 24 * 60 * 60 };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
    } catch {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // Find matching token
    const stored = await prisma.refreshToken.findMany({
      where: { userId: payload.sub, isRevoked: false, expiresAt: { gt: new Date() } },
    });

    let valid = false;
    let tokenId = '';
    for (const t of stored) {
      if (await bcrypt.compare(refreshToken, t.token)) {
        valid = true;
        tokenId = t.id;
        break;
      }
    }

    if (!valid) throw AppError.unauthorized('Refresh token not found or revoked');

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({ where: { id: tokenId }, data: { isRevoked: true } });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.isActive) throw AppError.unauthorized('Account deactivated');

    return this.generateTokens(user.id, user.role as UserRole, user.phone);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const stored = await prisma.refreshToken.findMany({
        where: { userId, isRevoked: false },
      });
      for (const t of stored) {
        if (await bcrypt.compare(refreshToken, t.token)) {
          await prisma.refreshToken.update({ where: { id: t.id }, data: { isRevoked: true } });
          break;
        }
      }
    } else {
      // Revoke all sessions
      await prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } });
    }
  }

  private async dispatchOtp(phone: string, _code: string): Promise<void> {
    // Production: integrate Termii / Africa's Talking / WhatsApp OTP
    logger.info(`Dispatching OTP to ${phone}`);
    // TODO: implement SMS/WhatsApp dispatch
  }
}

export const authService = new AuthService();
