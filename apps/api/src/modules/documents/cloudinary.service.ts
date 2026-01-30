import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resourceType: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'ghana-lands',
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Cloudinary upload error: ${error.message}`);
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error('No result from Cloudinary'));
            return;
          }

          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            resourceType: result.resource_type,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadFromUrl(url: string, folder: string = 'ghana-lands'): Promise<CloudinaryUploadResult> {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder,
        resource_type: 'auto',
      });

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resourceType: result.resource_type,
      };
    } catch (error: any) {
      this.logger.error(`Cloudinary URL upload error: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error: any) {
      this.logger.error(`Cloudinary delete error: ${error.message}`);
      throw error;
    }
  }

  getSignedUrl(publicId: string, expiresInSeconds: number = 3600): string {
    const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    
    return cloudinary.url(publicId, {
      sign_url: true,
      type: 'authenticated',
      expires_at: timestamp,
    });
  }

  getPublicUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  }): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: options ? [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'fill',
          quality: options.quality || 'auto',
        },
      ] : undefined,
    });
  }

  getThumbnailUrl(publicId: string, width: number = 200, height: number = 200): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width,
          height,
          crop: 'thumb',
          gravity: 'auto',
        },
      ],
    });
  }
}
