import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import FormData = require('form-data');

export interface RestApiResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}

@Injectable()
export class RestApiExecutorService {
  private readonly logger = new Logger(RestApiExecutorService.name);

  /**
   * Replace {{variable}} and {{variable.nested.path}} and {{array[0].field}} in string
   * Also supports simple math expressions like {{var1}} + {{var2}}
   */
  replaceVariables(template: string, variables: Record<string, any>): string {
    // First replace all variable references with their values
    // Updated regex to support array notation like {{data[0].id}}
    let result = template.replace(/\{\{([\w.\[\]0-9]+)\}\}/g, (match, varPath) => {
      const value = this.extractByPath(variables, varPath);
      return value !== undefined ? String(value) : match;
    });

    // Check if there are any arithmetic expressions to evaluate
    // Pattern: number operator number (e.g., "15 + 5" or "10 - 3")
    result = result.replace(/(\d+)\s*([+\-*/])\s*(\d+)/g, (match, num1, op, num2) => {
      const n1 = parseFloat(num1);
      const n2 = parseFloat(num2);
      switch (op) {
        case '+': return String(n1 + n2);
        case '-': return String(Math.max(0, n1 - n2)); // Prevent negative stock
        case '*': return String(n1 * n2);
        case '/': return String(n2 !== 0 ? n1 / n2 : 0);
        default: return match;
      }
    });

    return result;
  }

  /**
   * Extract value using dot notation path (e.g., "data.items[0].name")
   */
  extractByPath(obj: any, path: string): any {
    if (!path) return obj;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      // Handle array notation like "items[0]"
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        current = current[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        current = current[part];
      }
    }
    return current;
  }

  /**
   * Filter array by field value
   */
  filterArray(data: any[], filterField: string, filterValue: string): any[] {
    return data.filter(item => {
      const fieldValue = this.extractByPath(item, filterField);
      return fieldValue !== undefined && String(fieldValue) === String(filterValue);
    });
  }

  /**
   * Execute REST API call with variable replacement
   */
  async execute(
    config: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: string;
      timeout?: number;
      responsePath?: string;
      contentType?: string;
      filterField?: string;
      filterValue?: string;
    },
    variables: Record<string, any>,
  ): Promise<RestApiResult> {
    const startTime = Date.now();

    // Replace variables in URL, headers, and body
    const url = this.replaceVariables(config.url, variables);
    const headers: Record<string, string> = {};
    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        headers[key] = this.replaceVariables(value, variables);
      }
    }

    let body: any;
    let requestHeaders = { ...headers };

    if (config.body) {
      const bodyStr = this.replaceVariables(config.body, variables);

      // Handle multipart/form-data
      if (config.contentType === 'multipart/form-data') {
        const formData = new FormData();
        try {
          // Try to parse as JSON to extract form fields
          const bodyObj = JSON.parse(bodyStr);
          for (const [key, value] of Object.entries(bodyObj)) {
            formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
        } catch {
          // If not JSON, treat as single field named 'data'
          formData.append('data', bodyStr);
        }
        body = formData;
        requestHeaders = { ...headers, ...formData.getHeaders() };
      } else if (config.contentType === 'application/x-www-form-urlencoded') {
        // Handle URL-encoded form data
        try {
          const bodyObj = JSON.parse(bodyStr);
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(bodyObj)) {
            params.append(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
          body = params.toString();
          requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        } catch {
          // If not JSON, use as-is (already in key=value format)
          body = bodyStr;
          requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      } else {
        try {
          body = JSON.parse(bodyStr);
        } catch {
          body = bodyStr;
        }
      }
    }

    try {
      this.logger.log(`Executing ${config.method} ${url}`);
      // Mask sensitive headers before logging
      const maskedHeaders = { ...requestHeaders };
      if (maskedHeaders['Authorization']) {
        maskedHeaders['Authorization'] = maskedHeaders['Authorization'].substring(0, 15) + '***';
      }
      if (maskedHeaders['X-API-Key']) {
        maskedHeaders['X-API-Key'] = '***';
      }
      this.logger.log(`Request headers: ${JSON.stringify(maskedHeaders)}`);
      if (config.body) {
        const bodyStr = this.replaceVariables(config.body, variables);
        this.logger.log(`Request body (raw): ${bodyStr.substring(0, 500)}`);
      }

      const response = await axios({
        method: config.method.toLowerCase() as any,
        url,
        headers: requestHeaders,
        data: body,
        timeout: config.timeout || 30000,
      });

      const responseTime = Date.now() - startTime;

      // Extract data using path if specified
      let resultData = response.data;
      if (config.responsePath) {
        resultData = this.extractByPath(response.data, config.responsePath);
      }

      // Apply filter if specified (for array responses)
      if (config.filterField && config.filterValue && Array.isArray(resultData)) {
        const filterValue = this.replaceVariables(config.filterValue, variables);
        resultData = this.filterArray(resultData, config.filterField, filterValue);
        this.logger.log(`Filtered array by ${config.filterField}=${filterValue}, found ${resultData.length} matches`);
      }

      this.logger.log(`API call successful: ${response.status} (${responseTime}ms)`);

      return {
        success: true,
        data: resultData,
        statusCode: response.status,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`API call failed: ${error.message}`);
      this.logger.error(`Full error response: ${JSON.stringify(error.response?.data)}`);

      // Extract error message from various API error formats
      let errorMessage = error.message;
      if (error.response?.data) {
        const data = error.response.data;
        errorMessage = data.message || data.error || data.response_status?.messages?.[0]?.message || JSON.stringify(data);
      }

      return {
        success: false,
        error: errorMessage,
        statusCode: error.response?.status,
        responseTime,
      };
    }
  }
}
