import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { WhatsAppFlowStatus, WhatsAppFlowCategory } from '../../../entities/whatsapp-flow.entity';
import { ChatBotStatus } from '../../../entities/chatbot.entity';

/**
 * Query DTO for export options
 */
export class ExportChatbotQueryDto {
  @ApiPropertyOptional({
    description: 'Include referenced WhatsApp Flows in export',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeFlows?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include metadata in export',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeMetadata?: boolean = true;

  @ApiPropertyOptional({
    description: 'Export format version',
    default: '1.0',
  })
  @IsOptional()
  @IsString()
  version?: string = '1.0';
}

/**
 * Embedded WhatsApp Flow data in export
 */
export interface ExportedWhatsAppFlow {
  whatsappFlowId?: string;
  name: string;
  description?: string;
  status: WhatsAppFlowStatus;
  categories: WhatsAppFlowCategory[];
  flowJson: any;
  endpointUri?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * Exported chatbot data structure
 */
export interface ExportedChatbotData {
  version: string;
  exportedAt: string;
  chatbot: {
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    isActive: boolean;
    status: ChatBotStatus;
    metadata?: Record<string, any>;
  };
  whatsappFlows?: ExportedWhatsAppFlow[];
}

/**
 * Response DTO for export endpoint (Swagger documentation)
 */
export class ExportChatbotResponseDto {
  @ApiProperty({
    description: 'Export format version',
    example: '1.0',
  })
  version: string;

  @ApiProperty({
    description: 'Export timestamp in ISO format',
    example: '2025-11-28T10:30:00.000Z',
  })
  exportedAt: string;

  @ApiProperty({
    description: 'Chatbot data',
    example: {
      name: 'Customer Support Bot',
      description: 'Handles customer inquiries',
      nodes: [],
      edges: [],
      isActive: false,
      status: 'draft',
    },
  })
  chatbot: {
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    isActive: boolean;
    status: ChatBotStatus;
    metadata?: Record<string, any>;
  };

  @ApiPropertyOptional({
    description: 'Embedded WhatsApp Flows (if includeFlows=true)',
    type: 'array',
  })
  whatsappFlows?: ExportedWhatsAppFlow[];
}
