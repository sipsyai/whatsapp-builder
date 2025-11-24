import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppApiService } from './whatsapp-api.service';
import { CreateFlowDto } from '../dto/requests/create-flow.dto';
import {
  FlowResponse,
  FlowHealthStatus,
  FlowDetails,
  MetaFlowsListResponse,
  MetaFlowItem,
  FlowAssetsResponse,
} from '../interfaces/flow.interface';
import axios from 'axios';

@Injectable()
export class WhatsAppFlowService {
  private readonly logger = new Logger(WhatsAppFlowService.name);
  private readonly wabaId: string;

  constructor(
    private readonly apiService: WhatsAppApiService,
    private readonly configService: ConfigService,
  ) {
    this.wabaId = this.configService.get<string>('whatsapp.wabaId') || '';

    if (!this.wabaId) {
      throw new Error(
        'WABA_ID is not configured. Please check your environment variables',
      );
    }
  }

  /**
   * Create a new Flow
   */
  async createFlow(dto: CreateFlowDto): Promise<FlowResponse> {
    this.logger.log(`Creating flow: ${dto.name}`);

    const payload = {
      name: dto.name,
      categories: dto.categories,
      flow_json: JSON.stringify(dto.flowJson),
      endpoint_uri:
        dto.endpointUri || this.configService.get('whatsapp.flowEndpointUrl'),
    };

    return this.apiService.post<FlowResponse>(`/${this.wabaId}/flows`, payload);
  }

  /**
   * Publish a Flow
   */
  async publishFlow(flowId: string): Promise<{ success: boolean }> {
    this.logger.log(`Publishing flow: ${flowId}`);
    return this.apiService.post(`/${flowId}/publish`, {});
  }

  /**
   * Get Flow details
   */
  async getFlow(flowId: string, fields?: string[]): Promise<FlowDetails> {
    const fieldsParam = fields?.join(',') || 'id,name,status,validation_errors';
    return this.apiService.get(`/${flowId}?fields=${fieldsParam}`);
  }

  /**
   * Get Flow health status
   */
  async getHealthStatus(flowId: string): Promise<FlowHealthStatus> {
    const phoneNumberId = this.apiService.getPhoneNumberId();
    const data = await this.apiService.get<any>(
      `/${flowId}?fields=health_status.phone_number(${phoneNumberId})`,
    );
    return data.health_status;
  }

  /**
   * Update Flow with App ID
   */
  async connectApp(flowId: string, appId: string): Promise<void> {
    this.logger.log(`Connecting app ${appId} to flow ${flowId}`);
    await this.apiService.post(`/${flowId}`, { application_id: appId });
  }

  /**
   * Get Flow preview URL
   */
  async getPreviewUrl(flowId: string, invalidate = false): Promise<string> {
    const data = await this.apiService.get<any>(
      `/${flowId}?fields=preview.invalidate(${invalidate})`,
    );
    return data.preview?.preview_url;
  }

  /**
   * Deprecate a Flow (required before deletion if published)
   */
  async deprecateFlow(flowId: string): Promise<{ success: boolean }> {
    this.logger.log(`Deprecating flow: ${flowId}`);
    return this.apiService.post(`/${flowId}`, { status: 'DEPRECATED' });
  }

  /**
   * Delete a Flow
   */
  async deleteFlow(flowId: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting flow: ${flowId}`);
    return this.apiService.delete(`/${flowId}`);
  }

  /**
   * Update Flow JSON
   */
  async updateFlow(
    flowId: string,
    dto: Partial<CreateFlowDto>,
  ): Promise<FlowResponse> {
    this.logger.log(`Updating flow: ${flowId}`);

    const payload: any = {};
    if (dto.name) payload.name = dto.name;
    if (dto.categories) payload.categories = dto.categories;
    if (dto.flowJson) payload.flow_json = JSON.stringify(dto.flowJson);
    if (dto.endpointUri) payload.endpoint_uri = dto.endpointUri;

    return this.apiService.post<FlowResponse>(`/${flowId}`, payload);
  }

  /**
   * Fetch all Flows from Meta/Facebook API
   * Returns all flows associated with the WABA
   */
  async fetchAllFlows(): Promise<MetaFlowItem[]> {
    this.logger.log('Fetching all flows from Meta API');

    const fields = 'id,name,status,categories,validation_errors,updated_at,endpoint_uri,preview';
    const allFlows: MetaFlowItem[] = [];
    let hasMore = true;
    let afterCursor: string | undefined;

    while (hasMore) {
      const endpoint = afterCursor
        ? `/${this.wabaId}/flows?fields=${fields}&after=${afterCursor}`
        : `/${this.wabaId}/flows?fields=${fields}`;

      const response = await this.apiService.get<MetaFlowsListResponse>(endpoint);

      if (response.data && response.data.length > 0) {
        allFlows.push(...response.data);
        this.logger.log(`Fetched ${response.data.length} flows (total: ${allFlows.length})`);
      }

      // Check for pagination
      if (response.paging?.cursors?.after) {
        afterCursor = response.paging.cursors.after;
      } else {
        hasMore = false;
      }
    }

    this.logger.log(`Total flows fetched from Meta: ${allFlows.length}`);
    return allFlows;
  }

  /**
   * Get single flow with full details from Meta API
   */
  async getFlowFromMeta(flowId: string): Promise<MetaFlowItem> {
    this.logger.log(`Fetching flow ${flowId} from Meta API`);
    const fields = 'id,name,status,categories,validation_errors,updated_at,endpoint_uri,preview';
    return this.apiService.get<MetaFlowItem>(`/${flowId}?fields=${fields}`);
  }

  /**
   * Get Flow assets (contains download URL for flow.json)
   */
  async getFlowAssets(flowId: string): Promise<FlowAssetsResponse> {
    this.logger.log(`Fetching assets for flow ${flowId}`);
    return this.apiService.get<FlowAssetsResponse>(`/${flowId}/assets`);
  }

  /**
   * Get Flow JSON content by downloading from assets
   * Returns the actual flow.json content
   */
  async getFlowJson(flowId: string): Promise<any> {
    this.logger.log(`Fetching flow JSON for flow ${flowId}`);

    try {
      // Step 1: Get assets list
      const assetsResponse = await this.getFlowAssets(flowId);

      // Step 2: Find the FLOW_JSON asset
      const flowJsonAsset = assetsResponse.data?.find(
        (asset) => asset.asset_type === 'FLOW_JSON',
      );

      if (!flowJsonAsset || !flowJsonAsset.download_url) {
        this.logger.warn(`No FLOW_JSON asset found for flow ${flowId}`);
        return null;
      }

      // Step 3: Download the actual flow JSON content
      this.logger.log(`Downloading flow JSON from: ${flowJsonAsset.download_url}`);
      const response = await axios.get(flowJsonAsset.download_url);

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch flow JSON for ${flowId}: ${error.message}`);
      return null;
    }
  }
}
