import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsObject,
  IsArray,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SortOrder } from './query-chatbots.dto';

// Session Status enum
export enum SessionStatus {
  RUNNING = 'running',
  WAITING_INPUT = 'waiting_input',
  WAITING_FLOW = 'waiting_flow',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  STOPPED = 'stopped',
}

// Session filter enum
export enum SessionFilter {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ALL = 'all',
}

// Session sort field enum
export enum SessionSortField {
  STARTED_AT = 'startedAt',
  UPDATED_AT = 'updatedAt',
}

// Message DTO for session details
export class MessageDto {
  @ApiProperty({ description: 'Message ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Sender ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  senderId: string;

  @ApiProperty({ description: 'Message type', example: 'text' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Message content', example: { text: 'Hello' } })
  @IsObject()
  content: any;

  @ApiProperty({ description: 'Message status', example: 'sent' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Message timestamp', example: '2025-11-25T10:30:00Z' })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({ description: 'Created at', example: '2025-11-25T10:30:00Z' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

// ChatbotSessionDto - for list views
export class ChatbotSessionDto {
  @ApiProperty({ description: 'Context ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Conversation ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  conversationId: string;

  @ApiProperty({ description: 'Chatbot ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  chatbotId: string;

  @ApiProperty({ description: 'Chatbot name', example: 'Customer Support Bot' })
  @IsString()
  chatbotName: string;

  @ApiProperty({ description: 'Customer phone number', example: '+1234567890' })
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Session status', enum: SessionStatus, example: SessionStatus.RUNNING })
  @IsEnum(SessionStatus)
  status: SessionStatus;

  @ApiProperty({ description: 'Current node ID', example: 'node_123' })
  @IsString()
  currentNodeId: string;

  @ApiProperty({ description: 'Current node label', example: 'Welcome Message' })
  @IsString()
  currentNodeLabel: string;

  @ApiProperty({ description: 'Session started at', example: '2025-11-25T10:00:00Z' })
  @IsDate()
  @Type(() => Date)
  startedAt: Date;

  @ApiProperty({ description: 'Last updated at', example: '2025-11-25T10:30:00Z' })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Session completed at', example: '2025-11-25T11:00:00Z', nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt: Date | null;

  @ApiProperty({ description: 'Number of nodes visited', example: 5 })
  @IsNumber()
  nodeCount: number;

  @ApiProperty({ description: 'Number of messages exchanged', example: 10 })
  @IsNumber()
  messageCount: number;

  @ApiProperty({ description: 'Whether session is active', example: true })
  @IsBoolean()
  isActive: boolean;
}

// ChatbotSessionDetailDto - extends ChatbotSessionDto for detail views
export class ChatbotSessionDetailDto extends ChatbotSessionDto {
  @ApiProperty({ description: 'Node history array', example: ['node_1', 'node_2', 'node_3'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  nodeHistory: string[];

  @ApiProperty({ description: 'Session variables', example: { userName: 'John', orderId: '12345' } })
  @IsObject()
  variables: Record<string, any>;

  @ApiProperty({ description: 'Messages in this session', type: [MessageDto] })
  @IsArray()
  @Type(() => MessageDto)
  messages: MessageDto[];

  @ApiProperty({
    description: 'Chatbot flow data',
    example: { nodes: [{ id: 'node_1', data: {} }], edges: [{ id: 'edge_1', source: 'node_1', target: 'node_2' }] },
  })
  @IsObject()
  flowData: {
    nodes: any[];
    edges: any[];
  };

  @ApiPropertyOptional({ description: 'Session expiration time', example: '2025-11-25T12:00:00Z', nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt: Date | null;

  @ApiPropertyOptional({ description: 'Completion reason', example: 'user_completed', nullable: true })
  @IsOptional()
  @IsString()
  completionReason: string | null;
}

// QuerySessionsDto - query parameters with validation
export class QuerySessionsDto {
  @ApiPropertyOptional({
    description: 'Filter sessions by status',
    enum: SessionFilter,
    example: SessionFilter.ACTIVE,
    default: SessionFilter.ALL,
  })
  @IsOptional()
  @IsEnum(SessionFilter)
  status?: SessionFilter;

  @ApiPropertyOptional({
    description: 'Filter by chatbot ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  chatbotId?: string;

  @ApiPropertyOptional({
    description: 'Filter by conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Search by customer phone or name',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Number of items to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of items to skip',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: SessionSortField,
    example: SessionSortField.STARTED_AT,
    default: SessionSortField.STARTED_AT,
  })
  @IsOptional()
  @IsEnum(SessionSortField)
  sortBy?: SessionSortField = SessionSortField.STARTED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Filter sessions created after this date',
    example: '2025-11-01T00:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter sessions created before this date',
    example: '2025-11-30T23:59:59Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

// PaginatedSessionsDto - response with pagination metadata
export class PaginatedSessionsDto {
  @ApiProperty({
    description: 'Array of chatbot sessions',
    type: [ChatbotSessionDto],
  })
  @IsArray()
  @Type(() => ChatbotSessionDto)
  data: ChatbotSessionDto[];

  @ApiProperty({
    description: 'Total number of sessions matching the query',
    example: 150,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Number of items returned in this page',
    example: 20,
  })
  @IsNumber()
  limit: number;

  @ApiProperty({
    description: 'Number of items skipped',
    example: 0,
  })
  @IsNumber()
  offset: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  @IsBoolean()
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  @IsBoolean()
  hasPrevious: boolean;
}

// Session statistics DTO
export class SessionStatisticsDto {
  @ApiProperty({ description: 'Total number of sessions', example: 150 })
  @IsNumber()
  totalSessions: number;

  @ApiProperty({ description: 'Number of active sessions', example: 25 })
  @IsNumber()
  activeSessions: number;

  @ApiProperty({ description: 'Number of completed sessions', example: 100 })
  @IsNumber()
  completedSessions: number;

  @ApiProperty({ description: 'Number of expired sessions', example: 15 })
  @IsNumber()
  expiredSessions: number;

  @ApiProperty({ description: 'Number of stopped sessions', example: 10 })
  @IsNumber()
  stoppedSessions: number;

  @ApiProperty({ description: 'Average session duration in minutes', example: 15.5 })
  @IsNumber()
  averageDuration: number;

  @ApiProperty({ description: 'Average messages per session', example: 8.2 })
  @IsNumber()
  averageMessages: number;

  @ApiProperty({ description: 'Average nodes per session', example: 5.3 })
  @IsNumber()
  averageNodes: number;
}

// Alias for backward compatibility
export { QuerySessionsDto as SessionQueryDto };
