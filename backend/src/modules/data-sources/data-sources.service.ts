import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource, AuthType, DataSourceType } from '../../entities/data-source.entity';
import { DataSourceConnection, HttpMethod } from '../../entities/data-source-connection.entity';
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';
import { TestEndpointDto } from './dto/test-endpoint.dto';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { JSONPath } from 'jsonpath-plus';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  responseTime?: number;
  statusCode?: number;
  error?: string;
}

export interface TestEndpointResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  data?: any;
  error?: string;
}

export interface ExecuteConnectionResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  data?: any;
  transformedData?: Array<{ id: string; title: string; description?: string }>;
  error?: string;
}

@Injectable()
export class DataSourcesService {
  private readonly logger = new Logger(DataSourcesService.name);

  constructor(
    @InjectRepository(DataSource)
    private readonly dataSourceRepository: Repository<DataSource>,
    @InjectRepository(DataSourceConnection)
    private readonly connectionRepository: Repository<DataSourceConnection>,
  ) {}

  /**
   * Create a new data source
   */
  async create(createDto: CreateDataSourceDto): Promise<DataSource> {
    // Validate auth token requirement
    this.validateAuthConfig(createDto.authType, createDto.authToken, createDto.authHeaderName);

    const dataSource = this.dataSourceRepository.create(createDto);
    return await this.dataSourceRepository.save(dataSource);
  }

  /**
   * Find all data sources
   */
  async findAll(): Promise<DataSource[]> {
    return await this.dataSourceRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find all active data sources
   */
  async findAllActive(): Promise<DataSource[]> {
    return await this.dataSourceRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find a single data source by ID
   */
  async findOne(id: string): Promise<DataSource> {
    const dataSource = await this.dataSourceRepository.findOne({ where: { id } });
    if (!dataSource) {
      throw new NotFoundException(`Data source with ID ${id} not found`);
    }
    return dataSource;
  }

  /**
   * Update a data source
   */
  async update(id: string, updateDto: UpdateDataSourceDto): Promise<DataSource> {
    const dataSource = await this.findOne(id);

    // Validate auth config if auth type or token is being updated
    const authType = updateDto.authType ?? dataSource.authType;
    const authToken = updateDto.authToken ?? dataSource.authToken;
    const authHeaderName = updateDto.authHeaderName ?? dataSource.authHeaderName;

    this.validateAuthConfig(authType, authToken, authHeaderName);

    Object.assign(dataSource, updateDto);
    return await this.dataSourceRepository.save(dataSource);
  }

  /**
   * Delete a data source
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const result = await this.dataSourceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Data source with ID ${id} not found`);
    }
    return { success: true };
  }

  /**
   * Test connection to a data source
   */
  async testConnection(id: string): Promise<TestConnectionResult> {
    const dataSource = await this.findOne(id);

    const startTime = Date.now();
    const client = this.createAxiosClient(dataSource);

    try {
      // Test endpoint varies by type
      let testEndpoint = '/';

      if (dataSource.type === DataSourceType.STRAPI) {
        // Strapi health check endpoint
        testEndpoint = '/api';
      } else if (dataSource.type === DataSourceType.GRAPHQL) {
        // GraphQL introspection query
        testEndpoint = '';
      }

      const response = await client.get(testEndpoint, {
        timeout: dataSource.timeout || 10000,
        validateStatus: (status) => status < 500, // Accept any status < 500 as success
      });

      const responseTime = Date.now() - startTime;

      return {
        success: response.status >= 200 && response.status < 400,
        message: response.status >= 200 && response.status < 400
          ? 'Connection successful'
          : `Connection returned status ${response.status}`,
        responseTime,
        statusCode: response.status,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`Connection test failed for data source ${id}:`, error.message);

      return {
        success: false,
        message: 'Connection failed',
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Test a custom endpoint on a data source
   * Note: We don't use fetchData here because we need access to the full response including status code
   */
  async testEndpoint(id: string, dto: TestEndpointDto): Promise<TestEndpointResult> {
    const startTime = Date.now();
    const dataSource = await this.findOne(id);

    if (!dataSource.isActive) {
      return {
        success: false,
        statusCode: 400,
        responseTime: Date.now() - startTime,
        error: `Data source ${dataSource.name} is not active`,
      };
    }

    const client = this.createAxiosClient(dataSource);

    try {
      const config: AxiosRequestConfig = {
        method: dto.method || 'GET',
        url: dto.endpoint,
        params: dto.params,
        data: dto.body,
        timeout: dataSource.timeout || 30000,
      };

      this.logger.log(`Testing endpoint on ${dataSource.name}: ${config.method} ${dto.endpoint}`);

      const response: AxiosResponse = await client.request(config);

      return {
        success: true,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Endpoint test failed for data source ${id}:`, error.message);

      // Extract status code from error if available
      let statusCode = 500;
      if (axios.isAxiosError(error) && error.response) {
        statusCode = error.response.status;
      }

      return {
        success: false,
        statusCode,
        responseTime: Date.now() - startTime,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Fetch data from a data source
   */
  async fetchData(
    id: string,
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<any> {
    const dataSource = await this.findOne(id);

    if (!dataSource.isActive) {
      throw new BadRequestException(`Data source ${dataSource.name} is not active`);
    }

    const client = this.createAxiosClient(dataSource);

    try {
      const config: AxiosRequestConfig = {
        method: options.method || 'GET',
        url: endpoint,
        headers: options.headers,
        params: options.params,
        data: options.data,
        timeout: options.timeout || dataSource.timeout || 30000,
      };

      this.logger.log(`Fetching data from ${dataSource.name}: ${config.method} ${endpoint}`);

      const response: AxiosResponse = await client.request(config);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch data from ${dataSource.name}:`, error.message);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new BadRequestException(
            `Data source returned ${error.response.status}: ${error.response.statusText}`,
          );
        } else if (error.request) {
          throw new InternalServerErrorException(
            `No response received from data source: ${error.message}`,
          );
        }
      }

      throw new InternalServerErrorException(
        `Failed to fetch data: ${error.message}`,
      );
    }
  }

  /**
   * Create an Axios client configured for the data source
   */
  private createAxiosClient(dataSource: DataSource): AxiosInstance {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(dataSource.headers || {}),
    };

    // Add authentication headers
    if (dataSource.authType === AuthType.BEARER && dataSource.authToken) {
      headers['Authorization'] = `Bearer ${dataSource.authToken}`;
    } else if (dataSource.authType === AuthType.API_KEY && dataSource.authToken) {
      const headerName = dataSource.authHeaderName || 'X-API-Key';
      headers[headerName] = dataSource.authToken;
    } else if (dataSource.authType === AuthType.BASIC && dataSource.authToken) {
      // authToken should be base64 encoded "username:password"
      headers['Authorization'] = `Basic ${dataSource.authToken}`;
    }

    return axios.create({
      baseURL: dataSource.baseUrl,
      headers,
      timeout: dataSource.timeout || 30000,
    });
  }

  /**
   * Validate authentication configuration
   */
  private validateAuthConfig(
    authType: AuthType,
    authToken?: string,
    authHeaderName?: string,
  ): void {
    if (authType === AuthType.NONE) {
      return;
    }

    if (!authToken) {
      throw new BadRequestException(
        `Authentication token is required for auth type: ${authType}`,
      );
    }

    if (authType === AuthType.API_KEY && !authHeaderName) {
      throw new BadRequestException(
        'Header name is required for API_KEY authentication type',
      );
    }
  }

  // =====================================================
  // Connection CRUD Operations
  // =====================================================

  /**
   * Create a new connection for a data source
   */
  async createConnection(
    dataSourceId: string,
    dto: CreateConnectionDto,
  ): Promise<DataSourceConnection> {
    // Verify the data source exists
    await this.findOne(dataSourceId);

    // Validate depends on connection if provided
    if (dto.dependsOnConnectionId) {
      const dependsOn = await this.connectionRepository.findOne({
        where: { id: dto.dependsOnConnectionId },
      });
      if (!dependsOn) {
        throw new NotFoundException(
          `Dependent connection with ID ${dto.dependsOnConnectionId} not found`,
        );
      }
    }

    const connection = this.connectionRepository.create({
      ...dto,
      dataSourceId,
    });

    return await this.connectionRepository.save(connection);
  }

  /**
   * Find all connections for a data source
   */
  async findConnections(dataSourceId: string): Promise<DataSourceConnection[]> {
    // Verify the data source exists
    await this.findOne(dataSourceId);

    return await this.connectionRepository.find({
      where: { dataSourceId },
      relations: ['dependsOnConnection'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find all active connections for a data source
   */
  async findActiveConnections(dataSourceId: string): Promise<DataSourceConnection[]> {
    // Verify the data source exists
    await this.findOne(dataSourceId);

    return await this.connectionRepository.find({
      where: { dataSourceId, isActive: true },
      relations: ['dependsOnConnection'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find a single connection by ID
   */
  async findConnection(connectionId: string): Promise<DataSourceConnection> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['dataSource', 'dependsOnConnection'],
    });

    if (!connection) {
      throw new NotFoundException(`Connection with ID ${connectionId} not found`);
    }

    return connection;
  }

  /**
   * Update a connection
   */
  async updateConnection(
    connectionId: string,
    dto: UpdateConnectionDto,
  ): Promise<DataSourceConnection> {
    const connection = await this.findConnection(connectionId);

    // Validate depends on connection if being updated
    if (dto.dependsOnConnectionId !== undefined) {
      if (dto.dependsOnConnectionId) {
        // Prevent circular dependency
        if (dto.dependsOnConnectionId === connectionId) {
          throw new BadRequestException('A connection cannot depend on itself');
        }

        const dependsOn = await this.connectionRepository.findOne({
          where: { id: dto.dependsOnConnectionId },
        });
        if (!dependsOn) {
          throw new NotFoundException(
            `Dependent connection with ID ${dto.dependsOnConnectionId} not found`,
          );
        }
      }
    }

    Object.assign(connection, dto);
    return await this.connectionRepository.save(connection);
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<{ success: boolean }> {
    const result = await this.connectionRepository.delete(connectionId);
    if (result.affected === 0) {
      throw new NotFoundException(`Connection with ID ${connectionId} not found`);
    }
    return { success: true };
  }

  /**
   * Execute a connection and return the data with proper response format
   */
  async executeConnection(
    connectionId: string,
    params?: Record<string, any>,
    body?: any,
  ): Promise<ExecuteConnectionResult> {
    const startTime = Date.now();
    const connection = await this.findConnection(connectionId);

    if (!connection.isActive) {
      throw new BadRequestException(`Connection ${connection.name} is not active`);
    }

    if (!connection.dataSource.isActive) {
      throw new BadRequestException(
        `Data source ${connection.dataSource.name} is not active`,
      );
    }

    const client = this.createAxiosClient(connection.dataSource);

    // Merge default params with provided params
    const mergedParams = {
      ...(connection.defaultParams || {}),
      ...(params || {}),
    };

    // Merge default body with provided body
    const mergedBody = body !== undefined ? body : connection.defaultBody;

    try {
      const config: AxiosRequestConfig = {
        method: connection.method,
        url: connection.endpoint,
        params: Object.keys(mergedParams).length > 0 ? mergedParams : undefined,
        data: mergedBody,
        timeout: connection.dataSource.timeout || 30000,
      };

      this.logger.log(
        `Executing connection ${connection.name}: ${config.method} ${connection.endpoint}`,
      );

      const response: AxiosResponse = await client.request(config);
      const responseTime = Date.now() - startTime;
      let data = response.data;

      // Extract data using dataKey if specified
      if (connection.dataKey) {
        data = this.extractDataByKey(data, connection.dataKey);
      }

      // Build result
      const result: {
        success: boolean;
        statusCode: number;
        responseTime: number;
        data: any;
        transformedData?: Array<{ id: string; title: string; description?: string }>;
      } = {
        success: true,
        statusCode: response.status,
        responseTime,
        data,
      };

      // Transform data if transformConfig exists and data is array
      if (connection.transformConfig && Array.isArray(data)) {
        result.transformedData = data.map((item: any) => ({
          id: String(item[connection.transformConfig.idField] || ''),
          title: String(item[connection.transformConfig.titleField] || ''),
          ...(connection.transformConfig.descriptionField && item[connection.transformConfig.descriptionField]
            ? { description: String(item[connection.transformConfig.descriptionField]) }
            : {}),
        }));
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(
        `Failed to execute connection ${connection.name}:`,
        error.message,
      );

      let statusCode = 500;
      let errorMessage = error.message || 'Unknown error';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          statusCode = error.response.status;
          errorMessage = `${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          errorMessage = `No response received: ${error.message}`;
        }
      }

      return {
        success: false,
        statusCode,
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Execute a chained connection with context data from parent connections
   */
  async executeChainedConnection(
    connectionId: string,
    contextData?: Record<string, any>,
  ): Promise<ExecuteConnectionResult> {
    const connection = await this.findConnection(connectionId);

    if (!connection.isActive) {
      throw new BadRequestException(`Connection ${connection.name} is not active`);
    }

    // Resolve param mappings using JSONPath from context data
    const resolvedParams: Record<string, any> = { ...(connection.defaultParams || {}) };

    if (connection.paramMapping && contextData) {
      for (const [paramKey, jsonPath] of Object.entries(connection.paramMapping)) {
        try {
          const values = JSONPath({ path: jsonPath, json: contextData });
          if (values && values.length > 0) {
            resolvedParams[paramKey] = values[0];
          }
        } catch (error) {
          this.logger.warn(
            `Failed to resolve JSONPath ${jsonPath} for param ${paramKey}: ${error.message}`,
          );
        }
      }
    }

    return await this.executeConnection(connectionId, resolvedParams, connection.defaultBody);
  }

  /**
   * Extract data from response using a dot-notation key path
   */
  private extractDataByKey(data: any, dataKey: string): any {
    if (!dataKey) {
      return data;
    }

    const keys = dataKey.split('.');
    let result = data;

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        this.logger.warn(`Data key path '${dataKey}' not found in response`);
        return data;
      }
    }

    return result;
  }

  /**
   * Get all active connections grouped by data source
   */
  async findAllActiveConnectionsGrouped(): Promise<
    {
      dataSource: {
        id: string;
        name: string;
        type: DataSourceType;
        baseUrl: string;
      };
      connections: DataSourceConnection[];
    }[]
  > {
    // Get all active data sources with their active connections
    const dataSources = await this.dataSourceRepository.find({
      where: { isActive: true },
      relations: ['connections'],
      order: { name: 'ASC' },
    });

    return dataSources
      .map((ds) => ({
        dataSource: {
          id: ds.id,
          name: ds.name,
          type: ds.type,
          baseUrl: ds.baseUrl,
        },
        connections: (ds.connections || []).filter((conn) => conn.isActive),
      }))
      .filter((group) => group.connections.length > 0);
  }
}
