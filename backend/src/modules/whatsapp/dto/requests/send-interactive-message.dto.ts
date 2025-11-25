import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Button item for interactive button message
 */
export class ButtonItem {
  @ApiProperty({
    description: 'Unique button identifier',
    example: 'btn_yes',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Button display text (max 20 characters)',
    example: 'Yes',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: 'Button title cannot exceed 20 characters' })
  title: string;
}

/**
 * Row item for list sections
 */
export class RowItem {
  @ApiProperty({
    description: 'Unique row identifier',
    example: 'row_option1',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Row title text (max 24 characters)',
    example: 'Option 1',
    maxLength: 24,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(24, { message: 'Row title cannot exceed 24 characters' })
  title: string;

  @ApiPropertyOptional({
    description: 'Row description text (max 72 characters)',
    example: 'Select this for option 1',
    maxLength: 72,
  })
  @IsString()
  @IsOptional()
  @MaxLength(72, { message: 'Row description cannot exceed 72 characters' })
  description?: string;
}

/**
 * Section item for list message
 */
export class SectionItem {
  @ApiProperty({
    description: 'Section header title (max 24 characters)',
    example: 'Main Options',
    maxLength: 24,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(24, { message: 'Section title cannot exceed 24 characters' })
  title: string;

  @ApiProperty({
    description: 'Array of rows in this section (1-10 rows)',
    type: [RowItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RowItem)
  @ArrayMinSize(1, { message: 'Section must have at least 1 row' })
  @ArrayMaxSize(10, { message: 'Section cannot have more than 10 rows' })
  rows: RowItem[];
}

/**
 * DTO for sending interactive button message
 */
export class SendInteractiveButtonDto {
  @ApiProperty({
    description: 'Recipient phone number in E.164 format',
    example: '+905321234567',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Message body text',
    example: 'Please select an option below:',
  })
  @IsString()
  @IsNotEmpty()
  bodyText: string;

  @ApiPropertyOptional({
    description: 'Optional header text (max 60 characters)',
    example: 'Quick Response',
    maxLength: 60,
  })
  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Header text cannot exceed 60 characters' })
  headerText?: string;

  @ApiPropertyOptional({
    description: 'Optional footer text (max 60 characters)',
    example: 'Powered by WhatsApp Builder',
    maxLength: 60,
  })
  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Footer text cannot exceed 60 characters' })
  footerText?: string;

  @ApiProperty({
    description: 'Array of buttons (1-3 buttons)',
    type: [ButtonItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ButtonItem)
  @ArrayMinSize(1, { message: 'Must have at least 1 button' })
  @ArrayMaxSize(3, { message: 'Cannot have more than 3 buttons' })
  buttons: ButtonItem[];
}

/**
 * DTO for sending interactive list message
 */
export class SendInteractiveListDto {
  @ApiProperty({
    description: 'Recipient phone number in E.164 format',
    example: '+905321234567',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Message body text',
    example: 'Browse our options:',
  })
  @IsString()
  @IsNotEmpty()
  bodyText: string;

  @ApiProperty({
    description: 'Button text to open list (max 20 characters)',
    example: 'View Options',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: 'List button text cannot exceed 20 characters' })
  listButtonText: string;

  @ApiPropertyOptional({
    description: 'Optional header text (max 60 characters)',
    example: 'Our Services',
    maxLength: 60,
  })
  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Header text cannot exceed 60 characters' })
  headerText?: string;

  @ApiPropertyOptional({
    description: 'Optional footer text (max 60 characters)',
    example: 'Select one option',
    maxLength: 60,
  })
  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Footer text cannot exceed 60 characters' })
  footerText?: string;

  @ApiProperty({
    description: 'Array of sections (1-10 sections)',
    type: [SectionItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionItem)
  @ArrayMinSize(1, { message: 'Must have at least 1 section' })
  @ArrayMaxSize(10, { message: 'Cannot have more than 10 sections' })
  sections: SectionItem[];
}
