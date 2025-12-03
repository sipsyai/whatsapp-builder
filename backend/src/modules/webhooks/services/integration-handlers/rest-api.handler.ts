import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import {
  IntegrationHandler,
  IntegrationDataItem,
} from './integration-handler.interface';
import {
  IntegrationConfigDto,
  IntegrationType,
  TransformConfigDto,
  FlowExecutionContextDto,
} from '../../../flows/dto/integration-config.dto';
import { DataSourcesService } from '../../../data-sources/data-sources.service';
import { DataSource, AuthType } from '../../../../entities/data-source.entity';

/**
 * REST API specific parameters for integration configuration
 */
export interface RestApiParams {
  /** Use existing DataSource configuration */
  dataSourceId?: string;
  /** Direct endpoint URL (can be used with or without dataSourceId) */
  endpoint?: string;
  /** HTTP method (default: GET) */
  method?: 'GET' | 'POST';
  /** Query parameters to append to URL */
  queryParams?: Record<string, any>;
  /** Request body template for POST requests (supports ${variable} placeholders) */
  bodyTemplate?: Record<string, any>;
  /** Key path to extract array from response (default: 'data', supports dot notation) */
  dataKey?: string;
}

/**
 * REST API Integration Handler
 *
 * Fetches data from REST APIs using either:
 * - Pre-configured DataSource entities (with auth, baseUrl, headers)
 * - Direct endpoint URLs
 *
 * Supports variable interpolation in endpoints, query params, and request bodies
 * using ${field_name} placeholder syntax.
 *
 * @example
 * ```typescript
 * // Using DataSource
 * const config: IntegrationConfigDto = {
 *   componentName: 'city_dropdown',
 *   integrationType: IntegrationType.REST_API,
 *   sourceType: 'static',
 *   action: 'fetch',
 *   params: {
 *     dataSourceId: 'uuid-of-datasource',
 *     endpoint: '/api/cities?country=${selected_country}',
 *     dataKey: 'data.cities'
 *   },
 *   transformTo: {
 *     idField: 'id',
 *     titleField: 'name',
 *     descriptionField: 'region'
 *   }
 * };
 * ```
 */
@Injectable()
export class RestApiIntegrationHandler implements IntegrationHandler {
  private readonly logger = new Logger(RestApiIntegrationHandler.name);

  constructor(
    private readonly dataSourcesService: DataSourcesService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Check if this handler can process the given integration config
   */
  canHandle(config: IntegrationConfigDto): boolean {
    return config.integrationType === IntegrationType.REST_API;
  }

  /**
   * Fetch data from REST API and transform to WhatsApp Flow dropdown format
   */
  async fetchData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<IntegrationDataItem[]> {
    const params = (config.params || {}) as RestApiParams;
    const startTime = Date.now();

    this.logger.log(
      `Fetching REST API data for component: ${config.componentName}`,
    );
    this.logger.debug(`Config params: ${JSON.stringify(params)}`);
    this.logger.debug(`Form data: ${JSON.stringify(formData)}`);

    try {
      // Get DataSource if specified
      let dataSource: DataSource | undefined;
      if (params.dataSourceId) {
        try {
          dataSource = await this.dataSourcesService.findOne(params.dataSourceId);
          this.logger.debug(`Using DataSource: ${dataSource.name} (${dataSource.baseUrl})`);
        } catch (error) {
          this.logger.error(`Failed to load DataSource ${params.dataSourceId}: ${error.message}`);
          throw new Error(`DataSource not found: ${params.dataSourceId}`);
        }
      }

      // Build URL with variable replacement
      const endpoint = params.endpoint
        ? this.replaceVariables(params.endpoint, formData)
        : '';

      const baseUrl = dataSource?.baseUrl || '';
      const queryParams = params.queryParams
        ? this.replaceVariablesInObject(params.queryParams, formData)
        : undefined;

      const url = this.buildUrl(baseUrl, endpoint, queryParams);
      this.logger.debug(`Request URL: ${url}`);

      // Build headers from DataSource auth config
      const headers = this.buildHeaders(dataSource);

      // Build request config
      const method = params.method || 'GET';
      const requestConfig: AxiosRequestConfig = {
        method,
        url,
        headers,
        timeout: Math.min(dataSource?.timeout || 10000, 10000), // Max 10 seconds for WhatsApp
      };

      // Add request body for POST requests
      if (method === 'POST' && params.bodyTemplate) {
        requestConfig.data = this.replaceVariablesInObject(
          params.bodyTemplate,
          formData,
        );
        this.logger.debug(`Request body: ${JSON.stringify(requestConfig.data)}`);
      }

      // Execute HTTP request
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.request(requestConfig),
      );

      const responseTime = Date.now() - startTime;
      this.logger.log(
        `REST API response received in ${responseTime}ms, status: ${response.status}`,
      );

      // Transform response to IntegrationDataItem[]
      const dataKey = params.dataKey || 'data';
      const transformedData = this.transformResponse(
        response.data,
        dataKey,
        config.transformTo,
      );

      this.logger.log(
        `Transformed ${transformedData.length} items for component: ${config.componentName}`,
      );

      return transformedData;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.handleError(error, config.componentName, responseTime);
      throw error; // Registry'nin yakalaması için fırlat
    }
  }

  /**
   * Replace ${variable} placeholders in a string with values from formData
   *
   * @param text - String containing ${variable} placeholders
   * @param formData - Object containing values to substitute
   * @returns String with placeholders replaced by actual values
   *
   * @example
   * replaceVariables('/api/cities/${country}', { country: 'TR' })
   * // Returns: '/api/cities/TR'
   */
  private replaceVariables(
    text: string,
    formData: Record<string, any>,
  ): string {
    if (!text) return text;

    return text.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
      const value = this.getNestedValue(formData, variableName.trim());
      if (value === undefined || value === null) {
        this.logger.warn(
          `Variable '${variableName}' not found in form data, keeping placeholder`,
        );
        return match;
      }
      return String(value);
    });
  }

  /**
   * Replace ${variable} placeholders in all string values of an object
   */
  private replaceVariablesInObject(
    obj: Record<string, any>,
    formData: Record<string, any>,
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.replaceVariables(value, formData);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.replaceVariablesInObject(value, formData);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'string'
            ? this.replaceVariables(item, formData)
            : typeof item === 'object' && item !== null
              ? this.replaceVariablesInObject(item, formData)
              : item,
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   *
   * @example
   * getNestedValue({ user: { name: 'John' } }, 'user.name')
   * // Returns: 'John'
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
  }

  /**
   * Build complete URL from baseUrl, endpoint, and query parameters
   *
   * @param baseUrl - Base URL of the API (from DataSource)
   * @param endpoint - API endpoint path
   * @param queryParams - Query parameters to append
   * @returns Complete URL string
   */
  private buildUrl(
    baseUrl: string,
    endpoint: string,
    queryParams?: Record<string, any>,
  ): string {
    // Combine baseUrl and endpoint
    let url = baseUrl;

    if (endpoint) {
      // Handle trailing/leading slashes
      if (baseUrl && !baseUrl.endsWith('/') && !endpoint.startsWith('/')) {
        url = `${baseUrl}/${endpoint}`;
      } else if (baseUrl && baseUrl.endsWith('/') && endpoint.startsWith('/')) {
        url = `${baseUrl}${endpoint.slice(1)}`;
      } else {
        url = `${baseUrl}${endpoint}`;
      }
    }

    // If no baseUrl, use endpoint as full URL
    if (!baseUrl && endpoint) {
      url = endpoint;
    }

    // Add query parameters
    if (queryParams && Object.keys(queryParams).length > 0) {
      const urlObj = new URL(url);
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, String(value));
        }
      }
      return urlObj.toString();
    }

    return url;
  }

  /**
   * Build HTTP headers from DataSource auth configuration
   *
   * @param dataSource - Optional DataSource entity with auth config
   * @returns Headers object for HTTP request
   */
  private buildHeaders(dataSource?: DataSource): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (!dataSource) {
      return headers;
    }

    // Merge custom headers from DataSource
    if (dataSource.headers) {
      Object.assign(headers, dataSource.headers);
    }

    // Add authentication headers based on auth type
    if (dataSource.authType === AuthType.BEARER && dataSource.authToken) {
      headers['Authorization'] = `Bearer ${dataSource.authToken}`;
    } else if (dataSource.authType === AuthType.API_KEY && dataSource.authToken) {
      const headerName = dataSource.authHeaderName || 'X-API-Key';
      headers[headerName] = dataSource.authToken;
    } else if (dataSource.authType === AuthType.BASIC && dataSource.authToken) {
      // authToken should be base64 encoded "username:password"
      headers['Authorization'] = `Basic ${dataSource.authToken}`;
    }

    return headers;
  }

  /**
   * Transform API response data to IntegrationDataItem[] format
   *
   * @param response - Raw API response data
   * @param dataKey - Dot-notation key path to extract array from response
   * @param transformTo - Transformation configuration specifying field mappings
   * @returns Array of IntegrationDataItem for WhatsApp Flow dropdown
   */
  private transformResponse(
    response: any,
    dataKey: string,
    transformTo: TransformConfigDto,
  ): IntegrationDataItem[] {
    // Extract data array using dataKey path
    let data = response;

    if (dataKey) {
      const keys = dataKey.split('.');
      for (const key of keys) {
        if (data && typeof data === 'object' && key in data) {
          data = data[key];
        } else {
          this.logger.warn(
            `Data key path '${dataKey}' not found in response, using root`,
          );
          data = response;
          break;
        }
      }
    }

    // Handle case where response is already the array (e.g., dataKey is empty string or 'data' doesn't exist)
    if (!Array.isArray(data)) {
      // Check if response itself is an array
      if (Array.isArray(response)) {
        data = response;
      } else {
        this.logger.warn(
          `Response data is not an array, returning empty result`,
        );
        return [];
      }
    }

    // Transform each item to IntegrationDataItem format
    return data.map((item: any, index: number) => {
      const id = this.extractFieldValue(item, transformTo.idField, `item_${index}`);
      const title = this.extractFieldValue(item, transformTo.titleField, `Item ${index + 1}`);

      const result: IntegrationDataItem = {
        id: String(id),
        title: String(title),
        enabled: true,
      };

      // Add description if configured
      if (transformTo.descriptionField) {
        const description = this.extractFieldValue(item, transformTo.descriptionField);
        if (description !== undefined && description !== null) {
          result.description = String(description);
        }
      }

      return result;
    });
  }

  /**
   * Extract field value from an object using dot notation or direct key
   *
   * @param item - Source object
   * @param fieldPath - Field path (supports dot notation)
   * @param defaultValue - Default value if field not found
   * @returns Extracted value or default
   */
  private extractFieldValue(
    item: any,
    fieldPath: string,
    defaultValue?: any,
  ): any {
    if (!fieldPath) return defaultValue;

    const value = this.getNestedValue(item, fieldPath);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Handle and log errors appropriately
   */
  private handleError(
    error: any,
    componentName: string,
    responseTime: number,
  ): void {
    if (error instanceof AxiosError) {
      if (error.response) {
        this.logger.error(
          `REST API request failed for ${componentName} in ${responseTime}ms: ` +
            `${error.response.status} - ${error.response.statusText}`,
        );
        this.logger.debug(
          `Error response data: ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        this.logger.error(
          `REST API request failed for ${componentName} in ${responseTime}ms: ` +
            `No response received - ${error.message}`,
        );
      } else {
        this.logger.error(
          `REST API request setup failed for ${componentName}: ${error.message}`,
        );
      }
    } else {
      this.logger.error(
        `Unexpected error fetching data for ${componentName}: ${error.message}`,
      );
    }
  }
}
