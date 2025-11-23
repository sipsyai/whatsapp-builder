import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';

export enum FlowMode {
  NAVIGATE = 'navigate',
  DATA_EXCHANGE = 'data_exchange',
}

export class SendFlowMessageDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  flowId: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  ctaText: string;

  @IsString()
  @IsOptional()
  header?: string;

  @IsString()
  @IsOptional()
  footer?: string;

  @IsString()
  @IsOptional()
  flowToken?: string;

  @IsEnum(FlowMode)
  @IsOptional()
  mode?: FlowMode;

  @IsString()
  @IsOptional()
  initialScreen?: string;

  @IsObject()
  @IsOptional()
  initialData?: Record<string, any>;
}
