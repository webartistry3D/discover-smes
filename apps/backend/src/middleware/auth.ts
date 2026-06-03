import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';
import { prisma } from '../config/database.js';
import type { UserRole, JwtPayload } from '@discover-festac/shared';

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        phone: string;
        vendorId?: string;
      };
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }

    const token = authHeader.slice(7);
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        phone: true,
        isActive: true,
        vendor: { select: { id: true } },
      },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Account not found or deactivated');
    }

    req.user = {
      id: user.id,
      role: user.role as UserRole,
      phone: user.phone,
      vendorId: user.vendor?.id ?? undefined,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}

export function requireVendor(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user?.vendorId) {
    next(AppError.forbidden('Vendor account required'));
    return;
  }
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  authenticate(req, _res, next);
}
