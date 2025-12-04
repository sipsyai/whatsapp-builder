import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDate,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// CLIENT -> SERVER DTOs
// ============================================

/**
 * DTO for joining a test session room
 */
export class JoinTestSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

/**
 * DTO for leaving a test session room
 */
export class LeaveTestSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

/**
 * DTO for sending a message in test session
 */
export class SendTestMessageDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  buttonId?: string;

  @IsString()
  @IsOptional()
  listRowId?: string;

  @IsObject()
  @IsOptional()
  flowResponse?: Record<string, any>;
}

// ============================================
// SERVER -> CLIENT DTOs
// ============================================

/**
 * DTO for test started event
 */
export class TestStartedEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  chatbotId: string;

  @IsString()
  chatbotName: string;

  @IsDate()
  @Type(() => Date)
  startedAt: Date;

  @IsObject()
  @IsOptional()
  initialVariables?: Record<string, any>;
}

/**
 * DTO for bot response event
 */
export class BotResponseEventDto {
  @IsString()
  sessionId: string;

  @IsObject()
  message: {
    id: string;
    type: string;
    content: any;
    timestamp: Date;
  };

  @IsString()
  @IsOptional()
  nodeId?: string;
}

/**
 * DTO for node entered event
 */
export class NodeEnteredEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  nodeId: string;

  @IsString()
  nodeType: string;

  @IsString()
  @IsOptional()
  nodeLabel?: string;

  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}

/**
 * DTO for node executed event
 */
export class NodeExecutedEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  nodeId: string;

  @IsObject()
  result: {
    success: boolean;
    duration: number;
    output?: any;
    error?: string;
  };
}

/**
 * DTO for node exited event
 */
export class NodeExitedEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  nodeId: string;

  @IsString()
  @IsOptional()
  nextNodeId?: string | null;
}

/**
 * DTO for variable changed event
 */
export class VariableChangedEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  variableName: string;

  @IsOptional()
  oldValue: any;

  @IsOptional()
  newValue: any;

  @IsString()
  @IsOptional()
  source?: 'node' | 'api' | 'flow' | 'manual';
}

/**
 * DTO for waiting input event
 */
export class WaitingInputEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  inputType: 'text' | 'button' | 'list' | 'flow';

  @IsObject()
  @IsOptional()
  options?: {
    buttons?: Array<{ id: string; title: string }>;
    listSections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
    flowId?: string;
    flowData?: any;
    prompt?: string;
  };
}

/**
 * DTO for flow sent event
 */
export class FlowSentEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  flowId: string;

  @IsObject()
  @IsOptional()
  flowData?: any;
}

/**
 * DTO for flow response event
 */
export class FlowResponseEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  flowId: string;

  @IsObject()
  flowData: Record<string, any>;
}

/**
 * DTO for test completed event
 */
export class TestCompletedEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  reason: 'flow_completed' | 'end_node' | 'user_stopped' | 'timeout' | 'error' | 'loop_detected';

  @IsObject()
  summary: {
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    nodesExecuted: number;
    variablesSet: number;
    duration: number;
  };
}

/**
 * DTO for test paused event
 */
export class TestPausedEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  @IsOptional()
  atNodeId?: string | null;
}

/**
 * DTO for test resumed event
 */
export class TestResumedEventDto {
  @IsString()
  sessionId: string;
}

/**
 * DTO for test error event
 */
export class TestErrorEventDto {
  @IsString()
  sessionId: string;

  @IsString()
  error: string;

  @IsString()
  @IsOptional()
  nodeId?: string;

  @IsBoolean()
  @IsOptional()
  recoverable?: boolean;
}

// ============================================
// INTERNAL TYPES
// ============================================

export interface TestSessionClient {
  socketId: string;
  userId: string;
  joinedAt: Date;
}

export interface TestSessionRoom {
  sessionId: string;
  clients: Map<string, TestSessionClient>;
  createdAt: Date;
}
