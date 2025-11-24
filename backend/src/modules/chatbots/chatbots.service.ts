import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { ChatBot, ChatBotStatus } from '../../entities/chatbot.entity';
import { QueryChatBotsDto, ChatBotSortField, SortOrder } from './dto/query-chatbots.dto';
import { CreateChatBotDto } from './dto/create-chatbot.dto';
import { UpdateChatBotDto } from './dto/update-chatbot.dto';

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
}
