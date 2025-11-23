import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WebhookSignatureService } from './services/webhook-signature.service';
import { WebhookParserService } from './services/webhook-parser.service';
import { WebhookProcessorService } from './services/webhook-processor.service';
import { WebhookPayloadDto, WebhookVerificationDto } from './dto/webhook-entry.dto';

/**
 * WhatsApp Webhooks Controller
 * Handles incoming webhook requests from WhatsApp Business API
 *
 * Endpoints:
 * - GET /api/webhooks/whatsapp - Webhook verification (setup)
 * - POST /api/webhooks/whatsapp - Receive incoming messages and status updates
 */
@Controller('api/webhooks/whatsapp')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly signatureService: WebhookSignatureService,
    private readonly parserService: WebhookParserService,
    private readonly processorService: WebhookProcessorService,
  ) {}

  /**
   * GET /api/webhooks/whatsapp
   * Webhook verification endpoint for WhatsApp setup
   *
   * When you configure a webhook URL in the WhatsApp Business API,
   * WhatsApp sends a GET request to verify the endpoint.
   *
   * @param query - Contains hub.mode, hub.verify_token, and hub.challenge
   * @returns The hub.challenge value if verification succeeds
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  verifyWebhook(@Query() query: WebhookVerificationDto): string {
    this.logger.log('Webhook verification request received');

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    // Log the verification attempt
    this.logger.debug(`Mode: ${mode}, Token provided: ${!!token}`);

    // Check if mode and token are present
    if (!mode || !token) {
      this.logger.error('Missing hub.mode or hub.verify_token');
      throw new BadRequestException('Missing required parameters');
    }

    // Verify that mode is 'subscribe'
    if (mode !== 'subscribe') {
      this.logger.error(`Invalid mode: ${mode}`);
      throw new BadRequestException('Invalid hub.mode');
    }

    // Verify the token matches our configuration
    const isValidToken = this.signatureService.verifyToken(token);

    if (!isValidToken) {
      this.logger.error('Webhook verification token mismatch');
      throw new BadRequestException('Invalid verification token');
    }

    // Verification successful - return the challenge
    this.logger.log('Webhook verified successfully');
    return challenge;
  }

  /**
   * POST /api/webhooks/whatsapp
   * Receive incoming messages, status updates, and other events from WhatsApp
   *
   * @param req - Raw request object (needed to access raw body for signature verification)
   * @param signature - X-Hub-Signature-256 header for request verification
   * @param payload - The webhook payload from WhatsApp
   * @returns Success response
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async receiveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: WebhookPayloadDto,
  ): Promise<{ success: boolean }> {
    this.logger.log('Webhook payload received');

    // Get raw body for signature verification
    const rawBody = req.rawBody;

    if (!rawBody) {
      this.logger.warn('No raw body available for signature verification');
      // In production, you should require signature verification
      // For development, you might want to allow requests without it
      // Uncomment the line below to enforce signature verification:
      // throw new BadRequestException('Raw body required for signature verification');
    } else {
      // Verify webhook signature
      this.signatureService.verifySignatureOrThrow(signature, rawBody);
    }

    // Validate payload structure
    if (!payload || !payload.entry || payload.entry.length === 0) {
      this.logger.warn('Invalid webhook payload structure');
      throw new BadRequestException('Invalid payload structure');
    }

    // Process each entry in the webhook
    for (const entry of payload.entry) {
      if (!entry.changes || entry.changes.length === 0) {
        continue;
      }

      for (const change of entry.changes) {
        try {
          await this.processChange(change.value);
        } catch (error) {
          this.logger.error(
            `Error processing webhook change: ${error.message}`,
            error.stack,
          );
          // Continue processing other changes even if one fails
        }
      }
    }

    // Always return 200 OK to acknowledge receipt
    return { success: true };
  }

  /**
   * Process a webhook change (messages or status updates)
   */
  private async processChange(value: any): Promise<void> {
    // Parse and process incoming messages
    if (value.messages && value.messages.length > 0) {
      this.logger.log(`Processing ${value.messages.length} incoming message(s)`);

      const parsedMessages = this.parserService.parseMessages(value);

      if (parsedMessages.length > 0) {
        await this.processorService.processMessages(parsedMessages);
        this.logger.log(`Successfully processed ${parsedMessages.length} message(s)`);
      }
    }

    // Parse and process status updates
    if (value.statuses && value.statuses.length > 0) {
      this.logger.log(`Processing ${value.statuses.length} status update(s)`);

      const parsedStatuses = this.parserService.parseStatusUpdates(value);

      if (parsedStatuses.length > 0) {
        await this.processorService.processStatusUpdates(parsedStatuses);
        this.logger.log(`Successfully processed ${parsedStatuses.length} status update(s)`);
      }
    }

    // Log if there are errors in the webhook
    if (value.errors && value.errors.length > 0) {
      this.logger.error('Webhook contains errors:', JSON.stringify(value.errors));
    }
  }
}
