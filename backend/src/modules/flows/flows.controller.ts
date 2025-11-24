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
import { FlowsService } from './flows.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { WhatsAppFlow } from '../../entities/whatsapp-flow.entity';

@Controller('api/flows')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  /**
   * Create a new Flow
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateFlowDto): Promise<WhatsAppFlow> {
    return this.flowsService.create(dto);
  }

  /**
   * Get all Flows
   */
  @Get()
  async findAll(): Promise<WhatsAppFlow[]> {
    return this.flowsService.findAll();
  }

  /**
   * Get active Flows (for ChatBot node selection)
   */
  @Get('active')
  async getActive(): Promise<WhatsAppFlow[]> {
    return this.flowsService.getActiveFlows();
  }

  /**
   * Get Flow by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WhatsAppFlow> {
    return this.flowsService.findOne(id);
  }

  /**
   * Update Flow
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFlowDto,
  ): Promise<WhatsAppFlow> {
    return this.flowsService.update(id, dto);
  }

  /**
   * Publish Flow to WhatsApp
   */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publish(@Param('id') id: string): Promise<WhatsAppFlow> {
    return this.flowsService.publish(id);
  }

  /**
   * Get Flow preview URL
   */
  @Get(':id/preview')
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

  /**
   * Delete Flow
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.flowsService.delete(id);
  }
}
