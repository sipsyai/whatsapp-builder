import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Display label for the node', example: 'Welcome Message' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'Type of node data', enum: NodeDataType, example: 'message' })
  @IsOptional()
  @IsEnum(NodeDataType)
  type?: NodeDataType;

  @ApiPropertyOptional({ description: 'Message content or text to display', example: 'Hello! Welcome to our service.' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Variable name to store user input', example: 'user_name' })
  @IsOptional()
  @IsString()
  variable?: string;

  @ApiPropertyOptional({ description: 'Array of options for buttons or list items', example: ['Option 1', 'Option 2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Variable name for condition evaluation', example: 'user_age' })
  @IsOptional()
  @IsString()
  conditionVar?: string;

  @ApiPropertyOptional({ description: 'Condition operator (eq, ne, gt, lt, contains)', example: 'eq' })
  @IsOptional()
  @IsString()
  conditionOp?: string;

  @ApiPropertyOptional({ description: 'Value to compare against', example: '18' })
  @IsOptional()
  @IsString()
  conditionVal?: string;

  @ApiPropertyOptional({ description: 'Type of message (text, image, document)', example: 'text' })
  @IsOptional()
  @IsString()
  messageType?: string;

  @ApiPropertyOptional({ description: 'Type of question input', enum: QuestionType, example: 'buttons' })
  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @ApiPropertyOptional({ description: 'Header text for interactive messages', example: 'Select an Option' })
  @IsOptional()
  @IsString()
  headerText?: string;

  @ApiPropertyOptional({ description: 'Footer text for interactive messages', example: 'Powered by WhatsApp Builder' })
  @IsOptional()
  @IsString()
  footerText?: string;

  @ApiPropertyOptional({ description: 'Whether to include media in header', example: false })
  @IsOptional()
  @IsBoolean()
  mediaHeader?: boolean;

  @ApiPropertyOptional({ description: 'Button labels for interactive messages', example: ['Yes', 'No', 'Maybe'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  buttons?: string[];

  @ApiPropertyOptional({ description: 'Button text for list messages', example: 'View Options' })
  @IsOptional()
  @IsString()
  listButtonText?: string;

  @ApiPropertyOptional({ description: 'Sections for list-type questions', type: [ListSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListSectionDto)
  listSections?: ListSectionDto[];

  @ApiPropertyOptional({ description: 'WhatsApp Flow ID from Meta', example: '1234567890' })
  @IsOptional()
  @IsString()
  whatsappFlowId?: string;

  @ApiPropertyOptional({ description: 'Flow mode: navigate or data_exchange', example: 'data_exchange' })
  @IsOptional()
  @IsString()
  flowMode?: string;

  @ApiPropertyOptional({ description: 'Call-to-action button text (max 20 chars)', example: 'Start Flow' })
  @IsOptional()
  @IsString()
  flowCta?: string;

  @ApiPropertyOptional({ description: 'Flow message body text', example: 'Please complete the following form' })
  @IsOptional()
  @IsString()
  flowBodyText?: string;

  @ApiPropertyOptional({ description: 'Optional header text for flow message', example: 'Appointment Booking' })
  @IsOptional()
  @IsString()
  flowHeaderText?: string;

  @ApiPropertyOptional({ description: 'Optional footer text for flow message', example: 'Takes 2 minutes' })
  @IsOptional()
  @IsString()
  flowFooterText?: string;

  @ApiPropertyOptional({ description: 'Starting screen ID for the flow', example: 'WELCOME_SCREEN' })
  @IsOptional()
  @IsString()
  flowInitialScreen?: string;

  @ApiPropertyOptional({ description: 'Initial data to pass to the flow', example: { user_id: '123' } })
  @IsOptional()
  flowInitialData?: any;

  @ApiPropertyOptional({ description: 'Variable name to store flow response', example: 'flow_result' })
  @IsOptional()
  @IsString()
  flowOutputVariable?: string;
}
