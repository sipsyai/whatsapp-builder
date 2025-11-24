import { IsString, IsArray, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { WhatsAppFlowCategory } from '../../../entities/whatsapp-flow.entity';

export class UpdateFlowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(WhatsAppFlowCategory, { each: true })
  categories?: WhatsAppFlowCategory[];

  @IsOptional()
  @IsObject()
  flowJson?: any;

  @IsOptional()
  @IsString()
  endpointUri?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
