import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppFlow, WhatsAppFlowStatus, WhatsAppFlowCategory } from '../../entities/whatsapp-flow.entity';
import { WhatsAppFlowService } from '../whatsapp/services/whatsapp-flow.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { CreateFlowFromPlaygroundDto } from './dto/create-flow-from-playground.dto';
import { ValidateFlowDto } from './dto/validate-flow.dto';
import { ExportFlowQueryDto, ExportedFlowData } from './dto/export-flow.dto';
import { ImportFlowBodyDto, ImportFlowResponseDto } from './dto/import-flow.dto';
import { MetaFlowItem } from '../whatsapp/interfaces/flow.interface';

export interface SyncResult {
  created: number;
  updated: number;
  unchanged: number;
  total: number;
  flows: WhatsAppFlow[];
}

export interface FlowValidationResult {
  isValid: boolean;
  errors: Array<{
    error: string;
    error_type: string;
    message: string;
    line_start?: number;
    line_end?: number;
    column_start?: number;
    column_end?: number;
  }>;
  warnings?: string[];
  flowId?: string;
  whatsappFlowId?: string;
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
    const flowJson = this.validateAndNormalizePlaygroundJson(dto.playgroundJson, dto.dataSourceConfig);

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
      dataSourceId: dto.dataSourceId,
      metadata: {
        source: 'playground',
        created_from_playground: true,
        playground_json_received: new Date().toISOString(),
        dataSourceConfig: dto.dataSourceConfig || [],
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
   * @param playgroundJson - The playground JSON to normalize
   * @param dataSourceConfig - Optional data source configuration for dynamic data
   */
  private validateAndNormalizePlaygroundJson(playgroundJson: any, dataSourceConfig?: any[]): any {
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

    // Handle routing_model and data_api_version consistency
    const hasRoutingModel = playgroundJson.routing_model && Object.keys(playgroundJson.routing_model).length > 0;
    const hasDataApiVersion = !!playgroundJson.data_api_version;

    // Check if dataSourceConfig is provided and has items
    const hasDataSourceConfig = dataSourceConfig && Array.isArray(dataSourceConfig) && dataSourceConfig.length > 0;

    if (hasRoutingModel) {
      // If routing_model exists, data_api_version is REQUIRED by WhatsApp
      if (!hasDataApiVersion) {
        this.logger.warn('routing_model present but data_api_version missing. Adding data_api_version: 3.0');
        normalizedJson.data_api_version = '3.0';
      } else {
        normalizedJson.data_api_version = playgroundJson.data_api_version;
      }
      normalizedJson.routing_model = playgroundJson.routing_model;
    } else if (hasDataApiVersion) {
      // If data_api_version exists but no routing_model, still include it
      normalizedJson.data_api_version = playgroundJson.data_api_version;
      // routing_model will be auto-generated by WhatsApp
    } else if (hasDataSourceConfig) {
      // If dataSourceConfig exists, we need data_api_version and routing_model for dynamic data
      this.logger.log('dataSourceConfig provided, adding data_api_version: 3.0 and empty routing_model');
      normalizedJson.data_api_version = '3.0';
      normalizedJson.routing_model = {}; // WhatsApp will auto-generate this
    }
    // If neither exists, it's a simple flow without endpoint (routing_model auto-generated)

    // Include any other fields that might be in playground export
    const knownFields = ['version', 'screens', 'data_api_version', 'routing_model'];
    for (const key in playgroundJson) {
      if (!knownFields.includes(key) && playgroundJson[key] !== undefined) {
        normalizedJson[key] = playgroundJson[key];
      }
    }

    this.logger.log(`Normalized playground JSON with ${normalizedJson.screens.length} screens`);
    if (normalizedJson.routing_model) {
      this.logger.log(`Flow uses endpoint with data_api_version: ${normalizedJson.data_api_version}`);
    } else {
      this.logger.log(`Flow without endpoint (routing_model will be auto-generated)`);
    }

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

    // Normalize flow JSON if provided (fix routing_model/data_api_version consistency)
    let normalizedFlowJson = dto.flowJson;
    if (dto.flowJson) {
      try {
        normalizedFlowJson = this.validateAndNormalizePlaygroundJson(dto.flowJson);
        this.logger.log('Flow JSON normalized for update');
      } catch (error) {
        this.logger.warn(`Could not normalize flow JSON: ${error.message}`);
        // Continue with original flowJson if normalization fails
      }
    }

    // Update in WhatsApp API if published
    if (flow.whatsappFlowId && (dto.name || dto.categories || normalizedFlowJson || dto.endpointUri)) {
      try {
        await this.whatsappFlowService.updateFlow(flow.whatsappFlowId, {
          name: dto.name,
          categories: dto.categories,
          flowJson: normalizedFlowJson,
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
    if (normalizedFlowJson) flow.flowJson = normalizedFlowJson;
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

  /**
   * Get validation errors from Meta API for a flow
   */
  async getValidationErrors(id: string): Promise<any> {
    const flow = await this.findOne(id);

    if (!flow.whatsappFlowId) {
      throw new Error('Flow has no WhatsApp ID');
    }

    this.logger.log(`Fetching validation errors for flow: ${id} (WhatsApp ID: ${flow.whatsappFlowId})`);

    // Get flow details from Meta API with validation_errors field
    const metaFlow = await this.whatsappFlowService.getFlow(flow.whatsappFlowId, [
      'id',
      'name',
      'status',
      'validation_errors',
    ]);

    return {
      flowId: flow.id,
      whatsappFlowId: flow.whatsappFlowId,
      name: flow.name,
      status: metaFlow.status,
      validation_errors: metaFlow.validation_errors || [],
      localFlowJson: flow.flowJson,
    };
  }

  /**
   * Fix Flow JSON structure by normalizing routing_model and data_api_version
   * This method automatically corrects common issues:
   * - Adds data_api_version if routing_model exists
   * - Removes routing_model if not using endpoint
   */
  async fixFlowJson(id: string): Promise<WhatsAppFlow> {
    const flow = await this.findOne(id);

    this.logger.log(`Fixing Flow JSON for flow: ${id}`);

    // Normalize the flow JSON
    const fixedFlowJson = this.validateAndNormalizePlaygroundJson(flow.flowJson);

    // Check if changes were made
    const hasChanges = JSON.stringify(flow.flowJson) !== JSON.stringify(fixedFlowJson);

    if (!hasChanges) {
      this.logger.log('No changes needed for Flow JSON');
      return flow;
    }

    this.logger.log('Flow JSON has been fixed, updating...');

    // Update in WhatsApp API
    if (flow.whatsappFlowId) {
      await this.whatsappFlowService.updateFlow(flow.whatsappFlowId, {
        flowJson: fixedFlowJson,
      });

      // After update, Flow goes back to DRAFT status
      flow.status = WhatsAppFlowStatus.DRAFT;
    }

    // Update local database
    flow.flowJson = fixedFlowJson;
    await this.flowRepo.save(flow);

    this.logger.log(`Flow JSON fixed successfully: ${id}`);

    return flow;
  }

  /**
   * Validate Flow JSON against Meta API
   * Creates a temporary draft flow or updates existing one to get validation errors
   */
  async validateFlowJson(dto: ValidateFlowDto): Promise<FlowValidationResult> {
    this.logger.log('Validating Flow JSON against Meta API');

    // Normalize the flow JSON first
    let normalizedFlowJson: any;
    try {
      normalizedFlowJson = this.validateAndNormalizePlaygroundJson(dto.flowJson);
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          error: 'INVALID_JSON_STRUCTURE',
          error_type: 'LOCAL_VALIDATION',
          message: error.message,
        }],
      };
    }

    try {
      let whatsappFlowId: string;
      let localFlowId: string | undefined;
      let isUsingExistingFlow = false;

      if (dto.flowId) {
        // Use existing flow
        const existingFlow = await this.findOne(dto.flowId);

        if (!existingFlow.whatsappFlowId) {
          throw new BadRequestException('Flow has no WhatsApp ID');
        }

        whatsappFlowId = existingFlow.whatsappFlowId;
        localFlowId = existingFlow.id;
        isUsingExistingFlow = true;

        // Fetch current JSON from Meta to compare
        let metaFlowJson: any = null;
        try {
          metaFlowJson = await this.whatsappFlowService.getFlowJson(whatsappFlowId);
        } catch (e) {
          this.logger.warn(`Could not fetch Meta flow JSON: ${e.message}`);
        }

        // Deep compare function to ignore key order
        const deepEqual = (a: any, b: any): boolean => {
          if (a === b) return true;
          if (typeof a !== typeof b) return false;
          if (typeof a !== 'object' || a === null || b === null) return false;
          if (Array.isArray(a) !== Array.isArray(b)) return false;

          const keysA = Object.keys(a).sort();
          const keysB = Object.keys(b).sort();
          if (keysA.length !== keysB.length) return false;
          if (keysA.join(',') !== keysB.join(',')) return false;

          for (const key of keysA) {
            if (!deepEqual(a[key], b[key])) return false;
          }
          return true;
        };

        const isJsonSame = metaFlowJson && deepEqual(metaFlowJson, normalizedFlowJson);

        // Log comparison result
        this.logger.log(`Flow JSON comparison: ${isJsonSame ? 'same as Meta' : 'differs from Meta'}`);

        if (!isJsonSame) {
          // JSON has changed compared to Meta, update it
          this.logger.log('Flow JSON differs from Meta, updating...');
          await this.whatsappFlowService.updateFlow(whatsappFlowId, {
            flowJson: normalizedFlowJson,
          });
        } else {
          // JSON is the same as Meta, just fetch validation errors
          this.logger.log('Flow JSON same as Meta, skipping update');
        }
      } else {
        // Create a temporary validation flow
        const tempName = dto.name || `_validation_temp_${Date.now()}`;

        const whatsappResponse = await this.whatsappFlowService.createFlow({
          name: tempName,
          categories: ['OTHER'],
          flowJson: normalizedFlowJson,
        });

        whatsappFlowId = whatsappResponse.id;
      }

      // Fetch validation errors from Meta
      const metaFlow = await this.whatsappFlowService.getFlow(whatsappFlowId, [
        'id',
        'name',
        'status',
        'validation_errors',
      ]);

      const validationErrors = metaFlow.validation_errors || [];
      const isValid = validationErrors.length === 0;

      // If we created a temp flow and there are no errors, delete it
      // If there are errors, keep it for debugging (user can delete manually)
      if (!dto.flowId && isValid) {
        try {
          await this.whatsappFlowService.deleteFlow(whatsappFlowId);
          this.logger.log(`Deleted temporary validation flow: ${whatsappFlowId}`);
        } catch (deleteError) {
          this.logger.warn(`Could not delete temp validation flow: ${deleteError.message}`);
        }
      }

      return {
        isValid,
        errors: validationErrors,
        flowId: localFlowId,
        whatsappFlowId: dto.flowId ? undefined : whatsappFlowId, // Only return if new flow created
      };
    } catch (error) {
      this.logger.error(`Flow validation failed: ${error.message}`);

      // Try to extract validation errors from the error response
      if (error.response?.data?.error?.error_user_msg) {
        return {
          isValid: false,
          errors: [{
            error: 'META_API_ERROR',
            error_type: 'API_ERROR',
            message: error.response.data.error.error_user_msg,
          }],
        };
      }

      throw error;
    }
  }

  /**
   * Export a Flow to JSON format for backup/sharing
   */
  async exportFlow(id: string, options: ExportFlowQueryDto): Promise<ExportedFlowData> {
    const flow = await this.flowRepo.findOne({
      where: { id },
      relations: ['dataSource'],
    });

    if (!flow) {
      throw new NotFoundException(`Flow ${id} not found`);
    }

    this.logger.log(`Exporting flow: ${id}`);

    const exportData: ExportedFlowData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      flow: {
        name: flow.name,
        description: flow.description,
        status: flow.status,
        categories: flow.categories,
        flowJson: flow.flowJson,
        endpointUri: flow.endpointUri,
        isActive: flow.isActive,
        ...(options.includeMetadata && flow.metadata ? { metadata: flow.metadata } : {}),
      },
    };

    // DataSource bilgisini ekle (varsa)
    if (flow.dataSource) {
      exportData.dataSource = {
        id: flow.dataSource.id,
        name: flow.dataSource.name,
        type: flow.dataSource.type,
      };
    }

    this.logger.log(`Flow exported successfully: ${id}`);

    return exportData;
  }

  /**
   * Import a Flow from JSON file
   */
  async importFlow(fileBuffer: Buffer, options: ImportFlowBodyDto): Promise<ImportFlowResponseDto> {
    const warnings: string[] = [];

    // Parse JSON
    let importData: any;
    try {
      importData = JSON.parse(fileBuffer.toString('utf-8'));
    } catch (error) {
      throw new BadRequestException('Invalid JSON file');
    }

    // Validate structure
    if (!importData.flow) {
      throw new BadRequestException('Invalid export format: missing "flow" property');
    }

    const flowData = importData.flow;

    // Validate required fields
    if (!flowData.name || !flowData.flowJson) {
      throw new BadRequestException('Invalid export format: missing required flow properties (name, flowJson)');
    }

    this.logger.log(`Importing flow: ${flowData.name}`);

    // Generate unique name
    const baseName = options.name || flowData.name;
    const uniqueName = await this.generateUniqueName(baseName);

    if (uniqueName !== baseName) {
      warnings.push(`Flow renamed to "${uniqueName}" to avoid duplicate names`);
    }

    // Normalize flow JSON if needed
    let normalizedFlowJson = flowData.flowJson;
    try {
      normalizedFlowJson = this.validateAndNormalizePlaygroundJson(flowData.flowJson);
    } catch (error) {
      this.logger.warn(`Could not normalize flow JSON: ${error.message}`);
      // Continue with original flowJson if normalization fails
    }

    // Create flow in local DB (without WhatsApp API by default)
    const newFlow = this.flowRepo.create({
      name: uniqueName,
      description: flowData.description || '',
      categories: flowData.categories || [WhatsAppFlowCategory.OTHER],
      flowJson: normalizedFlowJson,
      status: WhatsAppFlowStatus.DRAFT, // Always start as draft
      isActive: false, // Don't auto-activate
      metadata: {
        ...flowData.metadata,
        imported_at: new Date().toISOString(),
        imported_from_version: importData.version,
      },
    });

    await this.flowRepo.save(newFlow);

    this.logger.log(`Flow imported to local DB: ${newFlow.id}`);

    // Optionally create in Meta API
    let whatsappFlowId: string | undefined;
    if (options.createInMeta) {
      try {
        const whatsappResponse = await this.whatsappFlowService.createFlow({
          name: uniqueName,
          categories: newFlow.categories,
          flowJson: normalizedFlowJson,
          endpointUri: flowData.endpointUri,
        });

        whatsappFlowId = whatsappResponse.id;
        newFlow.whatsappFlowId = whatsappFlowId;
        await this.flowRepo.save(newFlow);

        this.logger.log(`Flow created in Meta API: ${whatsappFlowId}`);
      } catch (error) {
        warnings.push(`Failed to create in Meta API: ${error.message}`);
        this.logger.error(`Failed to create flow in Meta API: ${error.message}`);
      }
    }

    return {
      success: true,
      message: 'Flow imported successfully',
      flowId: newFlow.id,
      flowName: newFlow.name,
      importedAt: new Date().toISOString(),
      warnings: warnings.length > 0 ? warnings : undefined,
      whatsappFlowId,
    };
  }

  /**
   * Generate a unique flow name by appending (Copy), (Copy 2), etc.
   */
  private async generateUniqueName(baseName: string): Promise<string> {
    let name = baseName;
    let counter = 1;

    while (true) {
      const existing = await this.flowRepo.findOne({
        where: { name },
      });

      if (!existing) {
        return name;
      }

      counter++;
      name = `${baseName} (Copy${counter > 2 ? ' ' + counter : ''})`;
    }
  }
}
