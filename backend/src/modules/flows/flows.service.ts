import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Flow, FlowStatus } from '../../entities/flow.entity';
import { QueryFlowsDto, FlowSortField, SortOrder } from './dto/query-flows.dto';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';

export interface PaginatedFlows {
  data: Flow[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(Flow)
    private readonly flowRepository: Repository<Flow>,
  ) {}

  async create(createFlowDto: CreateFlowDto): Promise<Flow> {
    try {
      const flow = this.flowRepository.create(createFlowDto);
      return await this.flowRepository.save(flow);
    } catch (error) {
      throw new BadRequestException('Failed to create flow: ' + error.message);
    }
  }

  async findAll(queryDto?: QueryFlowsDto): Promise<PaginatedFlows> {
    const {
      search,
      limit = 50,
      offset = 0,
      sortBy = FlowSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      isActive,
      status,
    } = queryDto || {};

    const options: FindManyOptions<Flow> = {
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

    const [data, total] = await this.flowRepository.findAndCount(options);

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<Flow> {
    try {
      const flow = await this.flowRepository.findOne({ where: { id } });
      if (!flow) {
        throw new NotFoundException(`Flow with ID ${id} not found`);
      }
      return flow;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid flow ID format');
    }
  }

  async update(id: string, updateFlowDto: UpdateFlowDto): Promise<Flow> {
    const flow = await this.findOne(id);

    try {
      Object.assign(flow, updateFlowDto);
      return await this.flowRepository.save(flow);
    } catch (error) {
      throw new BadRequestException('Failed to update flow: ' + error.message);
    }
  }

  async partialUpdate(id: string, updateData: Partial<Flow>): Promise<Flow> {
    const flow = await this.findOne(id);

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

      Object.assign(flow, filteredData);
      return await this.flowRepository.save(flow);
    } catch (error) {
      throw new BadRequestException(
        'Failed to partially update flow: ' + error.message,
      );
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.flowRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Flow with ID ${id} not found`);
    }
    return {
      success: true,
      message: `Flow with ID ${id} has been deleted`,
    };
  }

  async softDelete(id: string): Promise<Flow> {
    const flow = await this.findOne(id);
    flow.isActive = false;
    flow.status = FlowStatus.ARCHIVED;
    return await this.flowRepository.save(flow);
  }

  async restore(id: string): Promise<Flow> {
    const flow = await this.findOne(id);
    flow.isActive = true;
    flow.status = FlowStatus.ACTIVE;
    return await this.flowRepository.save(flow);
  }

  async getFlowStats(id: string): Promise<{
    nodeCount: number;
    edgeCount: number;
    nodeTypes: Record<string, number>;
  }> {
    const flow = await this.findOne(id);

    const nodeTypes = flow.nodes.reduce((acc, node) => {
      const type = node.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      nodeCount: flow.nodes.length,
      edgeCount: flow.edges.length,
      nodeTypes,
    };
  }
}
