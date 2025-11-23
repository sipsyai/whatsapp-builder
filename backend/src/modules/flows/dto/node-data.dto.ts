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
}
