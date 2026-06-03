import type { OpeningHours } from '../types/vendor.types.js';
/**
 * Calculate distance between two geo points in km using Haversine formula
 */
export declare function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
/**
 * Format distance for display
 */
export declare function formatDistance(km: number): string;
/**
 * Check if a vendor is currently open
 */
export declare function isVendorOpenNow(openingHours: OpeningHours | null | undefined): boolean;
/**
 * Format Nigerian phone number to international format
 */
export declare function formatPhoneNumber(phone: string): string;
/**
 * Generate WhatsApp click-to-chat URL
 */
export declare function generateWhatsAppUrl(phone: string, message?: string): string;
/**
 * Generate WhatsApp greeting message for a vendor
 */
export declare function generateWhatsAppGreeting(businessName: string): string;
/**
 * Format Nigerian Naira
 */
export declare function formatNaira(amount: number): string;
/**
 * Generate URL-friendly slug
 */
export declare function generateSlug(text: string): string;
/**
 * Truncate text to a specified length
 */
export declare function truncate(text: string, maxLength: number): string;
/**
 * Validate Nigerian phone number
 */
export declare function isValidNigerianPhone(phone: string): boolean;
/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd...)
 */
export declare function getOrdinal(n: number): string;
//# sourceMappingURL=index.d.ts.map