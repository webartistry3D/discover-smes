// ============================================================
// USER & AUTH TYPES
// ============================================================

export type UserRole = 'USER' | 'VENDOR' | 'MODERATOR' | 'VERIFICATION_OFFICER' | 'LGA_OPERATOR' | 'SUPER_ADMIN';

export type VerificationLevel = 'NONE' | 'PHONE_VERIFIED' | 'BUSINESS_VERIFIED' | 'GOVERNMENT_ENDORSED';

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: UserRole;
  isActive: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface OtpRequest {
  phone: string;
  channel: 'sms' | 'whatsapp';
}

export interface OtpVerify {
  phone: string;
  code: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  phone: string;
  iat: number;
  exp: number;
}
