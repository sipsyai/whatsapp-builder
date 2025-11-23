import { IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NodePositionDto } from './node-position.dto';
import { NodeDataDto } from './node-data.dto';

export enum NodeType {
  START = 'start',
  MESSAGE = 'message',
  QUESTION = 'question',
  CONDITION = 'condition',
}

export class FlowNodeDto {
  @IsString()
  id: string;

  @IsEnum(NodeType)
  type: NodeType;

  @ValidateNested()
  @Type(() => NodePositionDto)
  position: NodePositionDto;

  @ValidateNested()
  @Type(() => NodeDataDto)
  data: NodeDataDto;
}
