import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { WhatsAppConfig } from '../../../entities/whatsapp-config.entity';

/**
 * Webhook Signature Verification Service
 * Validates incoming webhook requests from WhatsApp using HMAC-SHA256 signature verification
 */
@Injectable()
export class WebhookSignatureService {
  private readonly logger = new Logger(WebhookSignatureService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(WhatsAppConfig)
    private readonly configRepository: Repository<WhatsAppConfig>,
  ) {}

  /**
   * Verify the webhook signature using HMAC-SHA256
   * @param signature - The X-Hub-Signature-256 header value from the webhook request
   * @param payload - The raw request body as a string or Buffer
   * @returns true if signature is valid, false otherwise
   */
  async verifySignature(signature: string, payload: string | Buffer): Promise<boolean> {
    const appSecret = await this.getAppSecret();

    if (!appSecret) {
      this.logger.error('Cannot verify signature: App secret not configured in database or environment');
      return false;
    }

    if (!signature) {
      this.logger.warn('No signature provided in webhook request');
      return false;
    }

    try {
      // Remove 'sha256=' prefix if present
      const signatureHash = signature.startsWith('sha256=')
        ? signature.substring(7)
        : signature;

      // Create HMAC using app secret
      const hmac = crypto.createHmac('sha256', appSecret);

      // Update with payload
      const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
      hmac.update(payloadString, 'utf8');

      // Get the computed signature
      const computedSignature = hmac.digest('hex');

      // Compare signatures using timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(computedSignature, 'hex'),
      );

      if (!isValid) {
        this.logger.warn('Webhook signature verification failed');
        this.logger.debug(`Expected: ${computedSignature}`);
        this.logger.debug(`Received: ${signatureHash}`);
      } else {
        this.logger.debug('Webhook signature verified successfully');
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  /**
   * Verify webhook signature and throw exception if invalid
   * @param signature - The X-Hub-Signature-256 header value
   * @param payload - The raw request body
   * @throws UnauthorizedException if signature is invalid
   */
  async verifySignatureOrThrow(signature: string, payload: string | Buffer): Promise<void> {
    const isValid = await this.verifySignature(signature, payload);

    if (!isValid) {
      throw new UnauthorizedException(
        'Invalid webhook signature. Request may not be from WhatsApp.',
      );
    }
  }

  /**
   * Verify the webhook verification token during initial setup
   * First checks database config, then falls back to environment variable
   * @param token - The hub.verify_token from the verification request
   * @returns true if token matches configured verify token
   */
  async verifyToken(token: string): Promise<boolean> {
    // First try to get verify token from database
    const config = await this.configRepository.findOne({
      where: { isActive: true },
    });

    let verifyToken = config?.webhookVerifyToken;

    // Fallback to environment variable
    if (!verifyToken) {
      verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    }

    if (!verifyToken) {
      this.logger.error('Webhook verify token not configured in database or environment');
      return false;
    }

    const isValid = token === verifyToken;

    if (!isValid) {
      this.logger.warn('Webhook verification token mismatch');
    } else {
      this.logger.log('Webhook verification token validated successfully');
    }

    return isValid;
  }

  /**
   * Get app secret from database or environment
   */
  async getAppSecret(): Promise<string | null> {
    const config = await this.configRepository.findOne({
      where: { isActive: true },
    });

    return config?.appSecret || this.configService.get<string>('WHATSAPP_APP_SECRET') || null;
  }
}
