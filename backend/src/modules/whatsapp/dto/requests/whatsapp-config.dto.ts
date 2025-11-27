import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWhatsAppConfigDto {
  @ApiProperty({ description: 'WhatsApp Business Phone Number ID', example: '123456789012345' })
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;

  @ApiProperty({ description: 'WhatsApp Business Account ID', example: '987654321098765' })
  @IsString()
  @IsNotEmpty()
  businessAccountId: string;

  @ApiProperty({ description: 'Permanent access token from Meta', example: 'EAABcd...' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ description: 'Webhook verification token', example: 'my_secure_verify_token' })
  @IsString()
  @IsNotEmpty()
  webhookVerifyToken: string;

  @ApiPropertyOptional({ description: 'App secret for signature verification', example: 'abc123def456...' })
  @IsString()
  @IsOptional()
  appSecret?: string;

  @ApiPropertyOptional({ description: 'Backend URL for webhook configuration', example: 'https://api.yourdomain.com' })
  @IsString()
  @IsOptional()
  @IsUrl()
  backendUrl?: string;

  @ApiPropertyOptional({ description: 'Flow endpoint URL for WhatsApp Flows', example: 'https://api.yourdomain.com/api/flows' })
  @IsString()
  @IsOptional()
  @IsUrl()
  flowEndpointUrl?: string;

  @ApiPropertyOptional({ description: 'WhatsApp API version', example: 'v20.0', default: 'v20.0' })
  @IsString()
  @IsOptional()
  apiVersion?: string;
}

export class WhatsAppConfigResponseDto {
  @ApiProperty({ description: 'Configuration UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'WhatsApp Business Phone Number ID', example: '123456789012345' })
  phoneNumberId: string;

  @ApiProperty({ description: 'WhatsApp Business Account ID', example: '987654321098765' })
  businessAccountId: string;

  @ApiProperty({ description: 'Webhook verification token', example: 'my_secure_verify_token' })
  webhookVerifyToken: string;

  @ApiPropertyOptional({ description: 'App secret (masked)', example: 'abc1***456' })
  appSecret?: string;

  @ApiPropertyOptional({ description: 'Backend URL for webhook configuration', example: 'https://api.yourdomain.com' })
  backendUrl?: string;

  @ApiPropertyOptional({ description: 'Flow endpoint URL for WhatsApp Flows', example: 'https://api.yourdomain.com/api/flows' })
  flowEndpointUrl?: string;

  @ApiProperty({ description: 'WhatsApp API version', example: 'v20.0' })
  apiVersion: string;

  @ApiProperty({ description: 'Whether this configuration is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

export class TestConnectionDto {
  @ApiPropertyOptional({ description: 'Phone Number ID to test (uses saved config if not provided)', example: '123456789012345' })
  @IsString()
  @IsOptional()
  phoneNumberId?: string;

  @ApiPropertyOptional({ description: 'Access token to test (uses saved config if not provided)', example: 'EAABcd...' })
  @IsString()
  @IsOptional()
  accessToken?: string;
}

export class TestConnectionResponseDto {
  @ApiProperty({ description: 'Whether the connection test was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'Human-readable result message', example: 'Connection successful' })
  message: string;

  @ApiPropertyOptional({ description: 'Phone number associated with the account', example: '+905321234567' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Verified business name', example: 'My Business Name' })
  verifiedName?: string;

  @ApiPropertyOptional({ description: 'Error message if test failed', example: 'Invalid access token' })
  error?: string;
}

export class WebhookUrlResponseDto {
  @ApiProperty({ description: 'Full webhook URL to configure in Meta', example: 'https://yourdomain.com/api/webhooks/whatsapp' })
  webhookUrl: string;

  @ApiProperty({ description: 'Verify token to use in webhook configuration', example: 'my_secure_verify_token' })
  verifyToken: string;

  @ApiPropertyOptional({ description: 'Flow endpoint URL for WhatsApp Flows', example: 'https://yourdomain.com/api/flows' })
  flowEndpointUrl?: string;
}
