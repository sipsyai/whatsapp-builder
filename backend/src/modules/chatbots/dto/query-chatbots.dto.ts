import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChatBotStatus } from '../../../entities/chatbot.entity';

export enum ChatBotSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryChatBotsDto {
  @ApiPropertyOptional({ description: 'Search term to filter chatbots by name', example: 'support' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of items to skip', example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: 'Field to sort by', enum: ChatBotSortField, example: 'createdAt' })
  @IsOptional()
  @IsEnum(ChatBotSortField)
  sortBy?: ChatBotSortField;

  @ApiPropertyOptional({ description: 'Sort order', enum: SortOrder, example: 'DESC' })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by chatbot status', enum: ChatBotStatus })
  @IsOptional()
  @IsEnum(ChatBotStatus)
  status?: ChatBotStatus;
}
