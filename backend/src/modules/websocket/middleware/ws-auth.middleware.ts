import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

/**
 * WebSocket Authentication Middleware
 *
 * This middleware validates client connections before they're fully established.
 * In production, you should:
 * 1. Install @nestjs/jwt: npm install @nestjs/jwt
 * 2. Inject JwtService
 * 3. Verify the token from socket.handshake.auth.token
 * 4. Attach user information to socket.data.user
 */
@Injectable()
export class WsAuthMiddleware {
  private readonly logger = new Logger(WsAuthMiddleware.name);

  /**
   * Validate WebSocket connection
   * @param socket - Socket.IO client socket
   * @param next - Callback to continue or reject connection
   */
  use(socket: Socket, next: (err?: Error) => void) {
    try {
      // Development mode: Accept userId from query params
      const userId = socket.handshake.query.userId as string;

      if (!userId) {
        this.logger.warn(`Connection rejected: No userId provided`);
        return next(new Error('Authentication failed: userId required'));
      }

      // Attach user information to socket
      socket.data.userId = userId;

      this.logger.log(`Client authenticated: ${socket.id} (User: ${userId})`);
      next();

      // TODO: Production implementation with JWT
      /*
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication failed: No token provided'));
      }

      try {
        const decoded = this.jwtService.verify(token);
        socket.data.userId = decoded.userId;
        socket.data.user = decoded;

        this.logger.log(`Client authenticated: ${socket.id} (User: ${decoded.userId})`);
        next();
      } catch (error) {
        this.logger.warn(`Invalid token: ${error.message}`);
        return next(new Error('Authentication failed: Invalid token'));
      }
      */
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      next(new Error('Authentication failed'));
    }
  }
}
