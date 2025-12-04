import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum, IsBoolean, IsNumber } from 'class-validator';

// ============================================
// CLIENT -> SERVER DTOs
// ============================================

export class StartTestDto {
  @IsString()
  @IsNotEmpty()
  chatbotId: string;

  @IsObject()
  @IsOptional()
  initialVariables?: Record<string, any>;

  @IsObject()
  @IsOptional()
  config?: {
    simulateDelay?: boolean;
    delayMs?: number;
  };
}

export class SendTestMessageDto {
  @IsString()
  @IsNotEmpty()
  testSessionId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  @IsEnum(['text', 'interactive', 'flow'])
  messageType?: 'text' | 'interactive' | 'flow';
}

export class SetTestVariableDto {
  @IsString()
  @IsNotEmpty()
  testSessionId: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsOptional()
  value: any;
}

export class TestSessionActionDto {
  @IsString()
  @IsNotEmpty()
  testSessionId: string;
}

export class RejoinTestDto {
  @IsString()
  @IsNotEmpty()
  testSessionId: string;

  @IsString()
  @IsOptional()
  lastEventId?: string;
}

// ============================================
// SERVER -> CLIENT DTOs
// ============================================

export class TestStartedDto {
  testSessionId: string;
  chatbotId: string;
  chatbotName: string;
  startedAt: Date;
}

export class TestMessageDto {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: 'text' | 'interactive' | 'flow' | 'media';
  nodeId?: string;
  timestamp: Date;
}

export class TestMessageReceivedDto {
  testSessionId: string;
  message: TestMessageDto;
}

export class TestBotResponseDto {
  testSessionId: string;
  messages: TestMessageDto[];
  nodeId: string;
  timestamp: Date;
}

export class TestNodeEnteredDto {
  testSessionId: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
}

export class TestNodeExecutedDto {
  testSessionId: string;
  nodeId: string;
  result: 'success' | 'error' | 'skipped';
  duration: number;
  error?: string;
}

export class TestNodeExitedDto {
  testSessionId: string;
  nodeId: string;
  nextNodeId: string | null;
}

export class TestVariableChangedDto {
  testSessionId: string;
  key: string;
  oldValue: any;
  newValue: any;
  source: 'manual' | 'node' | 'api' | 'flow';
}

export class TestVariablesSnapshotDto {
  testSessionId: string;
  variables: Record<string, any>;
  timestamp: Date;
}

export class TestWaitingInputDto {
  testSessionId: string;
  nodeId: string;
  prompt: string;
  inputType: 'text' | 'button' | 'list' | 'flow';
}

export class TestFlowSentDto {
  testSessionId: string;
  flowId: string;
  flowData: any;
}

export class TestFlowResponseDto {
  testSessionId: string;
  flowId: string;
  responseData: any;
}

export class TestErrorDto {
  testSessionId: string;
  error: string;
  nodeId?: string;
  recoverable: boolean;
}

export class TestPausedDto {
  testSessionId: string;
  atNodeId: string | null;
}

export class TestCompletedDto {
  testSessionId: string;
  reason: string;
  summary: {
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    nodesExecuted: number;
    variablesSet: number;
  };
  duration: number;
}

export class TestStateRecoveryDto {
  testSessionId: string;
  state: {
    status: 'initializing' | 'running' | 'paused' | 'waiting_input' | 'completed' | 'error';
    currentNodeId: string | null;
    currentNodeLabel: string | null;
    waitingForInput?: boolean;
  };
  messages: TestMessageDto[];
  variables: Record<string, any>;
  executionHistory: Array<{
    nodeId: string;
    nodeType: string;
    nodeLabel: string;
    enteredAt: Date;
    exitedAt?: Date;
    duration?: number;
    result?: 'success' | 'error' | 'skipped';
    error?: string;
  }>;
  missedEvents?: Array<{ event: string; data: any }>;
}
