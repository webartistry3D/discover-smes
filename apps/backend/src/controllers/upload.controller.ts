import type { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage.service.js';
import { prisma } from '../config/database.js';
import { AppError, sendSuccess } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class UploadController {
  // Upload vendor cover image
  async uploadCoverImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw AppError.badRequest('No file provided');
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const result = await storageService.upload(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { folder: `vendors/${vendorId}` },
      );

      await prisma.vendor.update({
        where: { id: vendorId },
        data: { coverImage: result.url },
      });

      sendSuccess(res, { url: result.url }, 'Cover image uploaded');
    } catch (err) {
      next(err);
    }
  }

  // Upload vendor logo
  async uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw AppError.badRequest('No file provided');
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const result = await storageService.upload(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { folder: `vendors/${vendorId}/logos`, maxSizeMB: 2 },
      );

      await prisma.vendor.update({
        where: { id: vendorId },
        data: { logo: result.url },
      });

      sendSuccess(res, { url: result.url }, 'Logo uploaded');
    } catch (err) {
      next(err);
    }
  }

  // Upload multiple vendor gallery images
  async uploadGallery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files?.length) throw AppError.badRequest('No files provided');
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const uploads = await Promise.all(
        files.map((f) =>
          storageService.upload(f.buffer, f.originalname, f.mimetype, {
            folder: `vendors/${vendorId}/gallery`,
          }),
        ),
      );

      const urls = uploads.map((u) => u.url);

      // Append to existing images
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { images: true } });
      const existingImages = vendor?.images ?? [];
      const allImages = [...existingImages, ...urls].slice(0, 10); // Max 10

      await prisma.vendor.update({
        where: { id: vendorId },
        data: { images: allImages },
      });

      sendSuccess(res, { urls, total: allImages.length }, `${urls.length} image(s) uploaded`);
    } catch (err) {
      next(err);
    }
  }

  // Upload verification documents
  async uploadVerificationDocs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files?.length) throw AppError.badRequest('No documents provided');
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const uploads = await Promise.all(
        files.map((f) =>
          storageService.upload(f.buffer, f.originalname, f.mimetype, {
            folder: `vendors/${vendorId}/verification`,
            maxSizeMB: 10,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as any,
          }),
        ),
      );

      const urls = uploads.map((u) => u.url);

      // Create verification request
      const { requestedLevel } = req.body as { requestedLevel: string };
      const verReq = await prisma.verificationRequest.create({
        data: {
          vendorId,
          requestedLevel: requestedLevel as any ?? 'BUSINESS_VERIFIED',
          documents: urls,
        },
      });

      sendSuccess(res, verReq, 'Verification request submitted');
    } catch (err) {
      next(err);
    }
  }

  // Upload product images (standalone - returns URLs)
  async uploadProductImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files?.length) throw AppError.badRequest('No files provided');
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      logger.debug(`Uploading ${files.length} product images for vendor ${vendorId}`);

      const uploads = await Promise.all(
        files.map((f) =>
          storageService.upload(f.buffer, f.originalname, f.mimetype, {
            folder: `vendors/${vendorId}/products`,
            maxSizeMB: 5,
          }),
        ),
      );

      const urls = uploads.map((u) => u.url);
      logger.debug(`Generated URLs: ${JSON.stringify(urls)}`);
      sendSuccess(res, { urls }, `${urls.length} image(s) uploaded`);
    } catch (err) {
      next(err);
    }
  }
}

export const uploadController = new UploadController();
