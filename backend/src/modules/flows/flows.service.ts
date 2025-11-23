import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flow } from '../../entities/flow.entity';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(Flow)
    private readonly flowRepository: Repository<Flow>,
  ) {}

  async create(flowData: Partial<Flow>): Promise<Flow> {
    const flow = this.flowRepository.create(flowData);
    return await this.flowRepository.save(flow);
  }

  async findAll(): Promise<Flow[]> {
    return await this.flowRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Flow> {
    const flow = await this.flowRepository.findOne({ where: { id } });
    if (!flow) {
      throw new NotFoundException(`Flow with ID ${id} not found`);
    }
    return flow;
  }

  async update(id: string, updateData: Partial<Flow>): Promise<Flow> {
    const flow = await this.findOne(id);
    Object.assign(flow, updateData);
    return await this.flowRepository.save(flow);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const result = await this.flowRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Flow with ID ${id} not found`);
    }
    return { success: true };
  }
}
