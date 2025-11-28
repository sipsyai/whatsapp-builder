import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, In } from 'typeorm';
import { ChatBot, ChatBotStatus } from '../../entities/chatbot.entity';
import { WhatsAppFlow } from '../../entities/whatsapp-flow.entity';
import { QueryChatBotsDto, ChatBotSortField, SortOrder } from './dto/query-chatbots.dto';
import { CreateChatBotDto } from './dto/create-chatbot.dto';
import { UpdateChatBotDto } from './dto/update-chatbot.dto';
import {
  ExportChatbotQueryDto,
  ExportedChatbotData,
  ExportedWhatsAppFlow,
} from './dto/export-chatbot.dto';
import {
  ImportChatbotBodyDto,
  ImportChatbotResponseDto,
} from './dto/import-chatbot.dto';

export interface PaginatedChatBots {
  data: ChatBot[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class ChatBotsService {
  constructor(
    @InjectRepository(ChatBot)
    private readonly chatbotRepository: Repository<ChatBot>,
    @InjectRepository(WhatsAppFlow)
    private readonly whatsappFlowRepository: Repository<WhatsAppFlow>,
  ) {}

  async create(createChatBotDto: CreateChatBotDto): Promise<ChatBot> {
    try {
      const chatbot = this.chatbotRepository.create(createChatBotDto);
      return await this.chatbotRepository.save(chatbot);
    } catch (error) {
      throw new BadRequestException('Failed to create chatbot: ' + error.message);
    }
  }

  async findAll(queryDto?: QueryChatBotsDto): Promise<PaginatedChatBots> {
    const {
      search,
      limit = 50,
      offset = 0,
      sortBy = ChatBotSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      isActive,
      status,
    } = queryDto || {};

    const options: FindManyOptions<ChatBot> = {
      where: {},
      order: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    };

    if (search) {
      options.where = [
        { name: Like(`%${search}%`) },
        { description: Like(`%${search}%`) },
      ];
    }

    if (isActive !== undefined) {
      if (Array.isArray(options.where)) {
        options.where = options.where.map((condition) => ({
          ...condition,
          isActive,
        }));
      } else {
        options.where = { ...options.where, isActive };
      }
    }

    if (status !== undefined) {
      if (Array.isArray(options.where)) {
        options.where = options.where.map((condition) => ({
          ...condition,
          status,
        }));
      } else {
        options.where = { ...options.where, status };
      }
    }

    const [data, total] = await this.chatbotRepository.findAndCount(options);

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<ChatBot> {
    try {
      const chatbot = await this.chatbotRepository.findOne({ where: { id } });
      if (!chatbot) {
        throw new NotFoundException(`ChatBot with ID ${id} not found`);
      }
      return chatbot;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid chatbot ID format');
    }
  }

  async update(id: string, updateChatBotDto: UpdateChatBotDto): Promise<ChatBot> {
    const chatbot = await this.findOne(id);

    try {
      Object.assign(chatbot, updateChatBotDto);
      return await this.chatbotRepository.save(chatbot);
    } catch (error) {
      throw new BadRequestException('Failed to update chatbot: ' + error.message);
    }
  }

  async partialUpdate(id: string, updateData: Partial<ChatBot>): Promise<ChatBot> {
    const chatbot = await this.findOne(id);

    try {
      const allowedFields = [
        'name',
        'description',
        'nodes',
        'edges',
        'isActive',
        'metadata',
      ];
      const filteredData = Object.keys(updateData)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      Object.assign(chatbot, filteredData);
      return await this.chatbotRepository.save(chatbot);
    } catch (error) {
      throw new BadRequestException(
        'Failed to partially update chatbot: ' + error.message,
      );
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.chatbotRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ChatBot with ID ${id} not found`);
    }
    return {
      success: true,
      message: `ChatBot with ID ${id} has been deleted`,
    };
  }

  async softDelete(id: string): Promise<ChatBot> {
    const chatbot = await this.findOne(id);
    chatbot.isActive = false;
    chatbot.status = ChatBotStatus.ARCHIVED;
    return await this.chatbotRepository.save(chatbot);
  }

  async restore(id: string): Promise<ChatBot> {
    const chatbot = await this.findOne(id);
    chatbot.isActive = true;
    chatbot.status = ChatBotStatus.ACTIVE;
    return await this.chatbotRepository.save(chatbot);
  }

  async getChatBotStats(id: string): Promise<{
    nodeCount: number;
    edgeCount: number;
    nodeTypes: Record<string, number>;
  }> {
    const chatbot = await this.findOne(id);

    const nodeTypes = chatbot.nodes.reduce((acc, node) => {
      const type = node.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      nodeCount: chatbot.nodes.length,
      edgeCount: chatbot.edges.length,
      nodeTypes,
    };
  }

  async toggleActive(id: string): Promise<ChatBot> {
    const chatbot = await this.findOne(id);

    // Deactivate all other chatbots
    await this.chatbotRepository.update(
      { isActive: true },
      { isActive: false }
    );

    // Activate this chatbot
    chatbot.isActive = true;
    chatbot.status = ChatBotStatus.ACTIVE;
    return await this.chatbotRepository.save(chatbot);
  }

  // ==================== EXPORT/IMPORT METHODS ====================

  /**
   * Export chatbot as JSON with optional WhatsApp Flows embedded
   */
  async exportChatbot(
    id: string,
    options: ExportChatbotQueryDto,
  ): Promise<ExportedChatbotData> {
    const chatbot = await this.findOne(id);

    const exported: ExportedChatbotData = {
      version: options.version || '1.0',
      exportedAt: new Date().toISOString(),
      chatbot: {
        name: chatbot.name,
        description: chatbot.description,
        nodes: chatbot.nodes,
        edges: chatbot.edges,
        isActive: chatbot.isActive,
        status: chatbot.status,
      },
    };

    // Include metadata if requested
    if (options.includeMetadata !== false) {
      exported.chatbot.metadata = chatbot.metadata;
    }

    // Include WhatsApp Flows if requested
    if (options.includeFlows !== false) {
      const flowIds = this.extractWhatsAppFlowIds(chatbot.nodes);

      if (flowIds.length > 0) {
        const flows = await this.whatsappFlowRepository.find({
          where: { whatsappFlowId: In(flowIds) },
        });

        exported.whatsappFlows = flows.map((flow): ExportedWhatsAppFlow => ({
          whatsappFlowId: flow.whatsappFlowId,
          name: flow.name,
          description: flow.description,
          status: flow.status,
          categories: flow.categories,
          flowJson: flow.flowJson,
          endpointUri: flow.endpointUri,
          isActive: flow.isActive,
          metadata: flow.metadata,
        }));
      }
    }

    return exported;
  }

  /**
   * Import chatbot from JSON file
   */
  async importChatbot(
    fileBuffer: Buffer,
    options: ImportChatbotBodyDto,
  ): Promise<ImportChatbotResponseDto> {
    const warnings: string[] = [];

    try {
      // 1. Parse JSON
      const jsonContent = fileBuffer.toString('utf-8');
      const importedData: ExportedChatbotData = JSON.parse(jsonContent);

      // 2. Validate structure
      this.validateImportStructure(importedData);

      // 3. Version check
      if (importedData.version !== '1.0') {
        warnings.push(`Version mismatch: ${importedData.version} (current: 1.0)`);
      }

      // 4. Determine chatbot name (with duplicate handling)
      let chatbotName = options.name || importedData.chatbot.name;
      chatbotName = await this.generateUniqueName(chatbotName);

      // 5. Validate nodes and edges
      this.validateChatbotStructure(importedData.chatbot);

      // 6. Check WhatsApp Flow references
      const referencedFlowIds = this.extractWhatsAppFlowIds(importedData.chatbot.nodes);
      let importedFlowsCount = 0;

      if (referencedFlowIds.length > 0) {
        // Check if flows exist or are embedded
        const existingFlows = await this.whatsappFlowRepository.find({
          where: { whatsappFlowId: In(referencedFlowIds) },
          select: ['whatsappFlowId'],
        });
        const existingFlowIds = new Set(existingFlows.map(f => f.whatsappFlowId));

        // Import embedded flows if available
        if (options.importFlows !== false && importedData.whatsappFlows && importedData.whatsappFlows.length > 0) {
          for (const embeddedFlow of importedData.whatsappFlows) {
            if (!existingFlowIds.has(embeddedFlow.whatsappFlowId)) {
              // Create new flow from embedded data
              const newFlow = this.whatsappFlowRepository.create({
                whatsappFlowId: embeddedFlow.whatsappFlowId,
                name: embeddedFlow.name,
                description: embeddedFlow.description,
                status: embeddedFlow.status,
                categories: embeddedFlow.categories,
                flowJson: embeddedFlow.flowJson,
                endpointUri: embeddedFlow.endpointUri,
                isActive: embeddedFlow.isActive,
                metadata: embeddedFlow.metadata,
              });
              await this.whatsappFlowRepository.save(newFlow);
              existingFlowIds.add(embeddedFlow.whatsappFlowId);
              importedFlowsCount++;
            }
          }
        }

        // Warn about missing flows
        const missingFlowIds = referencedFlowIds.filter(id => !existingFlowIds.has(id));
        if (missingFlowIds.length > 0) {
          warnings.push(`Missing WhatsApp Flows: ${missingFlowIds.join(', ')}`);
        }
      }

      // 7. Create chatbot
      const createDto: CreateChatBotDto = {
        name: chatbotName,
        description: importedData.chatbot.description,
        nodes: importedData.chatbot.nodes,
        edges: importedData.chatbot.edges,
      };

      const chatbot = await this.create(createDto);

      // 8. Update metadata if present
      if (importedData.chatbot.metadata) {
        await this.partialUpdate(chatbot.id, {
          metadata: importedData.chatbot.metadata,
        });
      }

      // 9. Set active if requested
      if (options.setActive) {
        await this.toggleActive(chatbot.id);
      }

      return {
        success: true,
        message: 'Chatbot imported successfully',
        chatbotId: chatbot.id,
        chatbotName: chatbotName,
        importedAt: new Date().toISOString(),
        warnings: warnings.length > 0 ? warnings : undefined,
        importedFlowsCount: importedFlowsCount > 0 ? importedFlowsCount : undefined,
      };

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON file format');
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to import chatbot: ' + error.message);
    }
  }

  /**
   * Extract WhatsApp Flow IDs from nodes
   */
  private extractWhatsAppFlowIds(nodes: any[]): string[] {
    const flowIds: string[] = [];

    for (const node of nodes) {
      if (node.type === 'whatsapp_flow' && node.data?.whatsappFlowId) {
        flowIds.push(node.data.whatsappFlowId);
      }
    }

    return [...new Set(flowIds)]; // Remove duplicates
  }

  /**
   * Validate import data structure
   */
  private validateImportStructure(data: any): void {
    if (!data.chatbot) {
      throw new BadRequestException('Invalid export format: missing chatbot data');
    }
    if (!data.version) {
      throw new BadRequestException('Invalid export format: missing version');
    }
  }

  /**
   * Validate chatbot nodes and edges structure
   */
  private validateChatbotStructure(chatbot: any): void {
    if (!chatbot.nodes || !Array.isArray(chatbot.nodes)) {
      throw new BadRequestException('Invalid chatbot: missing or invalid nodes array');
    }

    if (!chatbot.edges || !Array.isArray(chatbot.edges)) {
      throw new BadRequestException('Invalid chatbot: missing or invalid edges array');
    }

    // Validate node structure
    for (const node of chatbot.nodes) {
      if (!node.id || !node.type) {
        throw new BadRequestException('Invalid node: missing id or type');
      }
    }

    // Validate edge references
    const nodeIds = new Set(chatbot.nodes.map((n: any) => n.id));
    for (const edge of chatbot.edges) {
      if (!edge.source || !edge.target) {
        throw new BadRequestException('Invalid edge: missing source or target');
      }
      if (!nodeIds.has(edge.source)) {
        throw new BadRequestException(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new BadRequestException(`Edge references non-existent target node: ${edge.target}`);
      }
    }
  }

  /**
   * Generate unique chatbot name (adds " (Copy)" suffix if duplicate)
   */
  private async generateUniqueName(baseName: string): Promise<string> {
    let name = baseName;
    let suffix = 0;

    while (true) {
      const existing = await this.chatbotRepository.findOne({
        where: { name },
        select: ['id'],
      });

      if (!existing) {
        return name;
      }

      suffix++;
      name = suffix === 1 ? `${baseName} (Copy)` : `${baseName} (Copy ${suffix})`;
    }
  }
}
