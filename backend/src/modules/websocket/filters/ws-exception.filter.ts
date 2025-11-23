import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    this.logger.error('WebSocket exception:', exception);

    // Handle different types of exceptions
    if (exception instanceof WsException) {
      client.emit('error', {
        status: 'error',
        message: exception.message,
        data: data,
      });
    } else if (exception instanceof HttpException) {
      client.emit('error', {
        status: 'error',
        message: exception.message,
        statusCode: exception.getStatus(),
        data: data,
      });
    } else {
      client.emit('error', {
        status: 'error',
        message: 'Internal server error',
        data: data,
      });
    }

    // Call parent filter
    super.catch(exception, host);
  }
}
