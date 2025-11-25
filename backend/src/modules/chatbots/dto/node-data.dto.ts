import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListSectionDto } from './list-section.dto';

export enum NodeDataType {
  START = 'start',
  MESSAGE = 'message',
  QUESTION = 'question',
  CONDITION = 'condition',
  WHATSAPP_FLOW = 'whatsapp_flow',
}

export enum QuestionType {
  TEXT = 'text',
  BUTTONS = 'buttons',
  LIST = 'list',
}

export class NodeDataDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsEnum(NodeDataType)
  type?: NodeDataType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  variable?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  conditionVar?: string;

  @IsOptional()
  @IsString()
  conditionOp?: string;

  @IsOptional()
  @IsString()
  conditionVal?: string;

  @IsOptional()
  @IsString()
  messageType?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @IsOptional()
  @IsString()
  headerText?: string;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsBoolean()
  mediaHeader?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  buttons?: string[];

  @IsOptional()
  @IsString()
  listButtonText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListSectionDto)
  listSections?: ListSectionDto[];

  // WhatsApp Flow specific fields
  @IsOptional()
  @IsString()
  whatsappFlowId?: string; // WhatsApp Flow ID (from Meta)

  @IsOptional()
  @IsString()
  flowMode?: string; // 'navigate' or 'data_exchange'

  @IsOptional()
  @IsString()
  flowCta?: string; // Button text (max 20 chars)

  @IsOptional()
  @IsString()
  flowBodyText?: string; // Message body text

  @IsOptional()
  @IsString()
  flowHeaderText?: string; // Optional header text

  @IsOptional()
  @IsString()
  flowFooterText?: string; // Optional footer text

  @IsOptional()
  @IsString()
  flowInitialScreen?: string; // Starting screen ID

  @IsOptional()
  flowInitialData?: any; // Initial data for the flow

  @IsOptional()
  @IsString()
  flowOutputVariable?: string; // Variable name to store flow response
}
