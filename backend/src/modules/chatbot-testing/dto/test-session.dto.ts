import {
  IsString,
  IsUUID,
  IsOptional,
  IsObject,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDate,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Test mode types
 * - simulate: No real WhatsApp messages, uses mock message sender
 * - live: Sends actual WhatsApp messages (for integration testing)
 */
export enum TestMode {
  SIMULATE = 'simulate',
  LIVE = 'live',
}

/**
 * Test session status
 */
export enum TestSessionStatus {
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  WAITING_INPUT = 'waiting_input',
  WAITING_FLOW = 'waiting_flow',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  STOPPED = 'stopped',
  ERROR = 'error',
  LOOP_DETECTED = 'loop_detected',
}

// ============================================
// Request DTOs
// ============================================

/**
 * DTO for starting a new test session
 */
export class StartTestSessionDto {
  @ApiProperty({
    description: 'Chatbot ID to test',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  chatbotId: string;

  @ApiPropertyOptional({
    description: 'Test mode: simulate (mock) or live (real WhatsApp)',
    enum: TestMode,
    default: TestMode.SIMULATE,
  })
  @IsOptional()
  @IsEnum(TestMode)
  testMode?: TestMode = TestMode.SIMULATE;

  @ApiPropertyOptional({
    description: 'Simulated phone number for the test customer',
    example: '+905551234567',
    default: '+905551234567',
  })
  @IsOptional()
  @IsString()
  testPhoneNumber?: string = '+905551234567';

  @ApiPropertyOptional({
    description: 'Initial variables to inject into the context',
    example: { customer_name: 'Test User', customer_phone: '+905551234567' },
  })
  @IsOptional()
  @IsObject()
  initialVariables?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Optional notes about the test',
    example: 'Testing new welcome flow',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'User agent string for debugging',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Maximum visits per node before loop detection triggers',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  maxNodeVisits?: number = 10;

  @ApiPropertyOptional({
    description: 'Maximum total steps before loop detection triggers',
    example: 100,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  maxTotalSteps?: number = 100;
}

/**
 * DTO for simulating a user message/response
 */
export class SimulateMessageDto {
  @ApiProperty({
    description: 'User message text',
    example: 'Hello, I need help',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Button ID if user clicked a button',
    example: 'btn_yes',
  })
  @IsOptional()
  @IsString()
  buttonId?: string;

  @ApiPropertyOptional({
    description: 'List row ID if user selected from a list',
    example: 'row_product_1',
  })
  @IsOptional()
  @IsString()
  listRowId?: string;

  @ApiPropertyOptional({
    description: 'Flow response data if completing a WhatsApp Flow',
    example: { screen_1: { name: 'John', email: 'john@example.com' } },
  })
  @IsOptional()
  @IsObject()
  flowResponse?: Record<string, any>;
}

// ============================================
// Response DTOs
// ============================================

/**
 * Node output in test execution
 */
export class TestNodeOutputDto {
  @ApiProperty({ description: 'Node ID', example: 'node_123' })
  @IsString()
  nodeId: string;

  @ApiProperty({ description: 'Node type', example: 'message' })
  @IsString()
  nodeType: string;

  @ApiPropertyOptional({ description: 'Node label', example: 'Welcome Message' })
  @IsOptional()
  @IsString()
  nodeLabel?: string;

  @ApiProperty({ description: 'When node was executed', example: '2025-12-04T10:00:00Z' })
  @IsString()
  executedAt: string;

  @ApiProperty({ description: 'Whether execution was successful', example: true })
  @IsBoolean()
  success: boolean;

  @ApiPropertyOptional({ description: 'Execution duration in milliseconds', example: 150 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Output data from node execution' })
  @IsOptional()
  data?: any;

  @ApiPropertyOptional({ description: 'Error message if failed', example: 'API call failed' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ description: 'HTTP status code for API nodes', example: 200 })
  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @ApiPropertyOptional({ description: 'User response text' })
  @IsOptional()
  @IsString()
  userResponse?: string;

  @ApiPropertyOptional({ description: 'Button ID clicked by user' })
  @IsOptional()
  @IsString()
  buttonId?: string;

  @ApiPropertyOptional({ description: 'List row ID selected by user' })
  @IsOptional()
  @IsString()
  listRowId?: string;

  @ApiPropertyOptional({ description: 'WhatsApp Flow response data' })
  @IsOptional()
  flowResponse?: any;

  @ApiPropertyOptional({ description: 'Output variable name where result was stored' })
  @IsOptional()
  @IsString()
  outputVariable?: string;
}

/**
 * Loop detection stats DTO
 */
export class LoopDetectionStatsDto {
  @ApiProperty({
    description: 'Visit count per node',
    example: { 'node_1': 2, 'node_2': 1 },
  })
  @IsObject()
  nodeVisits: Record<string, number>;

  @ApiProperty({ description: 'Total execution steps', example: 5 })
  @IsNumber()
  totalSteps: number;

  @ApiProperty({ description: 'Whether a loop was detected', example: false })
  @IsBoolean()
  loopDetected: boolean;

  @ApiPropertyOptional({
    description: 'Details about the detected loop',
    example: { nodeId: 'node_3', visitCount: 11, message: 'Node visited more than 10 times' },
  })
  @IsOptional()
  loopDetails?: {
    nodeId: string;
    visitCount: number;
    message: string;
  };
}

/**
 * Simulated message DTO (message captured during test)
 */
export class SimulatedMessageDto {
  @ApiProperty({ description: 'Message ID', example: 'msg_123' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Direction', enum: ['outgoing', 'incoming'], example: 'outgoing' })
  @IsString()
  direction: 'outgoing' | 'incoming';

  @ApiProperty({ description: 'Message type', example: 'text' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Message content' })
  content: any;

  @ApiProperty({ description: 'When message was created', example: '2025-12-04T10:00:00Z' })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Associated node ID', example: 'node_123' })
  @IsOptional()
  @IsString()
  nodeId?: string;
}

/**
 * Current test state DTO
 */
export class TestStateDto {
  @ApiProperty({
    description: 'Test session/context ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Chatbot ID being tested',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  chatbotId: string;

  @ApiProperty({ description: 'Chatbot name', example: 'Customer Support Bot' })
  @IsString()
  chatbotName: string;

  @ApiProperty({
    description: 'Current test status',
    enum: TestSessionStatus,
    example: TestSessionStatus.WAITING_INPUT,
  })
  @IsEnum(TestSessionStatus)
  status: TestSessionStatus;

  @ApiPropertyOptional({ description: 'Current node ID', example: 'node_123' })
  @IsOptional()
  @IsString()
  currentNodeId: string | null;

  @ApiPropertyOptional({ description: 'Current node label', example: 'Ask Name Question' })
  @IsOptional()
  @IsString()
  currentNodeLabel?: string | null;

  @ApiPropertyOptional({ description: 'Current node type', example: 'question' })
  @IsOptional()
  @IsString()
  currentNodeType?: string | null;

  @ApiProperty({
    description: 'Current context variables',
    example: { customer_name: 'John', order_id: '12345' },
  })
  @IsObject()
  variables: Record<string, any>;

  @ApiProperty({
    description: 'Executed node history',
    type: [String],
    example: ['start_node', 'welcome_msg', 'ask_name'],
  })
  @IsArray()
  @IsString({ each: true })
  nodeHistory: string[];

  @ApiProperty({
    description: 'Node execution outputs',
    type: [TestNodeOutputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestNodeOutputDto)
  nodeOutputs: TestNodeOutputDto[];

  @ApiProperty({
    description: 'Simulated messages during test',
    type: [SimulatedMessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimulatedMessageDto)
  messages: SimulatedMessageDto[];

  @ApiProperty({
    description: 'Loop detection statistics',
    type: LoopDetectionStatsDto,
  })
  @ValidateNested()
  @Type(() => LoopDetectionStatsDto)
  loopStats: LoopDetectionStatsDto;

  @ApiProperty({ description: 'Test started at', example: '2025-12-04T10:00:00Z' })
  @IsDate()
  @Type(() => Date)
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Test completed at', example: '2025-12-04T10:05:00Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Completion reason', example: 'flow_completed' })
  @IsOptional()
  @IsString()
  completionReason?: string | null;

  @ApiProperty({ description: 'Test mode', enum: TestMode, example: TestMode.SIMULATE })
  @IsEnum(TestMode)
  testMode: TestMode;

  @ApiProperty({ description: 'Test phone number', example: '+905551234567' })
  @IsString()
  testPhoneNumber: string;
}

/**
 * Test session response DTO (standard API response)
 */
export class TestSessionResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  @IsBoolean()
  success: boolean;

  @ApiPropertyOptional({ description: 'Success or error message', example: 'Test session started' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: 'Test session/context ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Current test state',
    type: TestStateDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TestStateDto)
  state?: TestStateDto;
}

/**
 * DTO for pause/resume/stop operations
 */
export class TestSessionActionResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Result message', example: 'Test session paused' })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'New session status',
    enum: TestSessionStatus,
    example: TestSessionStatus.PAUSED,
  })
  @IsEnum(TestSessionStatus)
  status: TestSessionStatus;
}
