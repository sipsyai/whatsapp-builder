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

/**
 * Button item for interactive button message
 */
export class ButtonItem {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: 'Button title cannot exceed 20 characters' })
  title: string;
}

/**
 * Row item for list sections
 */
export class RowItem {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(24, { message: 'Row title cannot exceed 24 characters' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(72, { message: 'Row description cannot exceed 72 characters' })
  description?: string;
}

/**
 * Section item for list message
 */
export class SectionItem {
  @IsString()
  @IsNotEmpty()
  @MaxLength(24, { message: 'Section title cannot exceed 24 characters' })
  title: string;

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
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  bodyText: string;

  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Header text cannot exceed 60 characters' })
  headerText?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Footer text cannot exceed 60 characters' })
  footerText?: string;

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
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  bodyText: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: 'List button text cannot exceed 20 characters' })
  listButtonText: string;

  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Header text cannot exceed 60 characters' })
  headerText?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Footer text cannot exceed 60 characters' })
  footerText?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionItem)
  @ArrayMinSize(1, { message: 'Must have at least 1 section' })
  @ArrayMaxSize(10, { message: 'Cannot have more than 10 sections' })
  sections: SectionItem[];
}
