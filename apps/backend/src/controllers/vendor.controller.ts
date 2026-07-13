import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { vendorService } from '../services/vendor.service.js';
import { sendSuccess, sendCreated } from '../utils/errors.js';

const searchSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  lga: z.string().optional(),
  ward: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  verificationLevel: z.enum(['NONE', 'PHONE_VERIFIED', 'BUSINESS_VERIFIED', 'GOVERNMENT_ENDORSED']).optional(),
  isOpenNow: z.coerce.boolean().optional(),
  deliveryAvailable: z.coerce.boolean().optional(),
  businessType: z.enum(['PRODUCT', 'SERVICE', 'HYBRID']).optional(),
  priceRange: z.enum(['BUDGET', 'MID_RANGE', 'PREMIUM']).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().max(50).optional(),
  isFeatured: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'rating', 'distance', 'newest', 'popular']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

const createVendorSchema = z.object({
  businessName: z.string().min(2).max(100),
  description: z.string().min(20).max(2000),
  phone: z.string().min(10),
  whatsappPhone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().min(5).max(300),
  ward: z.string().optional(),
  lga: z.string().min(2),
  categoryId: z.string().uuid(),
  subCategoryId: z.string().uuid().optional(),
  businessType: z.enum(['PRODUCT', 'SERVICE', 'HYBRID']),
  priceRange: z.enum(['BUDGET', 'MID_RANGE', 'PREMIUM']),
  deliveryAvailable: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

const createProductSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  unit: z.string().max(20).optional(),
  images: z.array(z.string().url()).max(5).optional(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const updateProductSchema = createProductSchema.partial();

const createServiceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
  priceLabel: z.string().max(50).optional(),
  durationMinutes: z.number().min(5).max(480).optional(),
  bookingRequired: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const updateServiceSchema = createServiceSchema.partial();

export class VendorController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = searchSchema.parse(req.query);
      const result = await vendorService.search(filters);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getNearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng, radius, limit } = req.query as Record<string, string>;
      if (!lat || !lng) { res.status(400).json({ success: false, error: { code: 'MISSING_COORDS', message: 'lat and lng required' } }); return; }
      const vendors = await vendorService.findNearby(+lat, +lng, radius ? +radius : 5, limit ? +limit : 20);
      sendSuccess(res, vendors);
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await vendorService.findBySlug(req.params['slug']!);
      sendSuccess(res, vendor);
    } catch (err) {
      next(err);
    }
  }

  async getFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendors = await vendorService.getFeatured(+(req.query['limit'] ?? 8));
      sendSuccess(res, vendors);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createVendorSchema.parse(req.body);
      const vendor = await vendorService.create(req.user!.id, data as any);
      sendCreated(res, vendor, 'Vendor created. Pending approval.');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createVendorSchema.partial().parse(req.body);
      const vendor = await vendorService.update(req.params['id']!, req.user!.id, data);
      sendSuccess(res, vendor, 'Vendor updated');
    } catch (err) {
      next(err);
    }
  }

  async trackWhatsApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await vendorService.trackWhatsAppClick(req.params['id']!);
      sendSuccess(res, null, 'Click tracked');
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query['period'] as 'week' | 'month' | 'year') ?? 'month';
      const analytics = await vendorService.getVendorAnalytics(req.user!.vendorId!, period);
      sendSuccess(res, analytics);
    } catch (err) {
      next(err);
    }
  }

  // ─── PRODUCTS ────────────────────────────────────────────────
  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await vendorService.createProduct(req.params['id']!, req.user!.id, data);
      sendCreated(res, product, 'Product added');
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateProductSchema.parse(req.body);
      const product = await vendorService.updateProduct(
        req.params['id']!,
        req.params['productId']!,
        req.user!.id,
        data
      );
      sendSuccess(res, product, 'Product updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await vendorService.deleteProduct(req.params['id']!, req.params['productId']!, req.user!.id);
      sendSuccess(res, null, 'Product deleted');
    } catch (err) {
      next(err);
    }
  }

  // ─── SERVICES ────────────────────────────────────────────────
  async createService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createServiceSchema.parse(req.body);
      const service = await vendorService.createService(req.params['id']!, req.user!.id, data);
      sendCreated(res, service, 'Service added');
    } catch (err) {
      next(err);
    }
  }

  async updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateServiceSchema.parse(req.body);
      const service = await vendorService.updateService(
        req.params['id']!,
        req.params['serviceId']!,
        req.user!.id,
        data
      );
      sendSuccess(res, service, 'Service updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await vendorService.deleteService(req.params['id']!, req.params['serviceId']!, req.user!.id);
      sendSuccess(res, null, 'Service deleted');
    } catch (err) {
      next(err);
    }
  }
}

export const vendorController = new VendorController();
