import { IsString, IsArray, IsOptional, IsEnum, IsObject } from 'class-validator';
import { WhatsAppFlowCategory } from '../../../entities/whatsapp-flow.entity';

export class CreateFlowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsEnum(WhatsAppFlowCategory, { each: true })
  categories: WhatsAppFlowCategory[];

  @IsObject()
  flowJson: any; // Flow JSON structure

  @IsOptional()
  @IsString()
  endpointUri?: string;
}
