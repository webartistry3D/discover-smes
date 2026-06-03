"use strict";
// ============================================================
// PLATFORM CONSTANTS
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.OTP_EXPIRY_MINUTES = exports.OTP_RATE_LIMIT_MAX = exports.RATE_LIMIT_MAX_REQUESTS = exports.RATE_LIMIT_WINDOW_MS = exports.AI_CONTEXT_WINDOW_MESSAGES = exports.AI_TEMPERATURE = exports.AI_MAX_TOKENS = exports.BOOKING_REMINDER_HOURS_BEFORE = exports.MAX_BOOKING_ADVANCE_DAYS = exports.MIN_BOOKING_ADVANCE_HOURS = exports.MAX_RATING = exports.MIN_RATING = exports.ALLOWED_IMAGE_TYPES = exports.MAX_IMAGES_PER_VENDOR = exports.MAX_IMAGE_SIZE_MB = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.MAX_SEARCH_RADIUS_KM = exports.DEFAULT_SEARCH_RADIUS_KM = exports.FESTAC_CENTER = exports.DEFAULT_STATE = exports.DEFAULT_LGA = exports.CURRENCY_SYMBOL = exports.CURRENCY = exports.LAGOS_LGAS = exports.FESTAC_WARDS = void 0;
exports.FESTAC_WARDS = [
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
];
exports.LAGOS_LGAS = [
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
];
exports.CURRENCY = 'NGN';
exports.CURRENCY_SYMBOL = '₦';
exports.DEFAULT_LGA = 'Amuwo-Odofin';
exports.DEFAULT_STATE = 'Lagos';
// Festac Town approximate center coordinates
exports.FESTAC_CENTER = {
    lat: 6.4646,
    lng: 3.2823,
};
exports.DEFAULT_SEARCH_RADIUS_KM = 5;
exports.MAX_SEARCH_RADIUS_KM = 50;
// ============================================================
// PAGINATION
// ============================================================
exports.DEFAULT_PAGE_SIZE = 20;
exports.MAX_PAGE_SIZE = 100;
// ============================================================
// FILE UPLOAD
// ============================================================
exports.MAX_IMAGE_SIZE_MB = 5;
exports.MAX_IMAGES_PER_VENDOR = 10;
exports.ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// ============================================================
// RATING
// ============================================================
exports.MIN_RATING = 1;
exports.MAX_RATING = 5;
// ============================================================
// BOOKING
// ============================================================
exports.MIN_BOOKING_ADVANCE_HOURS = 1;
exports.MAX_BOOKING_ADVANCE_DAYS = 60;
exports.BOOKING_REMINDER_HOURS_BEFORE = 24;
// ============================================================
// AI
// ============================================================
exports.AI_MAX_TOKENS = 500;
exports.AI_TEMPERATURE = 0.3;
exports.AI_CONTEXT_WINDOW_MESSAGES = 10;
// ============================================================
// RATE LIMITING
// ============================================================
exports.RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
exports.RATE_LIMIT_MAX_REQUESTS = 100;
exports.OTP_RATE_LIMIT_MAX = 3;
exports.OTP_EXPIRY_MINUTES = 10;
// ============================================================
// ERROR CODES
// ============================================================
exports.ERROR_CODES = {
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
};
//# sourceMappingURL=index.js.map