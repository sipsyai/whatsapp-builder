import { IsString, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ButtonItemDto {
  @ApiProperty({ description: 'Unique button identifier', example: 'btn_1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Button display text (max 20 characters)', example: 'Yes' })
  @IsString()
  @MaxLength(20)
  title: string;
}

export class ListRowDto {
  @ApiProperty({ description: 'Unique identifier for the row', example: 'row_1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Title text displayed for this row', example: 'Option A' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description text for this row', example: 'Select this for option A' })
  @IsString()
  description: string;
}

export class ListSectionDto {
  @ApiProperty({ description: 'Unique identifier for the section', example: 'section_1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Section header title', example: 'Main Options' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Array of rows in this section', type: [ListRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListRowDto)
  rows: ListRowDto[];
}
