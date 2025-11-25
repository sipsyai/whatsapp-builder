import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { WhatsAppConfigService } from './services/whatsapp-config.service';
import {
  CreateWhatsAppConfigDto,
  WhatsAppConfigResponseDto,
  TestConnectionDto,
  TestConnectionResponseDto,
  WebhookUrlResponseDto,
} from './dto/requests/whatsapp-config.dto';

@ApiTags('WhatsApp Config')
@Controller('api/whatsapp/config')
export class WhatsAppConfigController {
  constructor(
    private readonly whatsappConfigService: WhatsAppConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get WhatsApp configuration', description: 'Retrieves the active WhatsApp Business API configuration' })
  @ApiResponse({ status: 200, description: 'Configuration returned successfully', type: WhatsAppConfigResponseDto })
  @ApiResponse({ status: 404, description: 'No configuration found' })
  async getConfig(): Promise<WhatsAppConfigResponseDto> {
    const config = await this.whatsappConfigService.getActiveConfig();

    if (!config) {
      throw new NotFoundException('No WhatsApp configuration found');
    }

    return config;
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save WhatsApp configuration', description: 'Creates or updates WhatsApp Business API configuration' })
  @ApiBody({ type: CreateWhatsAppConfigDto })
  @ApiResponse({ status: 200, description: 'Configuration saved successfully', type: WhatsAppConfigResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid configuration data' })
  async saveConfig(
    @Body() dto: CreateWhatsAppConfigDto,
  ): Promise<WhatsAppConfigResponseDto> {
    return this.whatsappConfigService.saveConfig(dto);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test WhatsApp connection', description: 'Tests the WhatsApp API connection with provided or saved credentials' })
  @ApiBody({ type: TestConnectionDto })
  @ApiResponse({ status: 200, description: 'Connection test completed', type: TestConnectionResponseDto })
  async testConnection(
    @Body() dto: TestConnectionDto,
  ): Promise<TestConnectionResponseDto> {
    return this.whatsappConfigService.testConnection(
      dto.phoneNumberId,
      dto.accessToken,
    );
  }

  @Get('webhook-url')
  @ApiOperation({ summary: 'Get webhook URL', description: 'Returns the webhook URL and verify token for WhatsApp webhook configuration' })
  @ApiResponse({ status: 200, description: 'Webhook URL returned successfully', type: WebhookUrlResponseDto })
  async getWebhookUrl(): Promise<WebhookUrlResponseDto> {
    return this.whatsappConfigService.getWebhookUrl();
  }
}
