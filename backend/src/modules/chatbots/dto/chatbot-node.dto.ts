import { IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NodePositionDto } from './node-position.dto';
import { NodeDataDto } from './node-data.dto';

export enum NodeType {
  START = 'start',
  MESSAGE = 'message',
  QUESTION = 'question',
  CONDITION = 'condition',
  WHATSAPP_FLOW = 'whatsapp_flow',
}

export class ChatBotNodeDto {
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
