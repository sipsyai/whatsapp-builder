import { IsString, IsOptional } from 'class-validator';

export class ChatBotEdgeDto {
  @IsString()
  source: string;

  @IsString()
  target: string;

  @IsOptional()
  @IsString()
  sourceHandle?: string;
}
