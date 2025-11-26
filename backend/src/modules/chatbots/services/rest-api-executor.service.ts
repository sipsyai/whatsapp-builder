import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

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
   * Replace {{variable}} in string
   */
  replaceVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
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
    if (config.body) {
      const bodyStr = this.replaceVariables(config.body, variables);
      try {
        body = JSON.parse(bodyStr);
      } catch {
        body = bodyStr;
      }
    }

    try {
      this.logger.log(`Executing ${config.method} ${url}`);

      const response = await axios({
        method: config.method.toLowerCase() as any,
        url,
        headers,
        data: body,
        timeout: config.timeout || 30000,
      });

      const responseTime = Date.now() - startTime;

      // Extract data using path if specified
      let resultData = response.data;
      if (config.responsePath) {
        resultData = this.extractByPath(response.data, config.responsePath);
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

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status,
        responseTime,
      };
    }
  }
}
