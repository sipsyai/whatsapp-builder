import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DataSourcesService, TestConnectionResult } from './data-sources.service';
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';
import { DataSource } from '../../entities/data-source.entity';

@ApiTags('Data Sources')
@Controller('api/data-sources')
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new data source',
    description: 'Creates a new external data source configuration (Strapi, REST API, GraphQL)',
  })
  @ApiBody({ type: CreateDataSourceDto })
  @ApiResponse({
    status: 201,
    description: 'Data source created successfully',
    type: DataSource,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or authentication configuration',
  })
  async create(@Body() createDto: CreateDataSourceDto): Promise<DataSource> {
    return this.dataSourcesService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all data sources',
    description: 'Retrieves all configured data sources from the database',
  })
  @ApiResponse({
    status: 200,
    description: 'List of data sources returned successfully',
    type: [DataSource],
  })
  async findAll(): Promise<DataSource[]> {
    return this.dataSourcesService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active data sources',
    description: 'Retrieves all active data sources that can be used',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active data sources returned successfully',
    type: [DataSource],
  })
  async findAllActive(): Promise<DataSource[]> {
    return this.dataSourcesService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get data source by ID',
    description: 'Retrieves a specific data source by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Data source returned successfully',
    type: DataSource,
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
  })
  async findOne(@Param('id') id: string): Promise<DataSource> {
    return this.dataSourcesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update data source',
    description: 'Updates an existing data source configuration',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source UUID',
    type: 'string',
  })
  @ApiBody({ type: UpdateDataSourceDto })
  @ApiResponse({
    status: 200,
    description: 'Data source updated successfully',
    type: DataSource,
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or authentication configuration',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDataSourceDto,
  ): Promise<DataSource> {
    return this.dataSourcesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete data source',
    description: 'Deletes a data source configuration',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Data source deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
  })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.dataSourcesService.delete(id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test data source connection',
    description: 'Tests if the data source is reachable and properly configured',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection test completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Connection successful' },
        responseTime: { type: 'number', example: 145 },
        statusCode: { type: 'number', example: 200 },
        error: { type: 'string', example: null },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
  })
  async testConnection(@Param('id') id: string): Promise<TestConnectionResult> {
    return this.dataSourcesService.testConnection(id);
  }
}
