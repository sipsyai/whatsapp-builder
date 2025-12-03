import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  IntegrationHandler,
  IntegrationDataItem,
} from './integration-handler.interface';
import {
  IntegrationConfigDto,
  FlowExecutionContextDto,
} from '../../../flows/dto/integration-config.dto';
import { GoogleCalendarIntegrationHandler } from './google-calendar.handler';
import { RestApiIntegrationHandler } from './rest-api.handler';

/**
 * Custom error class for integration-related errors.
 * Provides structured error information for better debugging.
 */
export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly integrationType: string,
    public readonly componentName: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

/**
 * Registry for managing integration handlers.
 *
 * This service acts as a central registry for all integration handlers
 * and routes data fetch requests to the appropriate handler based on
 * the integration configuration type.
 *
 * @example
 * ```typescript
 * // Usage in a service
 * @Injectable()
 * export class FlowDataService {
 *   constructor(private readonly handlerRegistry: IntegrationHandlerRegistry) {}
 *
 *   async getDropdownData(config: IntegrationConfigDto, formData: Record<string, any>) {
 *     return this.handlerRegistry.fetchComponentData(config, formData, context);
 *   }
 * }
 * ```
 */
@Injectable()
export class IntegrationHandlerRegistry implements OnModuleInit {
  private readonly logger = new Logger(IntegrationHandlerRegistry.name);
  private readonly handlers: IntegrationHandler[] = [];

  constructor(
    private readonly googleCalendarHandler: GoogleCalendarIntegrationHandler,
    private readonly restApiHandler: RestApiIntegrationHandler,
  ) {
    // Register handlers in priority order
    // More specific handlers should be registered before generic ones
    this.handlers = [
      this.googleCalendarHandler,
      this.restApiHandler,
    ];
  }

  /**
   * Lifecycle hook called when module is initialized.
   * Logs the registered handlers for debugging purposes.
   */
  onModuleInit(): void {
    this.logger.log(
      `IntegrationHandlerRegistry initialized with ${this.handlers.length} handler(s)`,
    );
    this.handlers.forEach((handler, index) => {
      this.logger.debug(
        `Handler ${index + 1}: ${handler.constructor.name}`,
      );
    });
  }

  /**
   * Fetches data for a WhatsApp Flow component using the appropriate integration handler.
   *
   * This method:
   * 1. Finds a handler that can process the given configuration
   * 2. Delegates the data fetch to that handler
   * 3. Returns the transformed data items
   *
   * @param config - Integration configuration specifying the data source and transformation
   * @param formData - Current form data from WhatsApp Flow for variable resolution
   * @param context - Optional execution context with flow token, user ID, etc.
   * @returns Promise resolving to array of data items for WhatsApp Flow dropdown
   * @throws {IntegrationError} When no handler found or data fetch fails
   *
   * @example
   * ```typescript
   * const config: IntegrationConfigDto = {
   *   componentName: 'time_slot',
   *   integrationType: IntegrationType.GOOGLE_CALENDAR,
   *   sourceType: 'owner',
   *   action: 'check_availability',
   *   params: { workingHoursStart: '09:00', workingHoursEnd: '18:00' },
   *   transformTo: { idField: 'id', titleField: 'title' }
   * };
   *
   * const slots = await registry.fetchComponentData(config, formData, context);
   * ```
   */
  async fetchComponentData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<IntegrationDataItem[]> {
    const startTime = Date.now();

    // Validate config
    if (!config) {
      throw new IntegrationError(
        'Integration configuration is required',
        'unknown',
        'unknown',
      );
    }

    if (!config.integrationType) {
      throw new IntegrationError(
        'Integration type is required',
        'unknown',
        config.componentName || 'unknown',
      );
    }

    this.logger.debug(
      `Fetching data for component '${config.componentName}' ` +
        `(type: ${config.integrationType}, action: ${config.action})`,
    );

    // Find appropriate handler
    const handler = this.findHandler(config);

    if (!handler) {
      const errorMessage = `No handler found for integration type: ${config.integrationType}`;
      this.logger.warn(errorMessage);
      throw new IntegrationError(
        errorMessage,
        config.integrationType,
        config.componentName,
      );
    }

    this.logger.debug(
      `Using ${handler.constructor.name} for ${config.integrationType}`,
    );

    try {
      const data = await handler.fetchData(config, formData, context);
      const elapsed = Date.now() - startTime;

      this.logger.debug(
        `Fetched ${data.length} item(s) for '${config.componentName}' in ${elapsed}ms`,
      );

      return data;
    } catch (error) {
      const elapsed = Date.now() - startTime;

      this.logger.error(
        `Failed to fetch data for '${config.componentName}' in ${elapsed}ms: ${error.message}`,
        error.stack,
      );

      // Re-throw as IntegrationError with context
      if (error instanceof IntegrationError) {
        throw error;
      }

      throw new IntegrationError(
        `Failed to fetch data: ${error.message}`,
        config.integrationType,
        config.componentName,
        error,
      );
    }
  }

  /**
   * Finds a handler that can process the given integration configuration.
   *
   * @param config - Integration configuration to find handler for
   * @returns Handler that can process the config, or undefined if none found
   */
  private findHandler(config: IntegrationConfigDto): IntegrationHandler | undefined {
    return this.handlers.find((handler) => handler.canHandle(config));
  }

  /**
   * Checks if a handler is registered for the given integration type.
   *
   * @param integrationType - Integration type to check
   * @returns true if a handler exists for the type
   *
   * @example
   * ```typescript
   * if (registry.hasHandler('google_calendar')) {
   *   // Google Calendar integration is available
   * }
   * ```
   */
  hasHandler(integrationType: string): boolean {
    // Create a minimal config object to test handler compatibility
    const testConfig = { integrationType } as IntegrationConfigDto;
    return this.handlers.some((handler) => handler.canHandle(testConfig));
  }

  /**
   * Returns the number of registered handlers.
   *
   * @returns Count of registered integration handlers
   */
  getHandlerCount(): number {
    return this.handlers.length;
  }

  /**
   * Returns the list of supported integration types.
   * Useful for validation and documentation purposes.
   *
   * @returns Array of supported integration type strings
   */
  getSupportedIntegrationTypes(): string[] {
    // Test each known integration type
    const knownTypes = [
      'rest_api',
      'google_calendar',
      'outlook_calendar',
      'stripe_payments',
      'custom_webhook',
    ];

    return knownTypes.filter((type) => this.hasHandler(type));
  }
}
