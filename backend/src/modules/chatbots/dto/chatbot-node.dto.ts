import { IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NodePositionDto } from './node-position.dto';
import { NodeDataDto } from './node-data.dto';

export enum NodeType {
  START = 'start',
  MESSAGE = 'message',
  QUESTION = 'question',
  CONDITION = 'condition',
  WHATSAPP_FLOW = 'whatsapp_flow',
  REST_API = 'rest_api',
  GOOGLE_CALENDAR = 'google_calendar',
}

export class ChatBotNodeDto {
  @ApiProperty({ description: 'Unique identifier for the node', example: 'node_1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Type of the node', enum: NodeType, example: 'start' })
  @IsEnum(NodeType)
  type: NodeType;

  @ApiProperty({ description: 'Position of the node in the canvas', type: NodePositionDto })
  @ValidateNested()
  @Type(() => NodePositionDto)
  position: NodePositionDto;

  @ApiProperty({ description: 'Node configuration data', type: NodeDataDto })
  @ValidateNested()
  @Type(() => NodeDataDto)
  data: NodeDataDto;
}
