// ============================================================
// PLATFORM CONSTANTS
// ============================================================

export const FESTAC_WARDS = [
  'Amuwo-Odofin Ward A',
  'Amuwo-Odofin Ward B', 
  'Festac Town',
  'Mile 2',
  'Satellite Town',
  'Apple Junction',
  'Agboju',
  'Alakija',
  'Kirikiri',
  'Ojo',
] as const;

export const LAGOS_LGAS = [
  'Amuwo-Odofin',
  'Surulere',
  'Lagos Island',
  'Lagos Mainland',
  'Eti-Osa',
  'Ikeja',
  'Alimosho',
  'Ojo',
  'Badagry',
  'Ikorodu',
] as const;

export const CURRENCY = 'NGN';
export const CURRENCY_SYMBOL = '₦';
export const DEFAULT_LGA = 'Amuwo-Odofin';
export const DEFAULT_STATE = 'Lagos';

// Festac Town approximate center coordinates
export const FESTAC_CENTER: { lat: number; lng: number } = {
  lat: 6.4646,
  lng: 3.2823,
};

export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_SEARCH_RADIUS_KM = 50;

// ============================================================
// PAGINATION
// ============================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================================
// FILE UPLOAD
// ============================================================

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGES_PER_VENDOR = 10;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// ============================================================
// RATING
// ============================================================

export const MIN_RATING = 1;
export const MAX_RATING = 5;

// ============================================================
// BOOKING
// ============================================================

export const MIN_BOOKING_ADVANCE_HOURS = 1;
export const MAX_BOOKING_ADVANCE_DAYS = 60;
export const BOOKING_REMINDER_HOURS_BEFORE = 24;

// ============================================================
// AI
// ============================================================

export const AI_MAX_TOKENS = 500;
export const AI_TEMPERATURE = 0.3;
export const AI_CONTEXT_WINDOW_MESSAGES = 10;

// ============================================================
// RATE LIMITING
// ============================================================

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const OTP_RATE_LIMIT_MAX = 3;
export const OTP_EXPIRY_MINUTES = 10;

// ============================================================
// ERROR CODES
// ============================================================

export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_OTP: 'INVALID_OTP',
  EXPIRED_OTP: 'EXPIRED_OTP',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Vendor
  VENDOR_SUSPENDED: 'VENDOR_SUSPENDED',
  VENDOR_PENDING_APPROVAL: 'VENDOR_PENDING_APPROVAL',

  // Booking
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
} as const;
