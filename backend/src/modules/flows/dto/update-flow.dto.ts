import { IsString, IsArray, IsOptional, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowNodeDto } from './flow-node.dto';
import { FlowEdgeDto } from './flow-edge.dto';

export class UpdateFlowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowNodeDto)
  nodes?: FlowNodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowEdgeDto)
  edges?: FlowEdgeDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
