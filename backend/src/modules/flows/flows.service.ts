import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppFlow, WhatsAppFlowStatus } from '../../entities/whatsapp-flow.entity';
import { WhatsAppFlowService } from '../whatsapp/services/whatsapp-flow.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';

@Injectable()
export class FlowsService {
  private readonly logger = new Logger(FlowsService.name);

  constructor(
    @InjectRepository(WhatsAppFlow)
    private readonly flowRepo: Repository<WhatsAppFlow>,
    private readonly whatsappFlowService: WhatsAppFlowService,
  ) {}

  /**
   * Create a new Flow and publish it to WhatsApp
   */
  async create(dto: CreateFlowDto): Promise<WhatsAppFlow> {
    this.logger.log(`Creating flow: ${dto.name}`);

    // Create Flow in WhatsApp API
    const whatsappResponse = await this.whatsappFlowService.createFlow({
      name: dto.name,
      categories: dto.categories,
      flowJson: dto.flowJson,
      endpointUri: dto.endpointUri,
    });

    // Save to local database
    const flow = this.flowRepo.create({
      whatsappFlowId: whatsappResponse.id,
      name: dto.name,
      description: dto.description,
      status: WhatsAppFlowStatus.DRAFT,
      categories: dto.categories,
      flowJson: dto.flowJson,
      endpointUri: dto.endpointUri,
      isActive: true,
    });

    await this.flowRepo.save(flow);

    this.logger.log(`Flow created: ${flow.id} (WhatsApp ID: ${flow.whatsappFlowId})`);

    return flow;
  }

  /**
   * Get all Flows
   */
  async findAll(): Promise<WhatsAppFlow[]> {
    return this.flowRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get Flow by ID
   */
  async findOne(id: string): Promise<WhatsAppFlow> {
    const flow = await this.flowRepo.findOne({ where: { id } });

    if (!flow) {
      throw new NotFoundException(`Flow ${id} not found`);
    }

    return flow;
  }

  /**
   * Update Flow
   */
  async update(id: string, dto: UpdateFlowDto): Promise<WhatsAppFlow> {
    const flow = await this.findOne(id);

    this.logger.log(`Updating flow: ${id}`);

    // Update in WhatsApp API if published
    if (flow.whatsappFlowId && (dto.name || dto.categories || dto.flowJson || dto.endpointUri)) {
      try {
        await this.whatsappFlowService.updateFlow(flow.whatsappFlowId, {
          name: dto.name,
          categories: dto.categories,
          flowJson: dto.flowJson,
          endpointUri: dto.endpointUri,
        });

        // After update, Flow goes back to DRAFT status
        flow.status = WhatsAppFlowStatus.DRAFT;
      } catch (error) {
        this.logger.error(`Failed to update Flow in WhatsApp API: ${error.message}`);
        throw error;
      }
    }

    // Update local database
    if (dto.name) flow.name = dto.name;
    if (dto.description !== undefined) flow.description = dto.description;
    if (dto.categories) flow.categories = dto.categories;
    if (dto.flowJson) flow.flowJson = dto.flowJson;
    if (dto.endpointUri !== undefined) flow.endpointUri = dto.endpointUri;
    if (dto.isActive !== undefined) flow.isActive = dto.isActive;

    await this.flowRepo.save(flow);

    this.logger.log(`Flow updated: ${id}`);

    return flow;
  }

  /**
   * Publish Flow to WhatsApp
   */
  async publish(id: string): Promise<WhatsAppFlow> {
    const flow = await this.findOne(id);

    if (!flow.whatsappFlowId) {
      throw new Error('Flow has no WhatsApp ID');
    }

    this.logger.log(`Publishing flow: ${id}`);

    // Publish in WhatsApp API
    await this.whatsappFlowService.publishFlow(flow.whatsappFlowId);

    // Update status
    flow.status = WhatsAppFlowStatus.PUBLISHED;
    await this.flowRepo.save(flow);

    // Get preview URL
    try {
      const previewUrl = await this.whatsappFlowService.getPreviewUrl(flow.whatsappFlowId);
      flow.previewUrl = previewUrl;
      await this.flowRepo.save(flow);
    } catch (error) {
      this.logger.warn(`Could not get preview URL: ${error.message}`);
    }

    this.logger.log(`Flow published: ${id}`);

    return flow;
  }

  /**
   * Get Flow preview URL
   */
  async getPreview(id: string, invalidate = false): Promise<string> {
    const flow = await this.findOne(id);

    if (!flow.whatsappFlowId) {
      throw new Error('Flow has not been published');
    }

    const previewUrl = await this.whatsappFlowService.getPreviewUrl(
      flow.whatsappFlowId,
      invalidate,
    );

    // Save preview URL
    flow.previewUrl = previewUrl;
    await this.flowRepo.save(flow);

    return previewUrl;
  }

  /**
   * Delete Flow
   */
  async delete(id: string): Promise<void> {
    const flow = await this.findOne(id);

    this.logger.log(`Deleting flow: ${id}`);

    // Delete from WhatsApp API if published
    if (flow.whatsappFlowId) {
      try {
        await this.whatsappFlowService.deleteFlow(flow.whatsappFlowId);
      } catch (error) {
        this.logger.warn(
          `Could not delete Flow from WhatsApp API: ${error.message}`,
        );
        // Continue with local deletion
      }
    }

    // Delete from local database
    await this.flowRepo.remove(flow);

    this.logger.log(`Flow deleted: ${id}`);
  }

  /**
   * Get active Flows (for use in ChatBot nodes)
   */
  async getActiveFlows(): Promise<WhatsAppFlow[]> {
    return this.flowRepo.find({
      where: {
        isActive: true,
        status: WhatsAppFlowStatus.PUBLISHED,
      },
      order: { name: 'ASC' },
    });
  }
}
