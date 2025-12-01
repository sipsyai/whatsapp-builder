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
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ChatBotsService } from './chatbots.service';
import { ChatBotExecutionService } from './services/chatbot-execution.service';
import { ContextCleanupService } from './services/context-cleanup.service';
import { RestApiExecutorService } from './services/rest-api-executor.service';
import { CreateChatBotDto } from './dto/create-chatbot.dto';
import { UpdateChatBotDto } from './dto/update-chatbot.dto';
import { QueryChatBotsDto } from './dto/query-chatbots.dto';
import { TestRestApiDto } from './dto/test-rest-api.dto';
import { ExportChatbotQueryDto, ExportChatbotResponseDto } from './dto/export-chatbot.dto';
import { ImportChatbotBodyDto, ImportChatbotResponseDto } from './dto/import-chatbot.dto';

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

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import chatbot', description: 'Imports a chatbot from a JSON file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Chatbot JSON file and import options',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JSON file containing chatbot configuration (max 5MB)',
        },
        name: {
          type: 'string',
          description: 'Optional: Override chatbot name',
        },
        createAsNew: {
          type: 'boolean',
          description: 'Create as new chatbot (generates new ID)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Chatbot imported successfully',
    type: ImportChatbotResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @ApiResponse({ status: 413, description: 'File too large (max 5MB)' })
  async importChatbot(
    @UploadedFile() file: Express.Multer.File,
    @Body() bodyDto: ImportChatbotBodyDto,
  ) {
    // Validate file exists
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type - accept multiple MIME types for JSON files
    // Different browsers/tools may send different MIME types for JSON files
    const validMimeTypes = [
      'application/json',
      'text/plain',
      'text/json',
      'application/octet-stream',
    ];
    const isValidMimeType = validMimeTypes.includes(file.mimetype);
    const hasJsonExtension = file.originalname?.toLowerCase().endsWith('.json');

    if (!isValidMimeType && !hasJsonExtension) {
      throw new BadRequestException('File must be a JSON file');
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new PayloadTooLargeException('File size exceeds 5MB limit');
    }

    return this.chatbotsService.importChatbot(file.buffer, bodyDto);
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

  @Get(':id/export')
  @ApiOperation({ summary: 'Export chatbot', description: 'Exports a chatbot configuration as JSON file' })
  @ApiParam({ name: 'id', description: 'Chatbot UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Chatbot exported successfully',
    type: ExportChatbotResponseDto
  })
  @ApiResponse({ status: 404, description: 'Chatbot not found' })
  async exportChatbot(
    @Param('id') id: string,
    @Query() queryDto: ExportChatbotQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.chatbotsService.exportChatbot(id, queryDto);

    // Generate filename from chatbot name (sanitize for header safety)
    const safeName = result.chatbot.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')          // Replace spaces with dashes
      .substring(0, 50);             // Limit length
    const filename = `chatbot-${safeName}-${Date.now()}.json`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );

    return result;
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
