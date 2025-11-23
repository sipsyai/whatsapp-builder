import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpStatus,
  HttpCode,
  Get,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto, MediaUploadResponseDto } from './dto/upload-media.dto';
import { UploadedMediaFile } from './interfaces/media.interface';
import { NoFileProvidedException } from './exceptions/media.exception';

@Controller('api/upload')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload media file
   * POST /api/upload
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadMediaDto: UploadMediaDto,
  ): Promise<MediaUploadResponseDto> {
    this.logger.log('Media upload request received');

    if (!file) {
      throw new NoFileProvidedException();
    }

    // Convert Express.Multer.File to UploadedMediaFile
    const uploadedFile: UploadedMediaFile = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    const result = await this.mediaService.uploadMedia(uploadedFile);

    return {
      mediaId: result.mediaId,
      mediaUrl: result.mediaUrl,
      mediaType: result.mediaType,
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
      uploadedAt: result.uploadedAt,
    };
  }

  /**
   * Get media configuration and supported types
   * GET /api/upload/config
   */
  @Get('config')
  async getMediaConfig() {
    const config = this.mediaService.getMediaConfig();

    return {
      maxFileSize: config.maxFileSize,
      maxFileSizeMB: (config.maxFileSize / 1024 / 1024).toFixed(2),
      allowedMimeTypes: config.allowedMimeTypes,
      supportedFormats: {
        image: ['JPEG', 'PNG', 'WebP'],
        video: ['MP4', '3GPP', 'QuickTime'],
        audio: ['AAC', 'MP4', 'MPEG', 'AMR', 'OGG'],
        document: [
          'PDF',
          'DOC',
          'DOCX',
          'XLS',
          'XLSX',
          'PPT',
          'PPTX',
          'TXT',
          'CSV',
        ],
      },
    };
  }

  /**
   * Health check endpoint
   * GET /api/upload/health
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      service: 'media-upload',
      timestamp: new Date().toISOString(),
    };
  }
}
