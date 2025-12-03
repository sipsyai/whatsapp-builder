import {
  IntegrationConfigDto,
  FlowExecutionContextDto,
} from '../../../flows/dto/integration-config.dto';

/**
 * Represents a single data item formatted for WhatsApp Flow dropdown components.
 * This interface follows the WhatsApp Flow data source format specification.
 *
 * @example
 * ```typescript
 * const item: IntegrationDataItem = {
 *   id: 'slot_09_00',
 *   title: '09:00 - 09:30',
 *   description: 'Available',
 *   enabled: true
 * };
 * ```
 */
export interface IntegrationDataItem {
  /**
   * Unique identifier for the data item.
   * This value will be returned when the user selects this option.
   */
  id: string;

  /**
   * Display title shown to the user in the dropdown.
   * Should be concise and descriptive.
   */
  title: string;

  /**
   * Optional description providing additional context.
   * Displayed as secondary text in supported components.
   */
  description?: string;

  /**
   * Whether this option is selectable by the user.
   * Disabled options are shown but cannot be selected.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Interface for integration handlers that fetch and transform data
 * from external services for use in WhatsApp Flow components.
 *
 * Each handler is responsible for a specific integration type
 * (e.g., Google Calendar, REST API, Stripe) and knows how to:
 * - Authenticate with the external service
 * - Fetch relevant data based on configuration
 * - Transform the response into WhatsApp Flow dropdown format
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class GoogleCalendarHandler implements IntegrationHandler {
 *   canHandle(config: IntegrationConfigDto): boolean {
 *     return config.integrationType === IntegrationType.GOOGLE_CALENDAR;
 *   }
 *
 *   async fetchData(
 *     config: IntegrationConfigDto,
 *     formData: Record<string, any>,
 *     context?: FlowExecutionContextDto
 *   ): Promise<IntegrationDataItem[]> {
 *     // Fetch calendar data and transform to dropdown format
 *   }
 * }
 * ```
 */
export interface IntegrationHandler {
  /**
   * Determines whether this handler can process the given integration configuration.
   *
   * This method is used by the handler registry to route requests to the
   * appropriate handler based on the integration type and configuration.
   *
   * @param config - The integration configuration to evaluate
   * @returns `true` if this handler can process the configuration, `false` otherwise
   *
   * @example
   * ```typescript
   * canHandle(config: IntegrationConfigDto): boolean {
   *   return config.integrationType === IntegrationType.GOOGLE_CALENDAR;
   * }
   * ```
   */
  canHandle(config: IntegrationConfigDto): boolean;

  /**
   * Fetches data from the external integration and transforms it
   * into WhatsApp Flow dropdown format.
   *
   * The method should:
   * 1. Resolve the data source (owner, static ID, or variable)
   * 2. Authenticate with the external service
   * 3. Execute the configured action with provided parameters
   * 4. Transform the response using the transformTo configuration
   * 5. Apply any filtering based on form data dependencies
   *
   * @param config - Integration configuration specifying the data source,
   *                 action, parameters, and transformation rules
   * @param formData - Current form data from the WhatsApp Flow,
   *                   used for dependent dropdowns and variable resolution
   * @param context - Optional execution context containing flow token,
   *                  chatbot user ID, and other runtime information
   * @returns Promise resolving to an array of data items formatted
   *          for WhatsApp Flow dropdown components
   * @throws {IntegrationError} When authentication fails or data cannot be fetched
   * @throws {TransformationError} When response data cannot be transformed
   *
   * @example
   * ```typescript
   * async fetchData(
   *   config: IntegrationConfigDto,
   *   formData: Record<string, any>,
   *   context?: FlowExecutionContextDto
   * ): Promise<IntegrationDataItem[]> {
   *   const calendarId = this.resolveSource(config, formData);
   *   const slots = await this.calendarService.getAvailableSlots(calendarId, config.params);
   *
   *   return slots.map(slot => ({
   *     id: slot[config.transformTo.idField],
   *     title: slot[config.transformTo.titleField],
   *     description: config.transformTo.descriptionField
   *       ? slot[config.transformTo.descriptionField]
   *       : undefined,
   *     enabled: true
   *   }));
   * }
   * ```
   */
  fetchData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<IntegrationDataItem[]>;
}

/**
 * Injection token for registering integration handlers.
 * Used with NestJS dependency injection to collect all handlers.
 *
 * @example
 * ```typescript
 * @Module({
 *   providers: [
 *     {
 *       provide: INTEGRATION_HANDLER,
 *       useClass: GoogleCalendarHandler,
 *       multi: true,
 *     },
 *   ],
 * })
 * export class IntegrationHandlersModule {}
 * ```
 */
export const INTEGRATION_HANDLER = Symbol('INTEGRATION_HANDLER');
