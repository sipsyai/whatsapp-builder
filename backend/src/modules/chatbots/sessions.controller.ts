import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SessionHistoryService } from './services/session-history.service';
import { SessionGateway } from '../websocket/session.gateway';
import {
  ChatbotSessionDto,
  ChatbotSessionDetailDto,
  PaginatedSessionsDto,
  SessionQueryDto,
  MessageDto,
} from './dto/session.dto';

@ApiTags('Chatbot Sessions')
@Controller('api/chatbot-sessions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SessionsController {
  constructor(
    private readonly sessionHistoryService: SessionHistoryService,
    private readonly sessionGateway: SessionGateway,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get chatbot sessions',
    description: 'Retrieves paginated chatbot sessions with optional filtering by status and chatbot',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['running', 'waiting_input', 'waiting_flow', 'completed', 'expired', 'stopped'],
    description: 'Filter by session status',
  })
  @ApiQuery({
    name: 'chatbotId',
    required: false,
    type: String,
    description: 'Filter by chatbot UUID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of sessions to return (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of sessions to skip (default: 0)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'completedAt'],
    description: 'Field to sort by (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated sessions returned successfully',
    type: PaginatedSessionsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async getSessions(
    @Query(new ValidationPipe({ transform: true })) queryDto: SessionQueryDto,
  ): Promise<PaginatedSessionsDto> {
    return this.sessionHistoryService.getSessions(queryDto);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active sessions',
    description: 'Retrieves all currently active chatbot sessions (running or waiting)',
  })
  @ApiResponse({
    status: 200,
    description: 'Active sessions returned successfully',
    type: [ChatbotSessionDto],
  })
  async getActiveSessions(): Promise<ChatbotSessionDto[]> {
    return this.sessionHistoryService.getActiveSessions();
  }

  @Get('chatbot/:chatbotId')
  @ApiOperation({
    summary: 'Get sessions by chatbot',
    description: 'Retrieves paginated sessions for a specific chatbot with optional filtering',
  })
  @ApiParam({
    name: 'chatbotId',
    description: 'Chatbot UUID',
    type: String,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['running', 'waiting_input', 'waiting_flow', 'completed', 'expired', 'stopped'],
    description: 'Filter by session status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of sessions to return (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of sessions to skip (default: 0)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'completedAt'],
    description: 'Field to sort by (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated chatbot sessions returned successfully',
    type: PaginatedSessionsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid chatbot ID or query parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot not found',
  })
  async getSessionsByChatbot(
    @Param('chatbotId', ParseUUIDPipe) chatbotId: string,
    @Query(new ValidationPipe({ transform: true })) queryDto: SessionQueryDto,
  ): Promise<PaginatedSessionsDto> {
    // Add chatbotId to the query
    const queryWithChatbot = { ...queryDto, chatbotId };
    return this.sessionHistoryService.getSessions(queryWithChatbot);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get session details',
    description: 'Retrieves detailed information about a specific chatbot session including context and variables',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Session details returned successfully',
    type: ChatbotSessionDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async getSessionDetail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChatbotSessionDetailDto> {
    return this.sessionHistoryService.getSessionDetail(id);
  }

  @Get(':id/messages')
  @ApiOperation({
    summary: 'Get session messages',
    description: 'Retrieves all messages associated with a specific chatbot session',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Session messages returned successfully',
    type: [MessageDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async getSessionMessages(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MessageDto[]> {
    return this.sessionHistoryService.getSessionMessages(id);
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stop a session',
    description: 'Manually stops an active chatbot session',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Session stopped successfully',
    type: ChatbotSessionDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async stopSession(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChatbotSessionDetailDto> {
    // Get session before stopping to capture previous status
    const sessionBefore = await this.sessionHistoryService.getSessionDetail(id);
    const previousStatus = sessionBefore.status;

    // Update session status to stopped
    await this.sessionHistoryService.updateSessionStatus(
      id,
      'stopped',
      'Manually stopped by user',
    );

    // Get updated session
    const sessionAfter = await this.sessionHistoryService.getSessionDetail(id);

    // Emit WebSocket event for real-time UI update
    this.sessionGateway.emitSessionStatusChanged({
      sessionId: id,
      previousStatus,
      newStatus: 'stopped',
      currentNodeId: sessionAfter.currentNodeId,
      currentNodeLabel: sessionAfter.currentNodeLabel,
      updatedAt: new Date(),
    });

    return sessionAfter;
  }
}
