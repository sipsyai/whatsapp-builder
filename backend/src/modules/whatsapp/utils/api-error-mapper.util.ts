import { HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';

interface MappedError {
  message: string;
  code: string;
  statusCode: HttpStatus;
  details?: any;
}

export class ApiErrorMapper {
  private static readonly ERROR_MAP: Record<number, string> = {
    131047: 'Re-engagement message required (24-hour window closed)',
    131026: 'Message undeliverable',
    131031: 'Rate limit exceeded',
    132000: 'Template paused due to quality issues',
    133016: 'Phone number not registered on WhatsApp',
    136000: 'Template does not exist',
    136001: 'Template is paused',
    136015: 'Template is disabled',
    80007: 'Rate limit hit',
    100: 'Invalid parameter',
    190: 'Access token has expired',
    368: 'Temporarily blocked for policies violations',
  };

  static mapError(error: AxiosError): MappedError {
    const responseData: any = error.response?.data;
    const errorCode = responseData?.error?.code;
    const errorMessage = responseData?.error?.message;

    const mappedMessage = errorCode
      ? this.ERROR_MAP[errorCode] || errorMessage
      : error.message;

    return {
      message: mappedMessage,
      code: errorCode?.toString() || 'UNKNOWN_ERROR',
      statusCode: this.mapHttpStatus(error.response?.status),
      details: responseData?.error,
    };
  }

  private static mapHttpStatus(status?: number): HttpStatus {
    if (!status) return HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= 500) return HttpStatus.SERVICE_UNAVAILABLE;
    if (status === 429) return HttpStatus.TOO_MANY_REQUESTS;
    if (status === 401 || status === 403) return HttpStatus.UNAUTHORIZED;
    if (status === 404) return HttpStatus.NOT_FOUND;
    return HttpStatus.BAD_REQUEST;
  }
}
