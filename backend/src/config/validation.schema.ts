import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  validateSync,
} from 'class-validator';
import { plainToClass } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  // WhatsApp Configuration
  @IsString()
  @IsNotEmpty()
  WHATSAPP_ACCESS_TOKEN: string;

  @IsString()
  @IsNotEmpty()
  PHONE_NUMBER_ID: string;

  @IsString()
  @IsNotEmpty()
  WABA_ID: string;

  @IsString()
  @IsOptional()
  WHATSAPP_API_VERSION: string = 'v18.0';

  @IsString()
  @IsOptional()
  WHATSAPP_BASE_URL: string = 'https://graph.facebook.com';

  @IsString()
  @IsNotEmpty()
  WEBHOOK_VERIFY_TOKEN: string;

  @IsString()
  @IsNotEmpty()
  FLOW_ENDPOINT_URL: string;

  @IsString()
  @IsOptional()
  APP_ID?: string;

  @IsString()
  @IsOptional()
  WHATSAPP_PRIVATE_KEY?: string;

  @IsString()
  @IsOptional()
  WHATSAPP_PUBLIC_KEY?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation error:\n${errors
        .map((err) => Object.values(err.constraints || {}).join(', '))
        .join('\n')}`,
    );
  }

  return validatedConfig;
}
