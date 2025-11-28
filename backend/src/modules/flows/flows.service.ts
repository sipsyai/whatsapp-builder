import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppFlow, WhatsAppFlowStatus, WhatsAppFlowCategory } from '../../entities/whatsapp-flow.entity';
import { WhatsAppFlowService } from '../whatsapp/services/whatsapp-flow.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { CreateFlowFromPlaygroundDto } from './dto/create-flow-from-playground.dto';
import { MetaFlowItem } from '../whatsapp/interfaces/flow.interface';

export interface SyncResult {
  created: number;
  updated: number;
  unchanged: number;
  total: number;
  flows: WhatsAppFlow[];
}

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
   * Create a Flow from Playground JSON export
   * This handles the specific format exported from WhatsApp Flow Playground
   */
  async createFromPlayground(dto: CreateFlowFromPlaygroundDto): Promise<WhatsAppFlow> {
    this.logger.log(`Creating flow from playground JSON`);

    // Validate playground JSON structure
    if (!dto.playgroundJson || typeof dto.playgroundJson !== 'object') {
      throw new BadRequestException('Invalid playground JSON format');
    }

    // Extract or validate required fields from playground JSON
    const flowJson = this.validateAndNormalizePlaygroundJson(dto.playgroundJson);

    // Generate flow name if not provided
    const flowName = dto.name || this.generateFlowNameFromPlayground(flowJson) || 'Playground Flow';

    this.logger.log(`Creating flow with name: ${flowName}`);

    // Create Flow in WhatsApp API
    const whatsappResponse = await this.whatsappFlowService.createFlow({
      name: flowName,
      categories: dto.categories,
      flowJson: flowJson,
      endpointUri: dto.endpointUri,
    });

    // Save to local database
    const flow = this.flowRepo.create({
      whatsappFlowId: whatsappResponse.id,
      name: flowName,
      description: dto.description || 'Created from WhatsApp Flow Playground',
      status: WhatsAppFlowStatus.DRAFT,
      categories: dto.categories,
      flowJson: flowJson,
      endpointUri: dto.endpointUri,
      isActive: true,
      metadata: {
        source: 'playground',
        created_from_playground: true,
        playground_json_received: new Date().toISOString(),
      },
    });

    await this.flowRepo.save(flow);

    this.logger.log(`Flow created from playground: ${flow.id} (WhatsApp ID: ${flow.whatsappFlowId})`);

    // Auto-publish if requested
    if (dto.autoPublish) {
      this.logger.log(`Auto-publishing flow: ${flow.id}`);
      return this.publish(flow.id);
    }

    return flow;
  }

  /**
   * Validate and normalize playground JSON to WhatsApp Flow JSON format
   * Playground may export in slightly different format than API expects
   */
  private validateAndNormalizePlaygroundJson(playgroundJson: any): any {
    // Check for required version field
    if (!playgroundJson.version) {
      throw new BadRequestException('Playground JSON missing required "version" field');
    }

    // Check for screens array
    if (!playgroundJson.screens || !Array.isArray(playgroundJson.screens)) {
      throw new BadRequestException('Playground JSON missing required "screens" array');
    }

    if (playgroundJson.screens.length === 0) {
      throw new BadRequestException('Playground JSON must contain at least one screen');
    }

    // Normalize the JSON structure
    const normalizedJson: any = {
      version: playgroundJson.version,
      screens: playgroundJson.screens,
    };

    // Include optional fields if present
    if (playgroundJson.data_api_version) {
      normalizedJson.data_api_version = playgroundJson.data_api_version;
    }

    if (playgroundJson.routing_model) {
      normalizedJson.routing_model = playgroundJson.routing_model;
    }

    // Include any other fields that might be in playground export
    const knownFields = ['version', 'screens', 'data_api_version', 'routing_model'];
    for (const key in playgroundJson) {
      if (!knownFields.includes(key) && playgroundJson[key] !== undefined) {
        normalizedJson[key] = playgroundJson[key];
      }
    }

    this.logger.log(`Normalized playground JSON with ${normalizedJson.screens.length} screens`);

    return normalizedJson;
  }

  /**
   * Generate a flow name from playground JSON
   * Tries to extract from first screen title or uses default
   */
  private generateFlowNameFromPlayground(flowJson: any): string | null {
    try {
      // Try to get first screen's title
      if (flowJson.screens && flowJson.screens.length > 0) {
        const firstScreen = flowJson.screens[0];
        if (firstScreen.title) {
          return `${firstScreen.title} Flow`;
        }
        if (firstScreen.id) {
          // Convert screen ID to readable name (e.g., "WELCOME_SCREEN" -> "Welcome Screen")
          return firstScreen.id
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
      }
    } catch (error) {
      this.logger.warn(`Could not extract name from playground JSON: ${error.message}`);
    }
    return null;
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

    this.logger.log(`Deleting flow: ${id} (status: ${flow.status})`);

    // Delete from WhatsApp API if published
    if (flow.whatsappFlowId) {
      try {
        // If Flow is PUBLISHED, deprecate it first
        if (flow.status === WhatsAppFlowStatus.PUBLISHED) {
          this.logger.log(`Flow is PUBLISHED, deprecating before deletion: ${flow.whatsappFlowId}`);

          try {
            await this.whatsappFlowService.deprecateFlow(flow.whatsappFlowId);
            this.logger.log(`Flow deprecated successfully: ${flow.whatsappFlowId}`);

            // Update local status
            flow.status = WhatsAppFlowStatus.DEPRECATED;
            await this.flowRepo.save(flow);
          } catch (deprecateError) {
            this.logger.warn(
              `Could not deprecate Flow in WhatsApp API: ${deprecateError.message}`,
            );
            // Continue with deletion attempt anyway
          }
        }

        // Attempt to delete from WhatsApp API
        await this.whatsappFlowService.deleteFlow(flow.whatsappFlowId);
        this.logger.log(`Flow deleted from WhatsApp API: ${flow.whatsappFlowId}`);
      } catch (error) {
        this.logger.warn(
          `Could not delete Flow from WhatsApp API: ${error.message}. Continuing with local deletion.`,
        );
        // Continue with local deletion even if WhatsApp API deletion fails
      }
    }

    // Delete from local database
    await this.flowRepo.remove(flow);

    this.logger.log(`Flow deleted from database: ${id}`);
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

  /**
   * Sync flows from Meta/Facebook API
   * Fetches all flows from WABA and creates/updates local database records
   */
  async syncFromMeta(): Promise<SyncResult> {
    this.logger.log('Starting flow sync from Meta API');

    const result: SyncResult = {
      created: 0,
      updated: 0,
      unchanged: 0,
      total: 0,
      flows: [],
    };

    // Fetch all flows from Meta
    const metaFlows = await this.whatsappFlowService.fetchAllFlows();
    result.total = metaFlows.length;

    this.logger.log(`Fetched ${metaFlows.length} flows from Meta API`);

    for (const metaFlow of metaFlows) {
      try {
        const syncedFlow = await this.syncSingleFlow(metaFlow);
        result.flows.push(syncedFlow.flow);

        if (syncedFlow.action === 'created') {
          result.created++;
        } else if (syncedFlow.action === 'updated') {
          result.updated++;
        } else {
          result.unchanged++;
        }
      } catch (error) {
        this.logger.error(`Failed to sync flow ${metaFlow.id}: ${error.message}`);
      }
    }

    this.logger.log(
      `Sync completed: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged`,
    );

    return result;
  }

  /**
   * Sync a single flow from Meta API data
   */
  private async syncSingleFlow(
    metaFlow: MetaFlowItem,
  ): Promise<{ flow: WhatsAppFlow; action: 'created' | 'updated' | 'unchanged' }> {
    // Check if flow already exists in database
    const existingFlow = await this.flowRepo.findOne({
      where: { whatsappFlowId: metaFlow.id },
    });

    // Fetch the flow JSON content from Meta API
    const flowJson = await this.whatsappFlowService.getFlowJson(metaFlow.id);
    this.logger.log(`Fetched flow JSON for ${metaFlow.id}: ${flowJson ? 'success' : 'not available'}`);

    if (existingFlow) {
      // Check if update is needed
      const needsUpdate = this.isFlowChanged(existingFlow, metaFlow);

      if (needsUpdate || (flowJson && !existingFlow.flowJson)) {
        // Update existing flow
        existingFlow.name = metaFlow.name;
        existingFlow.status = metaFlow.status as WhatsAppFlowStatus;
        existingFlow.categories = this.mapCategories(metaFlow.categories);
        existingFlow.endpointUri = metaFlow.endpoint_uri;
        existingFlow.previewUrl = metaFlow.preview?.preview_url;
        if (flowJson) {
          existingFlow.flowJson = flowJson;
        }
        existingFlow.metadata = {
          ...existingFlow.metadata,
          validation_errors: metaFlow.validation_errors,
          synced_at: new Date().toISOString(),
        };

        await this.flowRepo.save(existingFlow);
        this.logger.log(`Updated flow: ${existingFlow.id} (WhatsApp ID: ${metaFlow.id})`);

        return { flow: existingFlow, action: 'updated' };
      }

      return { flow: existingFlow, action: 'unchanged' };
    }

    // Create new flow record
    const newFlow = this.flowRepo.create({
      whatsappFlowId: metaFlow.id,
      name: metaFlow.name,
      status: metaFlow.status as WhatsAppFlowStatus,
      categories: this.mapCategories(metaFlow.categories),
      flowJson: flowJson || {}, // Use fetched flow JSON or empty object
      endpointUri: metaFlow.endpoint_uri,
      previewUrl: metaFlow.preview?.preview_url,
      isActive: metaFlow.status === 'PUBLISHED',
      metadata: {
        validation_errors: metaFlow.validation_errors,
        synced_at: new Date().toISOString(),
        synced_from_meta: true,
      },
    });

    await this.flowRepo.save(newFlow);
    this.logger.log(`Created new flow: ${newFlow.id} (WhatsApp ID: ${metaFlow.id})`);

    return { flow: newFlow, action: 'created' };
  }

  /**
   * Check if a flow has changed compared to Meta API data
   */
  private isFlowChanged(existingFlow: WhatsAppFlow, metaFlow: MetaFlowItem): boolean {
    return (
      existingFlow.name !== metaFlow.name ||
      existingFlow.status !== metaFlow.status ||
      existingFlow.endpointUri !== metaFlow.endpoint_uri ||
      JSON.stringify(existingFlow.categories) !== JSON.stringify(this.mapCategories(metaFlow.categories))
    );
  }

  /**
   * Map Meta API categories to our enum values
   */
  private mapCategories(categories: string[]): WhatsAppFlowCategory[] {
    if (!categories || !Array.isArray(categories)) {
      return [];
    }

    return categories
      .map((cat) => {
        const upperCat = cat.toUpperCase();
        if (Object.values(WhatsAppFlowCategory).includes(upperCat as WhatsAppFlowCategory)) {
          return upperCat as WhatsAppFlowCategory;
        }
        return WhatsAppFlowCategory.OTHER;
      })
      .filter((cat, index, self) => self.indexOf(cat) === index); // Remove duplicates
  }
}
