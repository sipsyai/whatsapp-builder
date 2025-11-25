import { IsString, IsArray, IsOptional, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChatBotNodeDto } from './chatbot-node.dto';
import { ChatBotEdgeDto } from './chatbot-edge.dto';

export class UpdateChatBotDto {
  @ApiPropertyOptional({ description: 'Name of the chatbot', example: 'Updated Support Bot' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the chatbot', example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Array of chatbot nodes', type: [ChatBotNodeDto] })
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

  @ApiPropertyOptional({ description: 'Whether the chatbot is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
