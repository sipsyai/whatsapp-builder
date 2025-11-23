import { HttpException, HttpStatus } from '@nestjs/common';

export class MediaUploadException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode?: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: any,
  ) {
    super(
      {
        statusCode,
        message,
        errorCode,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

export class InvalidFileTypeException extends MediaUploadException {
  constructor(fileName: string, mimeType: string, allowedTypes: string[]) {
    super(
      `Invalid file type for '${fileName}'. Received '${mimeType}'. Allowed types: ${allowedTypes.join(', ')}`,
      'INVALID_FILE_TYPE',
      HttpStatus.BAD_REQUEST,
      { fileName, mimeType, allowedTypes },
    );
  }
}

export class FileSizeExceededException extends MediaUploadException {
  constructor(fileName: string, fileSize: number, maxSize: number) {
    super(
      `File '${fileName}' size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
      'FILE_SIZE_EXCEEDED',
      HttpStatus.BAD_REQUEST,
      { fileName, fileSize, maxSize },
    );
  }
}

export class NoFileProvidedException extends MediaUploadException {
  constructor() {
    super(
      'No file provided in the request',
      'NO_FILE_PROVIDED',
      HttpStatus.BAD_REQUEST,
    );
  }
}
