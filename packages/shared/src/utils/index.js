"use strict";
// ============================================================
// SHARED UTILITY FUNCTIONS
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = calculateDistance;
exports.formatDistance = formatDistance;
exports.isVendorOpenNow = isVendorOpenNow;
exports.formatPhoneNumber = formatPhoneNumber;
exports.generateWhatsAppUrl = generateWhatsAppUrl;
exports.generateWhatsAppGreeting = generateWhatsAppGreeting;
exports.formatNaira = formatNaira;
exports.generateSlug = generateSlug;
exports.truncate = truncate;
exports.isValidNigerianPhone = isValidNigerianPhone;
exports.getOrdinal = getOrdinal;
/**
 * Calculate distance between two geo points in km using Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
}
function toRad(deg) {
    return deg * (Math.PI / 180);
}
/**
 * Format distance for display
 */
function formatDistance(km) {
    if (km < 1)
        return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)}km away`;
}
/**
 * Check if a vendor is currently open
 */
function isVendorOpenNow(openingHours) {
    if (!openingHours)
        return false;
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    if (!currentDay)
        return false;
    const dayHours = openingHours[currentDay];
    if (!dayHours || dayHours.isClosed)
        return false;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTime >= dayHours.open && currentTime <= dayHours.close;
}
/**
 * Format Nigerian phone number to international format
 */
function formatPhoneNumber(phone) {
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
function generateWhatsAppUrl(phone, message) {
    const formatted = formatPhoneNumber(phone).replace('+', '');
    const encodedMessage = message ? encodeURIComponent(message) : '';
    return `https://wa.me/${formatted}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}
/**
 * Generate WhatsApp greeting message for a vendor
 */
function generateWhatsAppGreeting(businessName) {
    return `Hello! I found ${businessName} on Discover Festac and I'd like to know more about your products/services.`;
}
/**
 * Format Nigerian Naira
 */
function formatNaira(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(amount);
}
/**
 * Generate URL-friendly slug
 */
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
/**
 * Truncate text to a specified length
 */
function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return `${text.slice(0, maxLength).trim()}…`;
}
/**
 * Validate Nigerian phone number
 */
function isValidNigerianPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return /^(0[789][01]\d{8}|234[789][01]\d{8})$/.test(cleaned);
}
/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd...)
 */
function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th');
}
//# sourceMappingURL=index.js.map