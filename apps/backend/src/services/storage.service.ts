import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname, extname } from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '@discover-festac/shared';

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: readonly string[];
}

class StorageService {
  private s3Client: S3Client | null = null;

  constructor() {
    if (config.storage.provider === 'aws') {
      this.s3Client = new S3Client({
        region: config.storage.aws.region,
        credentials: {
          accessKeyId: config.storage.aws.accessKeyId,
          secretAccessKey: config.storage.aws.secretAccessKey,
        },
      });
    }

    // Ensure local upload dir exists
    if (config.storage.provider === 'local') {
      const folders = ['vendors', 'products', 'services', 'users', 'documents'];
      folders.forEach((f) => {
        const dir = join(config.storage.localUploadDir, f);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      });
    }
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const {
      folder = 'general',
      maxSizeMB = MAX_IMAGE_SIZE_MB,
      allowedTypes = ALLOWED_IMAGE_TYPES,
    } = options;

    // Validate size
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      throw new Error(`File size ${sizeMB.toFixed(1)}MB exceeds limit of ${maxSizeMB}MB`);
    }

    // Validate type
    if (!allowedTypes.includes(mimeType as any)) {
      throw new Error(`File type ${mimeType} is not allowed. Allowed: ${allowedTypes.join(', ')}`);
    }

    const ext = extname(originalName).toLowerCase() || this.mimeToExt(mimeType);
    const key = `${folder}/${randomUUID()}${ext}`;

    if (config.storage.provider === 'aws' && this.s3Client) {
      return this.uploadToS3(buffer, key, mimeType);
    }

    return this.uploadToLocal(buffer, key, mimeType);
  }

  async delete(key: string): Promise<void> {
    if (config.storage.provider === 'aws' && this.s3Client) {
      await this.deleteFromS3(key);
    } else {
      this.deleteFromLocal(key);
    }
  }

  async getPresignedUploadUrl(
    key: string,
    mimeType: string,
    expiresIn = 300,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error('Presigned URLs only available with S3 storage');
    }

    const command = new PutObjectCommand({
      Bucket: config.storage.aws.bucket,
      Key: key,
      ContentType: mimeType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  getPublicUrl(key: string): string {
    const url = config.storage.provider === 'aws'
      ? `https://${config.storage.aws.bucket}.s3.${config.storage.aws.region}.amazonaws.com/${key}`
      : `${config.appUrl}/uploads-static/${key}`;
    logger.debug(`Generated public URL for key ${key}: ${url}`);
    return url;
  }

  // ─── Private ─────────────────────────────────────────────

  private async uploadToS3(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: config.storage.aws.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
      CacheControl: 'max-age=31536000',
    });

    await this.s3Client!.send(command);
    logger.debug(`Uploaded to S3: ${key}`);

    return {
      url: this.getPublicUrl(key),
      key,
      size: buffer.length,
      mimeType,
    };
  }

  private async uploadToLocal(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult> {
    const filePath = join(config.storage.localUploadDir, key);
    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      const stream = createWriteStream(filePath);
      stream.write(buffer);
      stream.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    logger.debug(`Saved locally: ${filePath}`);

    return {
      url: this.getPublicUrl(key),
      key,
      size: buffer.length,
      mimeType,
    };
  }

  private async deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: config.storage.aws.bucket,
      Key: key,
    });
    await this.s3Client!.send(command);
  }

  private deleteFromLocal(key: string): void {
    const filePath = join(config.storage.localUploadDir, key);
    if (existsSync(filePath)) unlinkSync(filePath);
  }

  private mimeToExt(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
    };
    return map[mime] ?? '.bin';
  }
}

export const storageService = new StorageService();
