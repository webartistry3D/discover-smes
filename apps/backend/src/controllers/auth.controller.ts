import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { sendSuccess, sendCreated } from '../utils/errors.js';
import { isValidNigerianPhone } from '@discover-festac/shared';

const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(10)
    .refine(isValidNigerianPhone, 'Invalid Nigerian phone number'),
  channel: z.enum(['sms', 'whatsapp']).default('sms'),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10).refine(isValidNigerianPhone, 'Invalid Nigerian phone number'),
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export class AuthController {
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = sendOtpSchema.parse(req.body);
      const result = await authService.sendOtp(phone);
      sendSuccess(res, result, 'OTP sent');
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, code } = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyOtp(phone, code);
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const tokens = await authService.refreshTokens(refreshToken);
      sendSuccess(res, tokens, 'Tokens refreshed');
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      await authService.logout(req.user!.id, refreshToken);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, req.user);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
