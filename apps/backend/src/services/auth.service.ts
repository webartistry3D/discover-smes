import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { formatPhoneNumber } from '@discover-smes/shared';
import type { AuthTokens, JwtPayload, UserRole } from '@discover-smes/shared';

export class AuthService {
  // ─── PASSWORD AUTH ───────────────────────────────────────

  async register(phone: string, password: string, firstName: string, lastName: string): Promise<{ user: object; tokens: AuthTokens }> {
    const normalizedPhone = formatPhoneNumber(phone);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existingUser) throw AppError.badRequest('User already exists');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        firstName,
        lastName,
        passwordHash,
        isPhoneVerified: true,
      },
    });

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
        vendorId: null,
      },
      tokens,
    };
  }

  async login(phone: string, password: string): Promise<{ user: object; tokens: AuthTokens }> {
    const normalizedPhone = formatPhoneNumber(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: { vendor: { select: { id: true } } },
    });
    if (!user) throw AppError.unauthorized('Invalid credentials');
    if (!user.passwordHash) throw AppError.unauthorized('User registered with OTP, please reset password');
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) throw AppError.unauthorized('Invalid credentials');

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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
        isPhoneVerified: user.isPhoneVerified,
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
}

export const authService = new AuthService();
