import { HttpException, HttpStatus } from '@nestjs/common';

export class WhatsAppApiException extends HttpException {
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
