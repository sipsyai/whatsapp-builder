import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ChatBotsService } from './chatbots.service';
import { ChatBotExecutionService } from './services/chatbot-execution.service';
import { ContextCleanupService } from './services/context-cleanup.service';
import { RestApiExecutorService } from './services/rest-api-executor.service';
import { CreateChatBotDto } from './dto/create-chatbot.dto';
import { UpdateChatBotDto } from './dto/update-chatbot.dto';
import { QueryChatBotsDto } from './dto/query-chatbots.dto';
import { TestRestApiDto } from './dto/test-rest-api.dto';

@ApiTags('Chatbots')
@Controller('api/chatbots')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ChatBotsController {
  constructor(
    private readonly chatbotsService: ChatBotsService,
    private readonly executionService: ChatBotExecutionService,
    private readonly cleanupService: ContextCleanupService,
    private readonly restApiExecutor: RestApiExecutorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chatbot', description: 'Creates a new chatbot with nodes and edges configuration' })
  @ApiBody({ type: CreateChatBotDto })
  @ApiResponse({ status: 201, description: 'Chatbot created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createChatBotDto: CreateChatBotDto) {
    return this.chatbotsService.create(createChatBotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chatbots', description: 'Retrieves all chatbots with optional filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of chatbots returned successfully' })
  async findAll(@Query() queryDto: QueryChatBotsDto) {
    return this.chatbotsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chatbot by ID', description: 'Retrieves a specific chatbot by its UUID' })
  @ApiParam({ name: 'id', description: 'Chatbot UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Chatbot returned successfully' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async findOne(@Param('id') id: string) {
    return this.chatbotsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get chatbot statistics', description: 'Retrieves usage statistics for a specific chatbot' })
  @ApiParam({ name: 'id', description: 'Chatbot UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Chatbot statistics returned successfully' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async getChatBotStats(@Param('id') id: string) {
    return this.chatbotsService.getChatBotStats(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update chatbot', description: 'Fully updates a chatbot configuration' })
  @ApiParam({ name: 'id', description: 'Chatbot UUID', type: 'string' })
  @ApiBody({ type: UpdateChatBotDto })
  @ApiResponse({ status: 200, description: 'Chatbot updated successfully' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async update(@Param('id') id: string, @Body() updateChatBotDto: UpdateChatBotDto) {
    return this.chatbotsService.update(id, updateChatBotDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update chatbot', description: 'Partially updates a chatbot configuration' })
  @ApiParam({ name: 'id', description: 'Chatbot UUID', type: 'string' })
  @ApiBody({ type: UpdateChatBotDto })
  @ApiResponse({ status: 200, description: 'Chatbot partially updated successfully' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async partialUpdate(
    @Param('id') id: string,
    @Body() updateData: Partial<UpdateChatBotDto>,
  ) {
    return this.chatbotsService.partialUpdate(id, updateData);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore archived chatbot', description: 'Restores a previously archived chatbot to active status' })
  @ApiParam({ name: 'id', description: 'Chatbot UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Chatbot restored successfully' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async restore(@Param('id') id: string) {
    return this.chatbotsService.restore(id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle chatbot active status', description: 'Toggles the active/inactive status of a chatbot' })
  @ApiParam({ name: 'id', description: 'Chatbot UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Chatbot active status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async toggleActive(@Param('id') id: string) {
    return this.chatbotsService.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete chatbot permanently', description: 'Permanently deletes a chatbot from the system' })
  @ApiParam({ name: 'id', description: 'Chatbot UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Chatbot deleted successfully' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async delete(@Param('id') id: string) {
    return this.chatbotsService.delete(id);
  }

  @Delete(':id/soft')
  @ApiOperation({ summary: 'Soft delete chatbot', description: 'Archives a chatbot without permanent deletion' })
  @ApiParam({ name: 'id', description: 'Chatbot UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Chatbot archived successfully' })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async softDelete(@Param('id') id: string) {
    return this.chatbotsService.softDelete(id);
  }

  @Post('conversations/:conversationId/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop chatbot execution', description: 'Stops an active chatbot session for a specific conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Chatbot stopped successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async stopChatBot(@Param('conversationId') conversationId: string) {
    await this.executionService.stopChatBot(conversationId);
    return { message: 'Chatbot stopped successfully', conversationId };
  }

  // ==================== DEBUG ENDPOINTS ====================

  @Get('debug/contexts')
  @ApiOperation({ summary: 'Get all active contexts', description: 'Returns all active conversation contexts for debugging' })
  @ApiResponse({ status: 200, description: 'Active contexts returned successfully' })
  async getActiveContexts() {
    return this.executionService.getAllActiveContexts();
  }

  @Get('debug/contexts/stats')
  @ApiOperation({ summary: 'Get context statistics', description: 'Returns statistics about active and expired contexts' })
  @ApiResponse({ status: 200, description: 'Context stats returned successfully' })
  async getContextStats() {
    return this.cleanupService.getContextStats();
  }

  @Post('debug/contexts/:contextId/force-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force complete a context', description: 'Forces a stuck context to move to next node or complete' })
  @ApiParam({ name: 'contextId', description: 'Context UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Context force completed successfully' })
  @ApiResponse({ status: 404, description: 'Context not found' })
  async forceCompleteContext(@Param('contextId') contextId: string) {
    await this.executionService.forceCompleteContext(contextId);
    return { message: 'Context force completed successfully', contextId };
  }

  @Post('debug/cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force cleanup expired contexts', description: 'Manually triggers cleanup of expired contexts' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async forceCleanup() {
    const cleanedCount = await this.cleanupService.forceCleanup();
    return { message: 'Cleanup completed', cleanedCount };
  }

  @Post('conversations/:conversationId/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip current node', description: 'Skips the current node for a stuck conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Node skipped successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found or nothing to skip' })
  async skipCurrentNode(@Param('conversationId') conversationId: string) {
    const result = await this.executionService.skipCurrentNode(conversationId);
    if (!result) {
      return { message: 'Nothing to skip', conversationId, skipped: false };
    }
    return { message: 'Node skipped successfully', conversationId, skipped: true };
  }

  @Post('test-rest-api')
  @ApiOperation({ summary: 'Test a REST API call' })
  @ApiBody({ type: TestRestApiDto })
  @ApiResponse({ status: 200, description: 'API test result' })
  async testRestApi(@Body() dto: TestRestApiDto) {
    const result = await this.restApiExecutor.execute(
      {
        url: dto.url,
        method: dto.method,
        headers: dto.headers,
        body: dto.body,
        timeout: dto.timeout,
        responsePath: dto.responsePath,
      },
      dto.testVariables || {},
    );
    return result;
  }
}
