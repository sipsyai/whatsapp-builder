import { IsString, IsArray, ValidateNested, MaxLength, IsOptional, registerDecorator, ValidationOptions } from 'class-validator';
import { Type, Transform, TransformFnParams } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Custom validator that accepts both string and number types for ID fields.
 * This handles cases where frontend may send numeric IDs but backend expects strings.
 * Also accepts undefined/null for optional fields.
 */
function IsStringOrNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          // Accept undefined/null (for optional fields with @IsOptional)
          if (value === undefined || value === null) {
            return true;
          }
          return typeof value === 'string' || typeof value === 'number';
        },
        defaultMessage() {
          return '$property must be a string or number';
        },
      },
    });
  };
}

/**
 * Transform function to convert numbers to strings for id fields.
 * This handles cases where frontend sends numeric IDs but backend expects strings.
 * Must be applied BEFORE validation decorators to ensure transformation happens first.
 */
const transformToString = ({ value }: TransformFnParams): string | null | undefined => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  // If it's an object or array, return undefined to let validation catch it
  if (typeof value === 'object') {
    return undefined;
  }
  return String(value);
};

export class ButtonItemDto {
  @ApiPropertyOptional({ description: 'Unique button identifier', example: 'btn_1' })
  @IsOptional()
  @Transform(transformToString, { toClassOnly: true })
  @IsStringOrNumber()
  id?: string;

  @ApiProperty({ description: 'Button display text (max 20 characters)', example: 'Yes' })
  @IsString()
  @MaxLength(20)
  title: string;
}

export class ListRowDto {
  @ApiPropertyOptional({ description: 'Unique identifier for the row', example: 'row_1' })
  @IsOptional()
  @Transform(transformToString, { toClassOnly: true })
  @IsStringOrNumber()
  id?: string;

  @ApiProperty({ description: 'Title text displayed for this row', example: 'Option A' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description text for this row', example: 'Select this for option A' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ListSectionDto {
  @ApiPropertyOptional({ description: 'Unique identifier for the section', example: 'section_1' })
  @IsOptional()
  @Transform(transformToString, { toClassOnly: true })
  @IsStringOrNumber()
  id?: string;

  @ApiProperty({ description: 'Section header title', example: 'Main Options' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Array of rows in this section', type: [ListRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListRowDto)
  rows: ListRowDto[];
}
