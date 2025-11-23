import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateFlowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  nodes?: any[];

  @IsOptional()
  @IsArray()
  edges?: any[];
}
