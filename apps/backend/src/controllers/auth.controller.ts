import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { sendSuccess, sendCreated } from '../utils/errors.js';
import { isValidNigerianPhone } from '@discover-smes/shared';

const registerSchema = z.object({
  phone: z.string().min(10).refine(isValidNigerianPhone, 'Invalid Nigerian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  phone: z.string().min(10).refine(isValidNigerianPhone, 'Invalid Nigerian phone number'),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, password, firstName, lastName } = registerSchema.parse(req.body);
      const result = await authService.register(phone, password, firstName, lastName);
      sendCreated(res, result, 'Registration successful');
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, password } = loginSchema.parse(req.body);
      const result = await authService.login(phone, password);
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
