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
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UploadMediaDto, MediaUploadResponseDto } from './dto/upload-media.dto';
import { UploadedMediaFile } from './interfaces/media.interface';
import { NoFileProvidedException } from './exceptions/media.exception';

@ApiTags('Media')
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
  @ApiOperation({
    summary: 'Upload media file',
    description: 'Uploads a media file (image, video, audio, or document) to WhatsApp servers',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Media file to upload',
        },
        mediaType: {
          type: 'string',
          enum: ['image', 'video', 'audio', 'document'],
          description: 'Type of media being uploaded',
        },
        caption: {
          type: 'string',
          description: 'Caption for the media file',
        },
        fileName: {
          type: 'string',
          description: 'Custom file name',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Media uploaded successfully', type: MediaUploadResponseDto })
  @ApiResponse({ status: 400, description: 'No file provided or invalid file type' })
  @ApiResponse({ status: 413, description: 'File too large' })
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
  @ApiOperation({
    summary: 'Get media configuration',
    description: 'Returns the media upload configuration including max file size and supported formats',
  })
  @ApiResponse({
    status: 200,
    description: 'Media configuration returned successfully',
    schema: {
      type: 'object',
      properties: {
        maxFileSize: { type: 'number', example: 16777216 },
        maxFileSizeMB: { type: 'string', example: '16.00' },
        allowedMimeTypes: {
          type: 'object',
          properties: {
            image: { type: 'array', items: { type: 'string' } },
            video: { type: 'array', items: { type: 'string' } },
            audio: { type: 'array', items: { type: 'string' } },
            document: { type: 'array', items: { type: 'string' } },
          },
        },
        supportedFormats: {
          type: 'object',
          properties: {
            image: { type: 'array', items: { type: 'string' }, example: ['JPEG', 'PNG', 'WebP'] },
            video: { type: 'array', items: { type: 'string' }, example: ['MP4', '3GPP', 'QuickTime'] },
            audio: { type: 'array', items: { type: 'string' }, example: ['AAC', 'MP4', 'MPEG', 'AMR', 'OGG'] },
            document: { type: 'array', items: { type: 'string' }, example: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX'] },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the media upload service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'media-upload' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
      },
    },
  })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'media-upload',
      timestamp: new Date().toISOString(),
    };
  }
}
