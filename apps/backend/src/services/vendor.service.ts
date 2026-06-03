import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { generateSlug, calculateDistance, isVendorOpenNow } from '@discover-festac/shared';
import type { SearchFilters, VendorSummary, PaginatedResponse } from '@discover-festac/shared';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@discover-festac/shared';

export class VendorService {
  // ─── SEARCH & DISCOVERY ─────────────────────────────────

  async search(filters: SearchFilters): Promise<PaginatedResponse<VendorSummary>> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(MAX_PAGE_SIZE, filters.limit ?? DEFAULT_PAGE_SIZE);
    const skip = (page - 1) * limit;

    const where: Prisma.VendorWhereInput = {
      status: { in: ['ACTIVE', 'PENDING'] },
      owner: { isPhoneVerified: true },
    };

    if (filters.query) {
      where.OR = [
        { businessName: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { tags: { has: filters.query.toLowerCase() } },
      ];
    }

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.subCategoryId) where.subCategoryId = filters.subCategoryId;
    if (filters.lga) where.lga = { contains: filters.lga, mode: 'insensitive' };
    if (filters.ward) where.ward = { contains: filters.ward, mode: 'insensitive' };
    if (filters.minRating) where.averageRating = { gte: filters.minRating };
    if (filters.verificationLevel) where.verificationLevel = filters.verificationLevel;
    if (filters.deliveryAvailable !== undefined) where.deliveryAvailable = filters.deliveryAvailable;
    if (filters.businessType) where.businessType = filters.businessType;
    if (filters.priceRange) where.priceRange = filters.priceRange;
    if (filters.isFeatured) where.isFeatured = true;

    // Sort order
    let orderBy: Prisma.VendorOrderByWithRelationInput = { totalViews: 'desc' };
    switch (filters.sortBy) {
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { totalWhatsappClicks: 'desc' };
        break;
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: this.summarySelect(),
      }),
      prisma.vendor.count({ where }),
    ]);

    // Post-process: open-now filter + distance computation
    let results = vendors.map((v) => this.toSummary(v, filters.lat, filters.lng));

    if (filters.isOpenNow) {
      results = results.filter((v) => v.isOpenNow);
    }

    // Distance filter after computing distance
    if (filters.lat && filters.lng && filters.radiusKm) {
      results = results.filter(
        (v) => v.distance !== undefined && v.distance <= (filters.radiusKm ?? 50),
      );
    }

    if (filters.sortBy === 'distance' && filters.lat && filters.lng) {
      results.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    }

    return {
      data: results,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findNearby(lat: number, lng: number, radiusKm = 5, limit = 20): Promise<VendorSummary[]> {
    // Use bounding box pre-filter, then exact Haversine in application layer
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    const vendors = await prisma.vendor.findMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING'] },
        owner: { isPhoneVerified: true },
      },
      take: limit * 2, // fetch extra to filter by exact radius
      select: this.summarySelect(),
    });

    // Filter by coordinates if available, otherwise include all vendors
    const vendorsWithCoords = vendors
      .map((v) => this.toSummary(v, lat, lng))
      .filter((v) => {
        // If vendor has coordinates, check if within radius
        if (v.coordinates) {
          const distance = calculateDistance(lat, lng, v.coordinates.lat, v.coordinates.lng);
          return distance <= radiusKm;
        }
        // If vendor has no coordinates, include them (they'll appear at center)
        return true;
      })
      .sort((a, b) => {
        // Sort vendors with coordinates by distance, put vendors without coordinates last
        if (a.coordinates && b.coordinates) {
          return (a.distance ?? 999) - (b.distance ?? 999);
        }
        if (a.coordinates && !b.coordinates) return -1;
        if (!a.coordinates && b.coordinates) return 1;
        return 0;
      })
      .slice(0, limit);

    return vendorsWithCoords;
  }

  async findBySlug(slug: string) {
    // Check if the input is a UUID (ID) or a slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    const vendor = await prisma.vendor.findUnique({
      where: isUuid ? { id: slug, status: { in: ['ACTIVE', 'PENDING'] } } as any : { slug, status: { in: ['ACTIVE', 'PENDING'] } },
      include: {
        category: true,
        subCategory: true,
        owner: { select: { id: true, isPhoneVerified: true } },
        products: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } },
        services: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } },
        faqs: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        },
        promotions: { where: { isActive: true, endDate: { gte: new Date() } } },
      },
    });

    if (!vendor) throw AppError.notFound('Vendor');

    // Only show vendor if phone is verified
    if (!vendor.owner?.isPhoneVerified) {
      throw AppError.notFound('Vendor');
    }

    // Track view (fire-and-forget)
    this.trackEvent(vendor.id, 'VENDOR_VIEW').catch(() => {});

    return {
      ...vendor,
      isOpenNow: isVendorOpenNow(vendor.openingHours as any),
    };
  }

  async getFeatured(limit = 8): Promise<VendorSummary[]> {
    const vendors = await prisma.vendor.findMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING'] },
        owner: { isPhoneVerified: true },
        isFeatured: true,
        featuredUntil: { gte: new Date() },
      },
      take: limit,
      orderBy: { totalWhatsappClicks: 'desc' },
      select: this.summarySelect(),
    });
    return vendors.map((v) => this.toSummary(v));
  }

  // ─── VENDOR CRUD ────────────────────────────────────────

  async create(userId: string, data: CreateVendorDto) {
    const existing = await prisma.vendor.findUnique({ where: { userId } });
    if (existing) throw AppError.conflict('You already have a vendor account');

    const categoryExists = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!categoryExists) throw AppError.notFound('Category');

    const baseSlug = generateSlug(data.businessName);
    const slug = await this.uniqueSlug(baseSlug);

    const vendor = await prisma.vendor.create({
      data: {
        ...data,
        userId,
        slug,
        status: 'PENDING',
      },
    });

    // Promote user role to VENDOR
    await prisma.user.update({ where: { id: userId }, data: { role: 'VENDOR' } });

    // Create freemium subscription by default
    await prisma.subscription.create({
      data: {
        vendorId: vendor.id,
        planType: 'FREEMIUM',
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    });

    return vendor;
  }

  async update(vendorId: string, userId: string, data: Partial<CreateVendorDto>) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw AppError.notFound('Vendor');
    if (vendor.userId !== userId) throw AppError.forbidden();

    if (data.businessName && data.businessName !== vendor.businessName) {
      const baseSlug = generateSlug(data.businessName);
      (data as any).slug = await this.uniqueSlug(baseSlug, vendorId);
    }

    return prisma.vendor.update({ where: { id: vendorId }, data });
  }

  async trackWhatsAppClick(vendorId: string): Promise<void> {
    await Promise.all([
      prisma.vendor.update({
        where: { id: vendorId },
        data: { totalWhatsappClicks: { increment: 1 } },
      }),
      this.trackEvent(vendorId, 'VENDOR_WHATSAPP_CLICK'),
    ]);
  }

  // ─── ANALYTICS ──────────────────────────────────────────

  async getVendorAnalytics(vendorId: string, period: 'week' | 'month' = 'month') {
    const since = new Date();
    since.setDate(since.getDate() - (period === 'week' ? 7 : 30));

    const [views, waClicks, bookings, reviews] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { vendorId, eventType: 'VENDOR_VIEW', createdAt: { gte: since } },
      }),
      prisma.analyticsEvent.count({
        where: { vendorId, eventType: 'VENDOR_WHATSAPP_CLICK', createdAt: { gte: since } },
      }),
      prisma.booking.count({ where: { vendorId, createdAt: { gte: since } } }),
      prisma.review.count({ where: { vendorId, createdAt: { gte: since } } }),
    ]);

    return { profileViews: views, whatsappClicks: waClicks, bookingRequests: bookings, newReviews: reviews, period };
  }

  // ─── HELPERS ────────────────────────────────────────────

  private summarySelect() {
    return {
      id: true,
      businessName: true,
      slug: true,
      description: true,
      address: true,
      ward: true,
      lga: true,
      coverImage: true,
      logo: true,
      categoryId: true,
      category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
      businessType: true,
      priceRange: true,
      deliveryAvailable: true,
      verificationLevel: true,
      isFeatured: true,
      averageRating: true,
      totalReviews: true,
      latitude: true,
      longitude: true,
      whatsappPhone: true,
      openingHours: true,
      owner: { select: { id: true, isPhoneVerified: true } },
    } satisfies Prisma.VendorSelect;
  }

  private toSummary(v: any, userLat?: number, userLng?: number): VendorSummary {
    const distance =
      userLat && userLng && v.latitude && v.longitude
        ? calculateDistance(userLat, userLng, v.latitude, v.longitude)
        : undefined;

    return {
      id: v.id,
      businessName: v.businessName,
      slug: v.slug,
      description: v.description,
      address: v.address,
      ward: v.ward,
      lga: v.lga,
      coverImage: v.coverImage,
      logo: v.logo,
      categoryId: v.categoryId,
      category: v.category,
      businessType: v.businessType,
      priceRange: v.priceRange,
      deliveryAvailable: v.deliveryAvailable,
      averageRating: v.averageRating,
      totalReviews: v.totalReviews,
      isFeatured: v.isFeatured,
      verificationLevel: v.verificationLevel,
      distance: distance ?? undefined,
      coordinates: v.latitude && v.longitude ? { lat: v.latitude, lng: v.longitude } : null,
    };
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let i = 1;
    while (true) {
      const existing = await prisma.vendor.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${i++}`;
    }
  }

  // ─── PRODUCTS ────────────────────────────────────────────────
  async createProduct(vendorId: string, userId: string, data: any) {
    await this.verifyVendorOwnership(vendorId, userId);
    const product = await prisma.product.create({
      data: {
        vendorId,
        ...data,
      },
    });
    return product;
  }

  async updateProduct(vendorId: string, productId: string, userId: string, data: any) {
    await this.verifyVendorOwnership(vendorId, userId);
    const product = await prisma.product.update({
      where: { id: productId, vendorId },
      data,
    });
    return product;
  }

  async deleteProduct(vendorId: string, productId: string, userId: string) {
    await this.verifyVendorOwnership(vendorId, userId);
    await prisma.product.delete({
      where: { id: productId, vendorId },
    });
  }

  // ─── SERVICES ────────────────────────────────────────────────
  async createService(vendorId: string, userId: string, data: any) {
    await this.verifyVendorOwnership(vendorId, userId);
    const service = await prisma.service.create({
      data: {
        vendorId,
        ...data,
      },
    });
    return service;
  }

  async updateService(vendorId: string, serviceId: string, userId: string, data: any) {
    await this.verifyVendorOwnership(vendorId, userId);
    const service = await prisma.service.update({
      where: { id: serviceId, vendorId },
      data,
    });
    return service;
  }

  async deleteService(vendorId: string, serviceId: string, userId: string) {
    await this.verifyVendorOwnership(vendorId, userId);
    await prisma.service.delete({
      where: { id: serviceId, vendorId },
    });
  }

  private async verifyVendorOwnership(vendorId: string, userId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { owner: { select: { id: true } } },
    });
    if (!vendor || vendor.owner.id !== userId) {
      throw AppError.forbidden('You do not own this vendor');
    }
  }

  private async trackEvent(vendorId: string, eventType: string): Promise<void> {
    await prisma.analyticsEvent.create({ data: { vendorId, eventType: eventType as any } });
  }
}

export interface CreateVendorDto {
  businessName: string;
  description: string;
  phone: string;
  whatsappPhone?: string;
  email?: string;
  address: string;
  ward?: string;
  lga: string;
  categoryId: string;
  subCategoryId?: string;
  businessType: 'PRODUCT' | 'SERVICE' | 'HYBRID';
  priceRange: 'BUDGET' | 'MID_RANGE' | 'PREMIUM';
  deliveryAvailable?: boolean;
  latitude?: number;
  longitude?: number;
  tags?: string[];
}

export const vendorService = new VendorService();
