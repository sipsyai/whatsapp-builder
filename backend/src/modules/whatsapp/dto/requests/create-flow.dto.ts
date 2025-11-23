import { IsString, IsNotEmpty, IsArray, IsObject, IsOptional } from 'class-validator';

export class CreateFlowDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsObject()
  @IsNotEmpty()
  flowJson: any;

  @IsString()
  @IsOptional()
  endpointUri?: string;
}
