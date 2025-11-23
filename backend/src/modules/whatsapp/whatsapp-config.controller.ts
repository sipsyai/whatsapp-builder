import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { WhatsAppConfigService } from './services/whatsapp-config.service';
import {
  CreateWhatsAppConfigDto,
  WhatsAppConfigResponseDto,
  TestConnectionDto,
  TestConnectionResponseDto,
  WebhookUrlResponseDto,
} from './dto/requests/whatsapp-config.dto';

@Controller('api/whatsapp/config')
export class WhatsAppConfigController {
  constructor(
    private readonly whatsappConfigService: WhatsAppConfigService,
  ) {}

  /**
   * GET /api/whatsapp/config
   * Get the active WhatsApp configuration
   */
  @Get()
  async getConfig(): Promise<WhatsAppConfigResponseDto> {
    const config = await this.whatsappConfigService.getActiveConfig();

    if (!config) {
      throw new NotFoundException('No WhatsApp configuration found');
    }

    return config;
  }

  /**
   * POST /api/whatsapp/config
   * Save or update WhatsApp configuration
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async saveConfig(
    @Body() dto: CreateWhatsAppConfigDto,
  ): Promise<WhatsAppConfigResponseDto> {
    return this.whatsappConfigService.saveConfig(dto);
  }

  /**
   * POST /api/whatsapp/config/test
   * Test WhatsApp API connection
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testConnection(
    @Body() dto: TestConnectionDto,
  ): Promise<TestConnectionResponseDto> {
    return this.whatsappConfigService.testConnection(
      dto.phoneNumberId,
      dto.accessToken,
    );
  }

  /**
   * GET /api/whatsapp/config/webhook-url
   * Get webhook URL and verify token
   */
  @Get('webhook-url')
  async getWebhookUrl(): Promise<WebhookUrlResponseDto> {
    return this.whatsappConfigService.getWebhookUrl();
  }
}
