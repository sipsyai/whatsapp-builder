import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { FlowsService } from './flows.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { QueryFlowsDto } from './dto/query-flows.dto';

@Controller('flows')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFlowDto: CreateFlowDto) {
    return this.flowsService.create(createFlowDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryFlowsDto) {
    return this.flowsService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.flowsService.findOne(id);
  }

  @Get(':id/stats')
  async getFlowStats(@Param('id') id: string) {
    return this.flowsService.getFlowStats(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateFlowDto: UpdateFlowDto) {
    return this.flowsService.update(id, updateFlowDto);
  }

  @Patch(':id')
  async partialUpdate(
    @Param('id') id: string,
    @Body() updateData: Partial<UpdateFlowDto>,
  ) {
    return this.flowsService.partialUpdate(id, updateData);
  }

  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return this.flowsService.restore(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.flowsService.delete(id);
  }

  @Delete(':id/soft')
  async softDelete(@Param('id') id: string) {
    return this.flowsService.softDelete(id);
  }
}
