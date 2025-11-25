import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
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
}

export class WhatsAppConfigResponseDto {
  @ApiProperty({ description: 'Configuration UUID' })
  id: string;

  @ApiProperty({ description: 'WhatsApp Business Phone Number ID' })
  phoneNumberId: string;

  @ApiProperty({ description: 'WhatsApp Business Account ID' })
  businessAccountId: string;

  @ApiProperty({ description: 'Webhook verification token' })
  webhookVerifyToken: string;

  @ApiPropertyOptional({ description: 'App secret (masked)' })
  appSecret?: string;

  @ApiProperty({ description: 'Whether this configuration is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class TestConnectionDto {
  @ApiPropertyOptional({ description: 'Phone Number ID to test (uses saved config if not provided)' })
  @IsString()
  @IsOptional()
  phoneNumberId?: string;

  @ApiPropertyOptional({ description: 'Access token to test (uses saved config if not provided)' })
  @IsString()
  @IsOptional()
  accessToken?: string;
}

export class TestConnectionResponseDto {
  @ApiProperty({ description: 'Whether the connection test was successful' })
  success: boolean;

  @ApiProperty({ description: 'Human-readable result message' })
  message: string;

  @ApiPropertyOptional({ description: 'Phone number associated with the account' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Verified business name' })
  verifiedName?: string;

  @ApiPropertyOptional({ description: 'Error message if test failed' })
  error?: string;
}

export class WebhookUrlResponseDto {
  @ApiProperty({ description: 'Full webhook URL to configure in Meta', example: 'https://yourdomain.com/api/webhooks' })
  webhookUrl: string;

  @ApiProperty({ description: 'Verify token to use in webhook configuration' })
  verifyToken: string;
}
