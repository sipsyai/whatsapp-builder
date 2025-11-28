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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  DataSourcesService,
  TestConnectionResult,
  TestEndpointResult,
} from './data-sources.service';
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';
import { TestEndpointDto } from './dto/test-endpoint.dto';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { DataSource } from '../../entities/data-source.entity';
import { DataSourceConnection } from '../../entities/data-source-connection.entity';

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

  @Post(':id/test-endpoint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test a custom endpoint on a data source',
    description: 'Tests a specific endpoint with custom method, params, and body to verify API functionality',
  })
  @ApiParam({
    name: 'id',
    description: 'Data source UUID',
    type: 'string',
  })
  @ApiBody({ type: TestEndpointDto })
  @ApiResponse({
    status: 200,
    description: 'Endpoint test completed with response data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        responseTime: { type: 'number', example: 234 },
        data: {
          type: 'object',
          description: 'Response data from the endpoint',
          example: { products: [{ id: 1, name: 'Product 1' }] },
        },
        error: { type: 'string', example: null },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
  })
  async testEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TestEndpointDto,
  ): Promise<TestEndpointResult> {
    return this.dataSourcesService.testEndpoint(id, dto);
  }

  // ============================================================================
  // CONNECTION ROUTES
  // ============================================================================

  @Get('connections/grouped/active')
  @ApiOperation({
    summary: 'Get all active connections grouped by data source',
    description: 'Retrieves all active connections grouped by their parent data source',
  })
  @ApiResponse({
    status: 200,
    description: 'Active connections grouped by data source returned successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dataSource: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              type: { type: 'string' },
              baseUrl: { type: 'string' },
            },
          },
          connections: {
            type: 'array',
            items: { $ref: '#/components/schemas/DataSourceConnection' },
          },
        },
      },
    },
  })
  async findAllActiveConnectionsGrouped(): Promise<
    {
      dataSource: { id: string; name: string; type: string; baseUrl: string };
      connections: DataSourceConnection[];
    }[]
  > {
    return this.dataSourcesService.findAllActiveConnectionsGrouped();
  }

  @Post(':dataSourceId/connections')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new connection for a data source',
    description: 'Creates a new connection configuration for a specific data source',
  })
  @ApiParam({
    name: 'dataSourceId',
    description: 'Data source UUID',
    type: 'string',
  })
  @ApiBody({ type: CreateConnectionDto })
  @ApiResponse({
    status: 201,
    description: 'Connection created successfully',
    type: DataSourceConnection,
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createConnection(
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
    @Body() dto: CreateConnectionDto,
  ): Promise<DataSourceConnection> {
    return this.dataSourcesService.createConnection(dataSourceId, dto);
  }

  @Get(':dataSourceId/connections')
  @ApiOperation({
    summary: 'Get all connections for a data source',
    description: 'Retrieves all connections configured for a specific data source',
  })
  @ApiParam({
    name: 'dataSourceId',
    description: 'Data source UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of connections returned successfully',
    type: [DataSourceConnection],
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
  })
  async findConnections(
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
  ): Promise<DataSourceConnection[]> {
    return this.dataSourcesService.findConnections(dataSourceId);
  }

  @Get(':dataSourceId/connections/active')
  @ApiOperation({
    summary: 'Get active connections for a data source',
    description: 'Retrieves all active connections for a specific data source',
  })
  @ApiParam({
    name: 'dataSourceId',
    description: 'Data source UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active connections returned successfully',
    type: [DataSourceConnection],
  })
  @ApiResponse({
    status: 404,
    description: 'Data source not found',
  })
  async findActiveConnections(
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
  ): Promise<DataSourceConnection[]> {
    return this.dataSourcesService.findActiveConnections(dataSourceId);
  }

  @Get('connections/:connectionId')
  @ApiOperation({
    summary: 'Get a single connection by ID',
    description: 'Retrieves a specific connection by its UUID',
  })
  @ApiParam({
    name: 'connectionId',
    description: 'Connection UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection returned successfully',
    type: DataSourceConnection,
  })
  @ApiResponse({
    status: 404,
    description: 'Connection not found',
  })
  async findConnection(
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
  ): Promise<DataSourceConnection> {
    return this.dataSourcesService.findConnection(connectionId);
  }

  @Put('connections/:connectionId')
  @ApiOperation({
    summary: 'Update a connection',
    description: 'Updates an existing connection configuration',
  })
  @ApiParam({
    name: 'connectionId',
    description: 'Connection UUID',
    type: 'string',
  })
  @ApiBody({ type: UpdateConnectionDto })
  @ApiResponse({
    status: 200,
    description: 'Connection updated successfully',
    type: DataSourceConnection,
  })
  @ApiResponse({
    status: 404,
    description: 'Connection not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateConnection(
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @Body() dto: UpdateConnectionDto,
  ): Promise<DataSourceConnection> {
    return this.dataSourcesService.updateConnection(connectionId, dto);
  }

  @Delete('connections/:connectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a connection',
    description: 'Deletes a connection configuration',
  })
  @ApiParam({
    name: 'connectionId',
    description: 'Connection UUID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Connection not found',
  })
  async deleteConnection(
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
  ): Promise<{ success: boolean }> {
    return this.dataSourcesService.deleteConnection(connectionId);
  }

  @Post('connections/:connectionId/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute a connection and get data',
    description: 'Executes a connection with optional parameters and body, returning the fetched data',
  })
  @ApiParam({
    name: 'connectionId',
    description: 'Connection UUID',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        params: {
          type: 'object',
          description: 'Query parameters to override defaults',
          example: { page: 1, limit: 10 },
        },
        body: {
          description: 'Request body to override defaults',
          example: { filter: 'active' },
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Connection executed successfully, data returned',
    schema: {
      type: 'object',
      description: 'Response data from the executed connection',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Connection not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Connection or data source is not active',
  })
  async executeConnection(
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @Body() dto: { params?: Record<string, any>; body?: any },
  ): Promise<any> {
    return this.dataSourcesService.executeConnection(
      connectionId,
      dto?.params,
      dto?.body,
    );
  }

  @Post('connections/:connectionId/execute-chain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute a chained connection',
    description: 'Executes a connection with context data for resolving parameter mappings',
  })
  @ApiParam({
    name: 'connectionId',
    description: 'Connection UUID',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contextData: {
          type: 'object',
          description: 'Context data for resolving JSONPath parameter mappings',
          example: { selectedBrand: 'Nike', selectedCategory: 'shoes' },
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Chained connection executed successfully, data returned',
    schema: {
      type: 'object',
      description: 'Response data from the executed connection',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Connection not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Connection is not active',
  })
  async executeChainedConnection(
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @Body() dto: { contextData?: Record<string, any> },
  ): Promise<any> {
    return this.dataSourcesService.executeChainedConnection(
      connectionId,
      dto?.contextData,
    );
  }
}
