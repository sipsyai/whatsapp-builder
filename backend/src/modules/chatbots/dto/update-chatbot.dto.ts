import { IsString, IsArray, IsOptional, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatBotNodeDto } from './chatbot-node.dto';
import { ChatBotEdgeDto } from './chatbot-edge.dto';

export class UpdateChatBotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatBotNodeDto)
  nodes?: ChatBotNodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatBotEdgeDto)
  edges?: ChatBotEdgeDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
