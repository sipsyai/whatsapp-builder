import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ListRowDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;
}

export class ListSectionDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListRowDto)
  rows: ListRowDto[];
}
