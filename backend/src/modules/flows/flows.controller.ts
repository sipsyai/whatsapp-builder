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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FlowsService, SyncResult } from './flows.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { WhatsAppFlow } from '../../entities/whatsapp-flow.entity';

@ApiTags('Flows')
@Controller('api/flows')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new WhatsApp Flow', description: 'Creates a new WhatsApp Flow with JSON definition and categories' })
  @ApiBody({ type: CreateFlowDto })
  @ApiResponse({ status: 201, description: 'Flow created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateFlowDto): Promise<WhatsAppFlow> {
    return this.flowsService.create(dto);
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
}
