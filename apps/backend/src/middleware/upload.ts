import multer, { type StorageEngine } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';
import { AppError } from '../utils/errors.js';
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '@discover-smes/shared';

// Memory storage — we pipe to S3/local after validation
const memStorage: StorageEngine = multer.memoryStorage();

function imageFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
}

function documentFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest(`Invalid file type: ${file.mimetype}`));
  }
}

// Single image upload
export const uploadImage = multer({
  storage: memStorage,
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('image');

// Multiple images
export const uploadImages = multer({
  storage: memStorage,
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024, files: 10 },
  fileFilter: imageFilter,
}).array('images', 10);

// Logo
export const uploadLogo = multer({
  storage: memStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for logos
  fileFilter: imageFilter,
}).single('logo');

// Documents (PDF + images for verification)
export const uploadDocuments = multer({
  storage: memStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: documentFilter,
}).array('documents', 5);

// Single receipt file (PDF + images)
export const uploadReceipt = multer({
  storage: memStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: documentFilter,
}).single('receipt');

// Middleware wrapper to handle multer errors properly
export function wrapMulter(multerMiddleware: any) {
  return (req: Request, res: any, next: any) => {
    multerMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        next(AppError.badRequest(
          err.code === 'LIMIT_FILE_SIZE'
            ? `File too large. Max size: ${MAX_IMAGE_SIZE_MB}MB`
            : err.message,
        ));
      } else if (err) {
        next(err);
      } else {
        next();
      }
    });
  };
}
