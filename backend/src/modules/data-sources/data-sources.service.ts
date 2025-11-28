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
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';
import { TestEndpointDto } from './dto/test-endpoint.dto';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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

@Injectable()
export class DataSourcesService {
  private readonly logger = new Logger(DataSourcesService.name);

  constructor(
    @InjectRepository(DataSource)
    private readonly dataSourceRepository: Repository<DataSource>,
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
}
