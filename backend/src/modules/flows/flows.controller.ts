import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  PayloadTooLargeException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FlowsService, SyncResult, FlowValidationResult } from './flows.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { CreateFlowFromPlaygroundDto } from './dto/create-flow-from-playground.dto';
import { ValidateFlowDto } from './dto/validate-flow.dto';
import { ExportFlowQueryDto, ExportFlowResponseDto } from './dto/export-flow.dto';
import { ImportFlowBodyDto, ImportFlowResponseDto } from './dto/import-flow.dto';
import { WhatsAppFlow } from '../../entities/whatsapp-flow.entity';

@ApiTags('Flows')
@Controller('api/flows')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import flow', description: 'Imports a WhatsApp Flow from JSON file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Flow JSON file and import options',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JSON file containing flow configuration (max 5MB)',
        },
        name: {
          type: 'string',
          description: 'Optional: Override flow name',
        },
        createInMeta: {
          type: 'boolean',
          description: 'Create flow in Meta API (default: false)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Flow imported successfully', type: ImportFlowResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @ApiResponse({ status: 413, description: 'File too large (max 5MB)' })
  async importFlow(
    @UploadedFile() file: Express.Multer.File,
    @Body() bodyDto: ImportFlowBodyDto,
  ): Promise<ImportFlowResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const validMimeTypes = ['application/json', 'text/plain', 'text/json', 'application/octet-stream'];
    const isValidMimeType = validMimeTypes.includes(file.mimetype);
    const hasJsonExtension = file.originalname?.toLowerCase().endsWith('.json');

    if (!isValidMimeType && !hasJsonExtension) {
      throw new BadRequestException('File must be a JSON file');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new PayloadTooLargeException('File size exceeds 5MB limit');
    }

    return this.flowsService.importFlow(file.buffer, bodyDto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new WhatsApp Flow', description: 'Creates a new WhatsApp Flow with JSON definition and categories' })
  @ApiBody({ type: CreateFlowDto })
  @ApiResponse({ status: 201, description: 'Flow created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateFlowDto): Promise<WhatsAppFlow> {
    return this.flowsService.create(dto);
  }

  @Post('from-playground')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Flow from Playground JSON',
    description: 'Creates a WhatsApp Flow from exported Playground JSON. Automatically validates and normalizes the JSON structure.'
  })
  @ApiBody({ type: CreateFlowFromPlaygroundDto })
  @ApiResponse({ status: 201, description: 'Flow created successfully from playground JSON' })
  @ApiResponse({ status: 400, description: 'Invalid playground JSON format or validation failed' })
  async createFromPlayground(@Body() dto: CreateFlowFromPlaygroundDto): Promise<WhatsAppFlow> {
    return this.flowsService.createFromPlayground(dto);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate Flow JSON against Meta API',
    description: 'Validates Flow JSON by creating/updating a draft flow in Meta and returning validation errors. Does not publish the flow.'
  })
  @ApiBody({ type: ValidateFlowDto })
  @ApiResponse({ status: 200, description: 'Validation result returned' })
  @ApiResponse({ status: 400, description: 'Invalid flow JSON structure' })
  async validateFlow(@Body() dto: ValidateFlowDto): Promise<FlowValidationResult> {
    return this.flowsService.validateFlowJson(dto);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync flows from Meta API', description: 'Fetches all flows from WhatsApp Business Account and syncs with local database' })
  @ApiResponse({ status: 200, description: 'Sync completed successfully' })
  @ApiResponse({ status: 500, description: 'Sync failed' })
  async syncFromMeta(): Promise<SyncResult> {
    return this.flowsService.syncFromMeta();
  }

  @Get()
  @ApiOperation({ summary: 'Get all flows', description: 'Retrieves all WhatsApp Flows from the database' })
  @ApiResponse({ status: 200, description: 'List of flows returned successfully' })
  async findAll(): Promise<WhatsAppFlow[]> {
    return this.flowsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active flows', description: 'Retrieves all active/published WhatsApp Flows for ChatBot node selection' })
  @ApiResponse({ status: 200, description: 'List of active flows returned successfully' })
  async getActive(): Promise<WhatsAppFlow[]> {
    return this.flowsService.getActiveFlows();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get flow by ID', description: 'Retrieves a specific WhatsApp Flow by its UUID' })
  @ApiParam({ name: 'id', description: 'Flow UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Flow returned successfully' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async findOne(@Param('id') id: string): Promise<WhatsAppFlow> {
    return this.flowsService.findOne(id);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export flow', description: 'Exports a WhatsApp Flow configuration as JSON file' })
  @ApiParam({ name: 'id', description: 'Flow UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Flow exported successfully', type: ExportFlowResponseDto })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async exportFlow(
    @Param('id') id: string,
    @Query() queryDto: ExportFlowQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ExportFlowResponseDto> {
    const result = await this.flowsService.exportFlow(id, queryDto);

    const safeName = result.flow.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const filename = `flow-${safeName}-${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    return result;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update flow', description: 'Updates an existing WhatsApp Flow configuration' })
  @ApiParam({ name: 'id', description: 'Flow UUID', type: 'string' })
  @ApiBody({ type: UpdateFlowDto })
  @ApiResponse({ status: 200, description: 'Flow updated successfully' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFlowDto,
  ): Promise<WhatsAppFlow> {
    return this.flowsService.update(id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish flow to WhatsApp', description: 'Publishes a draft flow to WhatsApp, making it available for use' })
  @ApiParam({ name: 'id', description: 'Flow UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Flow published successfully' })
  @ApiResponse({ status: 400, description: 'Flow cannot be published (validation errors)' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async publish(@Param('id') id: string): Promise<WhatsAppFlow> {
    return this.flowsService.publish(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get flow preview URL', description: 'Gets a preview URL to test the flow in WhatsApp' })
  @ApiParam({ name: 'id', description: 'Flow UUID', type: 'string' })
  @ApiQuery({ name: 'invalidate', required: false, description: 'Set to true to invalidate cached preview URL', type: 'string' })
  @ApiResponse({ status: 200, description: 'Preview URL returned successfully' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async getPreview(
    @Param('id') id: string,
    @Query('invalidate') invalidate?: string,
  ): Promise<{ previewUrl: string }> {
    const previewUrl = await this.flowsService.getPreview(
      id,
      invalidate === 'true',
    );
    return { previewUrl };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete flow', description: 'Deletes a WhatsApp Flow (deprecates if published, then removes)' })
  @ApiParam({ name: 'id', description: 'Flow UUID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Flow deleted successfully' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.flowsService.delete(id);
  }

  @Get(':id/validation-errors')
  @ApiOperation({ summary: 'Get flow validation errors from Meta API', description: 'Fetches validation errors for a flow from WhatsApp API' })
  @ApiParam({ name: 'id', description: 'Flow UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Validation errors returned successfully' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async getValidationErrors(@Param('id') id: string): Promise<any> {
    return this.flowsService.getValidationErrors(id);
  }

  @Post(':id/fix-json')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fix Flow JSON structure',
    description: 'Automatically fixes routing_model/data_api_version consistency issues in Flow JSON'
  })
  @ApiParam({ name: 'id', description: 'Flow UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Flow JSON fixed and updated successfully' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async fixFlowJson(@Param('id') id: string): Promise<WhatsAppFlow> {
    return this.flowsService.fixFlowJson(id);
  }
}
