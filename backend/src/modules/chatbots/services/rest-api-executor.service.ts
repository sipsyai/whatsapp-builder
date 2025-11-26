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
   * Replace {{variable}} and {{variable.nested.path}} in string
   * Also supports simple math expressions like {{var1}} + {{var2}}
   */
  replaceVariables(template: string, variables: Record<string, any>): string {
    // First replace all variable references with their values
    let result = template.replace(/\{\{([\w.]+)\}\}/g, (match, varPath) => {
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
