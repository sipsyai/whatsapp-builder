import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MediaType } from '../interfaces/media.interface';

export class UploadMediaDto {
  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsString()
  @IsOptional()
  fileName?: string;
}

export class MediaUploadResponseDto {
  mediaId: string;
  mediaUrl?: string;
  mediaType: MediaType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}
