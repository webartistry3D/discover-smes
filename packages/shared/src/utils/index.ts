// ============================================================
// SHARED UTILITY FUNCTIONS
// ============================================================

import type { OpeningHours } from '../types/vendor.types.js';

/**
 * Calculate distance between two geo points in km using Haversine formula
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

/**
 * Check if a vendor is currently open
 */
export function isVendorOpenNow(openingHours: OpeningHours | null | undefined): boolean {
  if (!openingHours) return false;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const currentDay = dayNames[now.getDay()];
  
  if (!currentDay) return false;
  
  const dayHours = openingHours[currentDay];
  if (!dayHours || dayHours.isClosed) return false;

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

/**
 * Format Nigerian phone number to international format
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return `+234${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('234')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

/**
 * Generate WhatsApp click-to-chat URL
 */
export function generateWhatsAppUrl(phone: string, message?: string): string {
  const formatted = formatPhoneNumber(phone).replace('+', '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${formatted}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

/**
 * Generate WhatsApp greeting message for a vendor
 */
export function generateWhatsAppGreeting(businessName: string): string {
  return `Hello! I found ${businessName} on Discover SMEs and I'd like to know more about your products/services.`;
}

/**
 * Format Nigerian Naira
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text to a specified length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^(0[789][01]\d{8}|234[789][01]\d{8})$/.test(cleaned);
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd...)
 */
export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th');
}
