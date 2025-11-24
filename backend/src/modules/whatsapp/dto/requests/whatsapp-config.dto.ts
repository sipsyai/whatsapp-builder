import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateWhatsAppConfigDto {
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;

  @IsString()
  @IsNotEmpty()
  businessAccountId: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  webhookVerifyToken: string;

  @IsString()
  @IsOptional()
  appSecret?: string;
}

export class WhatsAppConfigResponseDto {
  id: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  appSecret?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TestConnectionDto {
  @IsString()
  @IsOptional()
  phoneNumberId?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;
}

export class TestConnectionResponseDto {
  success: boolean;
  message: string;
  phoneNumber?: string;
  verifiedName?: string;
  error?: string;
}

export class WebhookUrlResponseDto {
  webhookUrl: string;
  verifyToken: string;
}
