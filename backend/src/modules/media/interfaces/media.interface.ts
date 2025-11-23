export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

export interface MediaConfig {
  maxFileSize: number;
  allowedMimeTypes: {
    image: string[];
    video: string[];
    audio: string[];
    document: string[];
  };
}

export interface UploadedMediaFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface MediaUploadResult {
  mediaId: string;
  mediaUrl?: string;
  mediaType: MediaType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface WhatsAppMediaUploadResponse {
  id: string;
  url?: string;
}
