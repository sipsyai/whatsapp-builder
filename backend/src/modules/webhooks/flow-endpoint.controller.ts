import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowEndpointService } from './services/flow-endpoint.service';
import { FlowEncryptionService } from '../whatsapp/services/flow-encryption.service';
import { WhatsAppConfig } from '../../entities/whatsapp-config.entity';

/**
 * WhatsApp Flow Endpoint Controller
 * Handles encrypted data exchange requests from WhatsApp Flows
 *
 * Endpoints:
 * - POST /api/webhooks/flow-endpoint - Handle Flow data exchange requests
 */
@Controller('api/webhooks/flow-endpoint')
export class FlowEndpointController {
  private readonly logger = new Logger(FlowEndpointController.name);

  constructor(
    private readonly flowEndpointService: FlowEndpointService,
    private readonly encryptionService: FlowEncryptionService,
    @InjectRepository(WhatsAppConfig)
    private readonly configRepo: Repository<WhatsAppConfig>,
  ) {}

  /**
   * POST /api/webhooks/flow-endpoint
   * Handle encrypted Flow data exchange requests
   *
   * Flow actions:
   * - INIT: Initial screen data request
   * - data_exchange: Screen submission, return next screen or SUCCESS
   * - ping: Health check
   * - BACK: Navigate back (optional handling)
   * - error_notification: Client-side error notification
   *
   * @param req - Raw request for signature verification
   * @param signature - X-Hub-Signature-256 header
   * @param body - Encrypted Flow request body
   * @returns Encrypted response
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleFlowRequest(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ): Promise<string> {
    try {
      this.logger.log('Flow endpoint request received');

      // Get app secret from config for signature verification
      const config = await this.configRepo.findOne({
        where: { isActive: true },
      });

      if (!config?.appSecret) {
        this.logger.error('App secret not configured');
        throw new UnprocessableEntityException('Server configuration error');
      }

      // Verify request signature
      const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(body);
      const isValidSignature = this.encryptionService.verifySignature(
        rawBody,
        signature,
        config.appSecret,
      );

      if (!isValidSignature) {
        this.logger.error('Invalid request signature');
        throw new UnprocessableEntityException('Invalid signature');
      }

      // Get private key from environment
      const privateKey = process.env.WHATSAPP_FLOW_PRIVATE_KEY;
      if (!privateKey) {
        this.logger.error('Flow private key not configured');
        throw new UnprocessableEntityException('Server configuration error');
      }

      // Decrypt request
      const { decryptedBody, aesKeyBuffer, initialVectorBuffer } =
        this.encryptionService.decryptRequest(
          body.encrypted_flow_data,
          body.encrypted_aes_key,
          body.initial_vector,
          privateKey,
        );

      this.logger.debug(`Flow action: ${decryptedBody.action}`);
      this.logger.debug(`Screen: ${decryptedBody.screen || 'N/A'}`);

      // Process request based on action
      let response: any;

      switch (decryptedBody.action) {
        case 'ping':
          // Health check
          response = {
            data: {
              status: 'active',
            },
          };
          this.logger.log('Health check - responding with active status');
          break;

        case 'INIT':
          // Initial screen request
          response = await this.flowEndpointService.handleInit(decryptedBody);
          this.logger.log(`INIT processed - returning screen: ${response.screen}`);
          break;

        case 'data_exchange':
          // Screen submission - process and return next screen
          response = await this.flowEndpointService.handleDataExchange(decryptedBody);
          this.logger.log(
            `data_exchange processed - returning ${response.screen === 'SUCCESS' ? 'SUCCESS' : 'screen: ' + response.screen}`,
          );
          break;

        case 'BACK':
          // Navigate back (optional - can return previous screen or current)
          response = await this.flowEndpointService.handleBack(decryptedBody);
          this.logger.log('BACK action processed');
          break;

        case 'error_notification':
          // Client-side error notification
          this.logger.error('Client error notification:', decryptedBody.data);
          response = {
            data: {
              acknowledged: true,
            },
          };
          break;

        default:
          this.logger.warn(`Unknown action: ${decryptedBody.action}`);
          throw new UnprocessableEntityException('Unknown action');
      }

      // Encrypt response
      const encryptedResponse = this.encryptionService.encryptResponse(
        response,
        aesKeyBuffer,
        initialVectorBuffer,
      );

      return encryptedResponse;
    } catch (error) {
      this.logger.error('Flow endpoint error:', error.message);

      // Return HTTP 421 for decryption errors (as per WhatsApp spec)
      if (error.message.includes('Decryption failed')) {
        throw new UnprocessableEntityException('Decryption failed');
      }

      throw error;
    }
  }
}
