import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChatBotNodeDto } from './chatbot-node.dto';
import { ChatBotEdgeDto } from './chatbot-edge.dto';

export class CreateChatBotDto {
  @IsString()
  name: string;

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
}
