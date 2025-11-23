import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../../interfaces/conversation.interface';

/**
 * DTO for interactive message buttons
 */
export class InteractiveButtonDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}

/**
 * DTO for interactive message list row
 */
export class InteractiveRowDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for interactive message section
 */
export class InteractiveSectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @ValidateNested({ each: true })
  @Type(() => InteractiveRowDto)
  rows: InteractiveRowDto[];
}

/**
 * DTO for interactive message header
 */
export class InteractiveHeaderDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

/**
 * DTO for interactive message body
 */
export class InteractiveBodyDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

/**
 * DTO for interactive message footer
 */
export class InteractiveFooterDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

/**
 * DTO for interactive message action
 */
export class InteractiveActionDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InteractiveButtonDto)
  buttons?: InteractiveButtonDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InteractiveSectionDto)
  sections?: InteractiveSectionDto[];
}

/**
 * DTO for interactive message content
 */
export class InteractiveMessageContentDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => InteractiveHeaderDto)
  header?: InteractiveHeaderDto;

  @ValidateNested()
  @Type(() => InteractiveBodyDto)
  body: InteractiveBodyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InteractiveFooterDto)
  footer?: InteractiveFooterDto;

  @ValidateNested()
  @Type(() => InteractiveActionDto)
  action: InteractiveActionDto;
}

/**
 * DTO for image message content
 */
export class ImageMessageContentDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

/**
 * DTO for document message content
 */
export class DocumentMessageContentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileSize: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

/**
 * DTO for sending a message
 */
export class SendMessageDto {
  @IsEnum(MessageType)
  @IsNotEmpty()
  type: MessageType;

  @IsNotEmpty()
  content: any; // Will be validated based on type
}
