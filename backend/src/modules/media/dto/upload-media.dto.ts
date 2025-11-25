import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '../interfaces/media.interface';

export class UploadMediaDto {
  @ApiPropertyOptional({
    description: 'Type of media being uploaded',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @ApiPropertyOptional({
    description: 'Caption for the media file',
    example: 'Product image for catalog',
  })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional({
    description: 'Custom file name for the uploaded media',
    example: 'product-photo.jpg',
  })
  @IsString()
  @IsOptional()
  fileName?: string;
}

export class MediaUploadResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the uploaded media',
    example: 'wamid.HBgNOTA1MzI...',
  })
  mediaId: string;

  @ApiPropertyOptional({
    description: 'URL to access the uploaded media',
    example: 'https://lookaside.fbsbx.com/whatsapp_business/...',
  })
  mediaUrl?: string;

  @ApiProperty({
    description: 'Type of the uploaded media',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  mediaType: MediaType;

  @ApiProperty({
    description: 'Name of the uploaded file',
    example: 'product-photo.jpg',
  })
  fileName: string;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 102400,
  })
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the uploaded file',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Timestamp when the media was uploaded',
    example: '2024-01-15T10:30:00.000Z',
  })
  uploadedAt: Date;
}
