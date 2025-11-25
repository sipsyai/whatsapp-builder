import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatBotNodeDto } from './chatbot-node.dto';
import { ChatBotEdgeDto } from './chatbot-edge.dto';

export class CreateChatBotDto {
  @ApiProperty({ description: 'Name of the chatbot', example: 'Customer Support Bot' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the chatbot', example: 'Handles customer inquiries and support tickets' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Array of chatbot nodes (flow components)', type: [ChatBotNodeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatBotNodeDto)
  nodes?: ChatBotNodeDto[];

  @ApiPropertyOptional({ description: 'Array of edges connecting nodes', type: [ChatBotEdgeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatBotEdgeDto)
  edges?: ChatBotEdgeDto[];
}
