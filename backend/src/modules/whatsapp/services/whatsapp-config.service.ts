import { Injectable, Logger, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WhatsAppConfig } from '../../../entities/whatsapp-config.entity';
import {
  CreateWhatsAppConfigDto,
  WhatsAppConfigResponseDto,
  TestConnectionResponseDto,
  WebhookUrlResponseDto,
} from '../dto/requests/whatsapp-config.dto';
import { WhatsAppApiService } from './whatsapp-api.service';

@Injectable()
export class WhatsAppConfigService {
  private readonly logger = new Logger(WhatsAppConfigService.name);

  constructor(
    @InjectRepository(WhatsAppConfig)
    private readonly configRepository: Repository<WhatsAppConfig>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => WhatsAppApiService))
    private readonly whatsappApiService: WhatsAppApiService,
  ) {}

  /**
   * Get the active WhatsApp configuration
   */
  async getActiveConfig(): Promise<WhatsAppConfigResponseDto | null> {
    const config = await this.configRepository.findOne({
      where: { isActive: true },
    });

    if (!config) {
      return null;
    }

    return this.mapToResponseDto(config);
  }

  /**
   * Save or update WhatsApp configuration
   * Only one active config should exist at a time
   */
  async saveConfig(
    dto: CreateWhatsAppConfigDto,
  ): Promise<WhatsAppConfigResponseDto> {
    this.logger.log('Saving WhatsApp configuration');

    // Check if there's an existing active config
    const existingConfig = await this.configRepository.findOne({
      where: { isActive: true },
    });

    let savedConfig: WhatsAppConfig;

    if (existingConfig) {
      // Update existing config
      this.logger.log(
        `Updating existing config with ID: ${existingConfig.id}`,
      );
      existingConfig.phoneNumberId = dto.phoneNumberId;
      existingConfig.businessAccountId = dto.businessAccountId;
      existingConfig.accessToken = dto.accessToken;
      existingConfig.webhookVerifyToken = dto.webhookVerifyToken;
      existingConfig.appSecret = dto.appSecret;
      existingConfig.backendUrl = dto.backendUrl;
      existingConfig.flowEndpointUrl = dto.flowEndpointUrl;
      existingConfig.apiVersion = dto.apiVersion || 'v24.0';

      savedConfig = await this.configRepository.save(existingConfig);
    } else {
      // Create new config
      this.logger.log('Creating new config');
      const newConfig = this.configRepository.create({
        phoneNumberId: dto.phoneNumberId,
        businessAccountId: dto.businessAccountId,
        accessToken: dto.accessToken,
        webhookVerifyToken: dto.webhookVerifyToken,
        appSecret: dto.appSecret,
        backendUrl: dto.backendUrl,
        flowEndpointUrl: dto.flowEndpointUrl,
        apiVersion: dto.apiVersion || 'v24.0',
        isActive: true,
      });

      savedConfig = await this.configRepository.save(newConfig);
    }

    this.logger.log(`Configuration saved successfully: ${savedConfig.id}`);

    // Reload the WhatsAppApiService configuration
    await this.whatsappApiService.reloadConfiguration();

    return this.mapToResponseDto(savedConfig);
  }

  /**
   * Test WhatsApp API connection
   * If phoneNumberId and accessToken are not provided, use the saved config
   */
  async testConnection(
    phoneNumberId?: string,
    accessToken?: string,
  ): Promise<TestConnectionResponseDto> {
    let testPhoneNumberId = phoneNumberId;
    let testAccessToken = accessToken;

    // If not provided, get from saved config
    if (!testPhoneNumberId || !testAccessToken) {
      const savedConfig = await this.configRepository.findOne({
        where: { isActive: true },
      });

      if (!savedConfig) {
        return {
          success: false,
          message: 'No configuration found',
          error: 'Please save a configuration first or provide test credentials',
        };
      }

      testPhoneNumberId = savedConfig.phoneNumberId;
      testAccessToken = savedConfig.accessToken;
    }

    try {
      this.logger.log(
        `Testing WhatsApp API connection for phone number: ${testPhoneNumberId}`,
      );

      const apiVersion =
        this.configService.get<string>('whatsapp.apiVersion') || 'v24.0';
      const baseUrl =
        this.configService.get<string>('whatsapp.baseUrl') ||
        'https://graph.facebook.com';

      // Make a test call to WhatsApp API to get phone number details
      const response = await axios.get(
        `${baseUrl}/${apiVersion}/${testPhoneNumberId}`,
        {
          params: {
            fields: 'verified_name,display_phone_number',
          },
          headers: {
            Authorization: `Bearer ${testAccessToken}`,
          },
          timeout: 10000,
        },
      );

      this.logger.log('WhatsApp API connection test successful');

      return {
        success: true,
        message: 'Connection successful',
        phoneNumber: response.data.display_phone_number,
        verifiedName: response.data.verified_name,
      };
    } catch (error: any) {
      this.logger.error('WhatsApp API connection test failed:', error.message);

      let errorMessage = 'Connection failed';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: 'Connection failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Get webhook URL and verify token
   */
  async getWebhookUrl(): Promise<WebhookUrlResponseDto> {
    const config = await this.configRepository.findOne({
      where: { isActive: true },
    });

    // Use backendUrl from config if available, otherwise fallback to env variable
    const baseUrl =
      config?.backendUrl ||
      process.env.BACKEND_URL ||
      'https://api.yourdomain.com';
    const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;
    const flowEndpointUrl = `${baseUrl}/api/webhooks/flow-endpoint`;

    return {
      webhookUrl,
      flowEndpointUrl,
      verifyToken: config?.webhookVerifyToken || '',
    };
  }

  /**
   * Map entity to response DTO (exclude sensitive fields)
   */
  private mapToResponseDto(
    config: WhatsAppConfig,
  ): WhatsAppConfigResponseDto {
    return {
      id: config.id,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      webhookVerifyToken: config.webhookVerifyToken,
      backendUrl: config.backendUrl,
      flowEndpointUrl: config.flowEndpointUrl,
      apiVersion: config.apiVersion || 'v24.0',
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
