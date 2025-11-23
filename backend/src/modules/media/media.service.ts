import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import {
  MediaType,
  MediaConfig,
  UploadedMediaFile,
  MediaUploadResult,
  WhatsAppMediaUploadResponse,
} from './interfaces/media.interface';
import {
  InvalidFileTypeException,
  FileSizeExceededException,
  MediaUploadException,
} from './exceptions/media.exception';
import { WhatsAppApiService } from '../whatsapp/services/whatsapp-api.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly mediaConfig: MediaConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsAppApiService: WhatsAppApiService,
  ) {
    // Initialize media configuration
    this.mediaConfig = {
      maxFileSize:
        this.configService.get<number>('media.maxFileSize') || 16 * 1024 * 1024, // 16MB default
      allowedMimeTypes: {
        image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        video: ['video/mp4', 'video/3gpp', 'video/quicktime'],
        audio: [
          'audio/aac',
          'audio/mp4',
          'audio/mpeg',
          'audio/amr',
          'audio/ogg',
        ],
        document: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
        ],
      },
    };
  }

  /**
   * Upload media file to WhatsApp servers
   */
  async uploadMedia(file: UploadedMediaFile): Promise<MediaUploadResult> {
    this.logger.log(`Starting media upload for file: ${file.originalname}`);

    try {
      // Validate file
      this.validateFile(file);

      // Determine media type
      const mediaType = this.determineMediaType(file.mimetype);

      // Upload to WhatsApp
      const whatsAppResponse = await this.uploadToWhatsApp(file);

      // Build result
      const result: MediaUploadResult = {
        mediaId: whatsAppResponse.id,
        mediaUrl: whatsAppResponse.url,
        mediaType,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      };

      this.logger.log(
        `Media uploaded successfully. Media ID: ${result.mediaId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Media upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: UploadedMediaFile): void {
    // Check file size
    if (file.size > this.mediaConfig.maxFileSize) {
      throw new FileSizeExceededException(
        file.originalname,
        file.size,
        this.mediaConfig.maxFileSize,
      );
    }

    // Check MIME type
    const mediaType = this.determineMediaType(file.mimetype);
    const allowedTypes = this.mediaConfig.allowedMimeTypes[mediaType];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new InvalidFileTypeException(
        file.originalname,
        file.mimetype,
        allowedTypes,
      );
    }

    this.logger.debug(
      `File validation passed for ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
    );
  }

  /**
   * Determine media type from MIME type
   */
  private determineMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) {
      return MediaType.IMAGE;
    } else if (mimeType.startsWith('video/')) {
      return MediaType.VIDEO;
    } else if (mimeType.startsWith('audio/')) {
      return MediaType.AUDIO;
    } else {
      return MediaType.DOCUMENT;
    }
  }

  /**
   * Upload file to WhatsApp Media API
   */
  private async uploadToWhatsApp(
    file: UploadedMediaFile,
  ): Promise<WhatsAppMediaUploadResponse> {
    try {
      const phoneNumberId = this.whatsAppApiService.getPhoneNumberId();
      const endpoint = `/${phoneNumberId}/media`;

      // Create form data
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      formData.append('messaging_product', 'whatsapp');

      this.logger.debug(`Uploading to WhatsApp endpoint: ${endpoint}`);

      // Upload using WhatsApp API service with custom headers
      const response =
        await this.whatsAppApiService.post<WhatsAppMediaUploadResponse>(
          endpoint,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
          },
        );

      return response;
    } catch (error) {
      this.logger.error('WhatsApp media upload failed:', error);
      throw new MediaUploadException(
        'Failed to upload media to WhatsApp servers',
        'WHATSAPP_UPLOAD_FAILED',
        500,
        { originalError: error.message },
      );
    }
  }

  /**
   * Get media configuration
   */
  getMediaConfig(): MediaConfig {
    return this.mediaConfig;
  }

  /**
   * Check if MIME type is allowed
   */
  isAllowedMimeType(mimeType: string): boolean {
    const allAllowedTypes = Object.values(
      this.mediaConfig.allowedMimeTypes,
    ).flat();
    return allAllowedTypes.includes(mimeType);
  }

  /**
   * Get maximum file size
   */
  getMaxFileSize(): number {
    return this.mediaConfig.maxFileSize;
  }

  /**
   * Get allowed MIME types for a specific media type
   */
  getAllowedMimeTypes(mediaType: MediaType): string[] {
    return this.mediaConfig.allowedMimeTypes[mediaType] || [];
  }
}
