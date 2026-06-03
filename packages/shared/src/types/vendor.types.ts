// ============================================================
// VENDOR TYPES
// ============================================================

import type { VerificationLevel, User } from './auth.types.js';

export type VendorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export type BusinessType = 'PRODUCT' | 'SERVICE' | 'HYBRID';

export type PriceRange = 'BUDGET' | 'MID_RANGE' | 'PREMIUM';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface OpeningHours {
  monday?: DayHours | null;
  tuesday?: DayHours | null;
  wednesday?: DayHours | null;
  thursday?: DayHours | null;
  friday?: DayHours | null;
  saturday?: DayHours | null;
  sunday?: DayHours | null;
}

export interface DayHours {
  open: string;  // "08:00"
  close: string; // "18:00"
  isClosed?: boolean;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description: string;
  phone: string;
  whatsappPhone?: string | null;
  email?: string | null;
  address: string;
  ward?: string | null;
  lga: string;
  state: string;
  coordinates?: GeoPoint | null;
  coverImage?: string | null;
  logo?: string | null;
  images: string[];
  categoryId: string;
  category?: Category;
  subCategoryId?: string | null;
  subCategory?: SubCategory | null;
  businessType: BusinessType;
  priceRange: PriceRange;
  openingHours?: OpeningHours | null;
  isOpenNow?: boolean;
  deliveryAvailable: boolean;
  status: VendorStatus;
  verificationLevel: VerificationLevel;
  isFeatured: boolean;
  tags: string[];
  averageRating: number;
  totalReviews: number;
  totalViews: number;
  totalWhatsappClicks: number;
  totalLeads: number;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
}

export interface VendorSummary {
  id: string;
  businessName: string;
  slug: string;
  description: string;
  address: string;
  ward?: string | null;
  lga: string;
  coverImage?: string | null;
  logo?: string | null;
  categoryId: string;
  category?: Category;
  businessType: BusinessType;
  priceRange: PriceRange;
  isOpenNow?: boolean;
  deliveryAvailable: boolean;
  verificationLevel: VerificationLevel;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  coordinates?: GeoPoint | null;
  whatsappPhone?: string | null;
  distance?: number; // km, computed for nearby queries
}

// ============================================================
// CATEGORY TYPES
// ============================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon: string;
  color: string;
  coverImage?: string | null;
  parentId?: string | null;
  isActive: boolean;
  sortOrder: number;
  vendorCount?: number;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string;
  isActive: boolean;
  sortOrder: number;
}

// ============================================================
// PRODUCT & SERVICE TYPES
// ============================================================

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  images: string[];
  isAvailable: boolean;
  stock?: number | null;
  unit?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  vendorId: string;
  name: string;
  description?: string | null;
  price?: number | null;
  priceLabel?: string | null; // e.g. "from ₦5,000"
  duration?: number | null; // minutes
  images: string[];
  isAvailable: boolean;
  bookingRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// REVIEW TYPES
// ============================================================

export interface Review {
  id: string;
  vendorId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string | null;
  images: string[];
  isVerified: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
}

// ============================================================
// SEARCH TYPES
// ============================================================

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  subCategoryId?: string;
  lga?: string;
  ward?: string;
  minRating?: number;
  verificationLevel?: VerificationLevel;
  isOpenNow?: boolean;
  deliveryAvailable?: boolean;
  businessType?: BusinessType;
  priceRange?: PriceRange;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  isFeatured?: boolean;
  tags?: string[];
  sortBy?: 'relevance' | 'rating' | 'distance' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
