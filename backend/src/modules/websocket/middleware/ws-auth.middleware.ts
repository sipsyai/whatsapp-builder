import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';

/**
 * WebSocket Authentication Middleware
 *
 * Validates JWT tokens for WebSocket connections.
 * Token can be provided via:
 * 1. socket.handshake.auth.token (preferred)
 * 2. socket.handshake.headers.authorization (Bearer token)
 */
@Injectable()
export class WsAuthMiddleware {
  private readonly logger = new Logger(WsAuthMiddleware.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Validate WebSocket connection
   * @param socket - Socket.IO client socket
   * @param next - Callback to continue or reject connection
   */
  use(socket: Socket, next: (err?: Error) => void) {
    try {
      // Extract token from auth object or authorization header
      const token = this.extractToken(socket);

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        return next(new Error('Authentication failed: No token provided'));
      }

      try {
        // Verify JWT token
        const decoded = this.jwtService.verify<JwtPayload>(token);

        // Attach user information to socket
        socket.data.userId = decoded.sub;
        socket.data.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
        };

        this.logger.log(`Client authenticated: ${socket.id} (User: ${decoded.sub})`);
        next();
      } catch (error) {
        this.logger.warn(`Invalid token: ${error.message}`);
        return next(new Error('Authentication failed: Invalid token'));
      }
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Extract token from socket handshake
   */
  private extractToken(socket: Socket): string | null {
    // First, check auth object (preferred method)
    if (socket.handshake.auth?.token) {
      return socket.handshake.auth.token;
    }

    // Fallback to authorization header
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
