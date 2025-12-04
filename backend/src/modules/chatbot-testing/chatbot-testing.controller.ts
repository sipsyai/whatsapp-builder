import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TestSessionService } from './services/test-session.service';
import {
  StartTestSessionDto,
  SimulateMessageDto,
  TestSessionResponseDto,
  TestSessionActionResponseDto,
  TestStateDto,
} from './dto/test-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('Chatbot Testing')
@ApiBearerAuth()
@Controller('api/test-sessions')
@UseGuards(JwtAuthGuard)
export class ChatbotTestingController {
  private readonly logger = new Logger(ChatbotTestingController.name);

  constructor(private readonly testSessionService: TestSessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start a new test session',
    description: 'Creates a new test session for a chatbot with optional initial variables and configuration',
  })
  @ApiBody({ type: StartTestSessionDto })
  @ApiResponse({
    status: 201,
    description: 'Test session started successfully',
    type: TestSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or chatbot has no START node',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot or user not found',
  })
  async startTestSession(
    @Body() dto: StartTestSessionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<TestSessionResponseDto> {
    this.logger.log(`User ${user.userId} starting test session for chatbot ${dto.chatbotId}`);
    try {
      return await this.testSessionService.startTestSession(dto, user.userId);
    } catch (error) {
      this.logger.error(`Failed to start test session: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a simulated user message',
    description: 'Simulates a user response in the test session (text, button click, list selection, or flow response)',
  })
  @ApiParam({
    name: 'id',
    description: 'Test session UUID',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: SimulateMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Message processed successfully',
    type: TestSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Session is not waiting for input',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Test session not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Test session is paused',
  })
  async sendMessage(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: SimulateMessageDto,
  ): Promise<TestSessionResponseDto> {
    this.logger.log(`Sending message to test session ${sessionId}: ${dto.message}`);
    try {
      return await this.testSessionService.simulateUserResponse(sessionId, dto);
    } catch (error) {
      this.logger.error(`Failed to send message to session ${sessionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pause test session',
    description: 'Pauses a running test session. Execution will stop until resumed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Test session UUID',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Test session paused successfully',
    type: TestSessionActionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot pause an inactive or completed session',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Test session not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Session is already paused',
  })
  async pauseTest(
    @Param('id', ParseUUIDPipe) sessionId: string,
  ): Promise<TestSessionActionResponseDto> {
    this.logger.log(`Pausing test session ${sessionId}`);
    try {
      return await this.testSessionService.pauseTest(sessionId);
    } catch (error) {
      this.logger.error(`Failed to pause session ${sessionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resume test session',
    description: 'Resumes a paused test session. Execution will continue from where it was paused.',
  })
  @ApiParam({
    name: 'id',
    description: 'Test session UUID',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Test session resumed successfully',
    type: TestSessionActionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot resume an inactive session or session is not paused',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Test session not found',
  })
  async resumeTest(
    @Param('id', ParseUUIDPipe) sessionId: string,
  ): Promise<TestSessionActionResponseDto> {
    this.logger.log(`Resuming test session ${sessionId}`);
    try {
      return await this.testSessionService.resumeTest(sessionId);
    } catch (error) {
      this.logger.error(`Failed to resume session ${sessionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stop test session',
    description: 'Stops a test session permanently. The session cannot be resumed after stopping.',
  })
  @ApiParam({
    name: 'id',
    description: 'Test session UUID',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Test session stopped successfully',
    type: TestSessionActionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Session is already inactive',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Test session not found',
  })
  async stopTest(
    @Param('id', ParseUUIDPipe) sessionId: string,
  ): Promise<TestSessionActionResponseDto> {
    this.logger.log(`Stopping test session ${sessionId}`);
    try {
      return await this.testSessionService.stopTest(sessionId);
    } catch (error) {
      this.logger.error(`Failed to stop session ${sessionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/state')
  @ApiOperation({
    summary: 'Get test session state',
    description: 'Retrieves the current state of a test session including variables, node history, messages, and loop detection stats',
  })
  @ApiParam({
    name: 'id',
    description: 'Test session UUID',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Test session state retrieved successfully',
    type: TestStateDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Test session not found',
  })
  async getTestState(
    @Param('id', ParseUUIDPipe) sessionId: string,
  ): Promise<TestStateDto> {
    this.logger.log(`Getting state for test session ${sessionId}`);
    try {
      return await this.testSessionService.getTestState(sessionId);
    } catch (error) {
      this.logger.error(`Failed to get state for session ${sessionId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
