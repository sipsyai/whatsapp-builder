import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppApiService } from './whatsapp-api.service';
import { CreateFlowDto } from '../dto/requests/create-flow.dto';
import {
  FlowResponse,
  FlowHealthStatus,
  FlowDetails,
} from '../interfaces/flow.interface';

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
}
