import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../../interfaces/conversation.interface';

/**
 * DTO for interactive message buttons
 */
export class InteractiveButtonDto {
  @ApiProperty({ description: 'Unique button identifier', example: 'btn_yes' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Button display text', example: 'Yes' })
  @IsString()
  @IsNotEmpty()
  title: string;
}

/**
 * DTO for interactive message list row
 */
export class InteractiveRowDto {
  @ApiProperty({ description: 'Unique row identifier', example: 'row_option1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Row title text', example: 'Option 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Row description text', example: 'Select this for option 1' })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for interactive message section
 */
export class InteractiveSectionDto {
  @ApiProperty({ description: 'Section title', example: 'Main Options' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Array of rows in this section', type: [InteractiveRowDto] })
  @ValidateNested({ each: true })
  @Type(() => InteractiveRowDto)
  rows: InteractiveRowDto[];
}

/**
 * DTO for interactive message header
 */
export class InteractiveHeaderDto {
  @ApiProperty({ description: 'Header text content', example: 'Welcome!' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

/**
 * DTO for interactive message body
 */
export class InteractiveBodyDto {
  @ApiProperty({ description: 'Body text content', example: 'Please select an option below.' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

/**
 * DTO for interactive message footer
 */
export class InteractiveFooterDto {
  @ApiProperty({ description: 'Footer text content', example: 'Powered by WhatsApp Builder' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

/**
 * DTO for interactive message action
 */
export class InteractiveActionDto {
  @ApiPropertyOptional({ description: 'Array of buttons (max 3)', type: [InteractiveButtonDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InteractiveButtonDto)
  buttons?: InteractiveButtonDto[];

  @ApiPropertyOptional({ description: 'Array of sections for list messages', type: [InteractiveSectionDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InteractiveSectionDto)
  sections?: InteractiveSectionDto[];
}

/**
 * DTO for interactive message content
 */
export class InteractiveMessageContentDto {
  @ApiPropertyOptional({ description: 'Optional header for the message', type: InteractiveHeaderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InteractiveHeaderDto)
  header?: InteractiveHeaderDto;

  @ApiProperty({ description: 'Message body content', type: InteractiveBodyDto })
  @ValidateNested()
  @Type(() => InteractiveBodyDto)
  body: InteractiveBodyDto;

  @ApiPropertyOptional({ description: 'Optional footer for the message', type: InteractiveFooterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InteractiveFooterDto)
  footer?: InteractiveFooterDto;

  @ApiProperty({ description: 'Action configuration (buttons or list)', type: InteractiveActionDto })
  @ValidateNested()
  @Type(() => InteractiveActionDto)
  action: InteractiveActionDto;
}

/**
 * DTO for image message content
 */
export class ImageMessageContentDto {
  @ApiProperty({ description: 'URL of the image', example: 'https://example.com/image.jpg' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'Image caption', example: 'Check out this product!' })
  @IsOptional()
  @IsString()
  caption?: string;
}

/**
 * DTO for document message content
 */
export class DocumentMessageContentDto {
  @ApiProperty({ description: 'Name of the document file', example: 'invoice.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'Size of the file', example: '2.5 MB' })
  @IsString()
  @IsNotEmpty()
  fileSize: string;

  @ApiProperty({ description: 'URL of the document', example: 'https://example.com/docs/invoice.pdf' })
  @IsString()
  @IsNotEmpty()
  url: string;
}

/**
 * DTO for sending a message
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'Type of message to send',
    enum: ['text', 'image', 'video', 'document', 'audio', 'sticker', 'interactive', 'reaction'],
    example: 'text',
  })
  @IsEnum(MessageType)
  @IsNotEmpty()
  type: MessageType;

  @ApiProperty({
    description: 'Message content (structure varies by type)',
    example: { body: 'Hello, how can I help you?' },
  })
  @IsNotEmpty()
  content: any; // Will be validated based on type
}
