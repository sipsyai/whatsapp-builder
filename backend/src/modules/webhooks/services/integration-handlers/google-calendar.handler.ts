import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IntegrationHandler,
  IntegrationDataItem,
} from './integration-handler.interface';
import {
  IntegrationConfigDto,
  IntegrationType,
  GoogleCalendarIntegrationConfigDto,
  GoogleCalendarParamsDto,
  FlowExecutionContextDto,
} from '../../../flows/dto/integration-config.dto';
import { GoogleOAuthService } from '../../../google-oauth/google-oauth.service';
import { User } from '../../../../entities/user.entity';
import { UserOAuthToken, OAuthProvider } from '../../../../entities/user-oauth-token.entity';

/**
 * Integration handler for Google Calendar.
 * Supports fetching available time slots, calendar events, and listing calendar users.
 *
 * @example
 * ```typescript
 * // Check availability for a specific date
 * const config: GoogleCalendarIntegrationConfigDto = {
 *   componentName: 'time_slot',
 *   integrationType: IntegrationType.GOOGLE_CALENDAR,
 *   sourceType: 'owner',
 *   action: 'check_availability',
 *   params: {
 *     workingHoursStart: '09:00',
 *     workingHoursEnd: '18:00',
 *     slotDuration: 60,
 *     dateSource: 'variable',
 *     dateVariable: 'selected_date'
 *   },
 *   transformTo: { idField: 'id', titleField: 'title' }
 * };
 * ```
 */
@Injectable()
export class GoogleCalendarIntegrationHandler implements IntegrationHandler {
  private readonly logger = new Logger(GoogleCalendarIntegrationHandler.name);

  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserOAuthToken)
    private readonly tokenRepo: Repository<UserOAuthToken>,
  ) {}

  /**
   * Check if this handler can process the given integration configuration.
   * @param config - Integration configuration to evaluate
   * @returns true if the integration type is GOOGLE_CALENDAR
   */
  canHandle(config: IntegrationConfigDto): boolean {
    return config.integrationType === IntegrationType.GOOGLE_CALENDAR;
  }

  /**
   * Fetch data from Google Calendar based on the configured action.
   * @param config - Integration configuration with action and parameters
   * @param formData - Current form data from WhatsApp Flow
   * @param context - Optional execution context
   * @returns Array of data items formatted for WhatsApp Flow dropdowns
   */
  async fetchData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<IntegrationDataItem[]> {
    const calendarConfig = config as GoogleCalendarIntegrationConfigDto;

    this.logger.debug(
      `Fetching Google Calendar data: action=${calendarConfig.action}, sourceType=${calendarConfig.sourceType}`,
    );

    try {
      // list_calendar_users is a special action - lists users with Google Calendar connected
      if (calendarConfig.action === 'list_calendar_users') {
        return this.listCalendarUsers(calendarConfig);
      }

      // For other actions, resolve the target user ID
      const userId = await this.resolveUserId(calendarConfig, formData, context);
      if (!userId) {
        this.logger.warn(
          'Could not resolve calendar user for action: ' + calendarConfig.action,
        );
        return [];
      }

      const targetDate = this.resolveDate(calendarConfig.params, formData);

      switch (calendarConfig.action) {
        case 'check_availability':
          return this.getAvailableSlots(userId, targetDate, calendarConfig.params);

        case 'get_events':
          return this.getEvents(userId, targetDate, calendarConfig);

        case 'get_today_events':
          return this.getTodayEvents(userId, calendarConfig);

        case 'get_tomorrow_events':
          return this.getTomorrowEvents(userId, calendarConfig);

        default:
          this.logger.warn(`Unknown Google Calendar action: ${calendarConfig.action}`);
          return [];
      }
    } catch (error) {
      this.logger.error(`Failed to fetch Google Calendar data: ${error.message}`, error.stack);
      throw error; // Registry'nin yakalaması için fırlat
    }
  }

  /**
   * List users who have Google Calendar connected.
   * Uses QueryBuilder to join user_oauth_tokens table and filter by provider and isActive.
   * @param config - Integration configuration with transform settings
   * @returns Array of users with Google Calendar connection
   */
  private async listCalendarUsers(
    config: GoogleCalendarIntegrationConfigDto,
  ): Promise<IntegrationDataItem[]> {
    try {
      this.logger.debug('Listing users with Google Calendar connected');

      // Query users who have an active Google Calendar OAuth token
      const usersWithCalendar = await this.userRepo
        .createQueryBuilder('user')
        .innerJoin(
          UserOAuthToken,
          'token',
          'token.userId = user.id AND token.provider = :provider AND token.isActive = :isActive',
          {
            provider: OAuthProvider.GOOGLE_CALENDAR,
            isActive: true,
          },
        )
        .select([
          'user.id',
          'user.name',
          'user.email',
        ])
        .where('user.isActive = :userActive', { userActive: true })
        .getMany();

      this.logger.debug(`Found ${usersWithCalendar.length} users with Google Calendar`);

      // Transform to IntegrationDataItem format
      return usersWithCalendar.map((user) => ({
        id: user.id,
        title: user.name || user.email || 'Unknown User',
        description: user.email,
        enabled: true,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to list calendar users: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get available time slots for a specific date.
   * Uses GoogleOAuthService.getAvailableSlotsOnly to fetch available slots.
   * @param userId - User ID to check calendar for
   * @param date - Target date in YYYY-MM-DD format
   * @param params - Calendar parameters (working hours, slot duration)
   * @returns Array of available time slots
   */
  private async getAvailableSlots(
    userId: string,
    date: string,
    params?: GoogleCalendarParamsDto,
  ): Promise<IntegrationDataItem[]> {
    try {
      const workStart = params?.workingHoursStart || '09:00';
      const workEnd = params?.workingHoursEnd || '18:00';
      const slotDuration = params?.slotDuration || 60;

      this.logger.debug(
        `Getting available slots for user ${userId} on ${date} (${workStart}-${workEnd}, ${slotDuration}min slots)`,
      );

      const slots = await this.googleOAuthService.getAvailableSlotsOnly(
        userId,
        date,
        workStart,
        workEnd,
        slotDuration,
      );

      this.logger.debug(`Found ${slots.length} available slots`);

      // Slots are already in the correct format from getAvailableSlotsOnly
      return slots.map((slot) => ({
        id: slot.id,
        title: slot.title,
        enabled: slot.enabled,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get available slots: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get calendar events for a specific date range.
   * @param userId - User ID to fetch events for
   * @param date - Target date in YYYY-MM-DD format
   * @param config - Configuration with transform settings and params
   * @returns Array of calendar events
   */
  private async getEvents(
    userId: string,
    date: string,
    config: GoogleCalendarIntegrationConfigDto,
  ): Promise<IntegrationDataItem[]> {
    try {
      const maxResults = config.params?.maxResults || 50;

      // Calculate date range for the specified date
      const startOfDay = new Date(`${date}T00:00:00`);
      const endOfDay = new Date(`${date}T23:59:59`);

      this.logger.debug(
        `Getting events for user ${userId} on ${date} (max: ${maxResults})`,
      );

      const response = await this.googleOAuthService.getCalendarEvents(
        userId,
        startOfDay.toISOString(),
        endOfDay.toISOString(),
        maxResults,
      );

      return this.transformEvents(response.events, config.transformTo);
    } catch (error) {
      this.logger.error(
        `Failed to get calendar events: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get today's calendar events.
   * @param userId - User ID to fetch events for
   * @param config - Configuration with transform settings
   * @returns Array of today's calendar events
   */
  private async getTodayEvents(
    userId: string,
    config: GoogleCalendarIntegrationConfigDto,
  ): Promise<IntegrationDataItem[]> {
    try {
      this.logger.debug(`Getting today's events for user ${userId}`);

      const response = await this.googleOAuthService.getTodayEvents(userId);

      return this.transformEvents(response.events, config.transformTo);
    } catch (error) {
      this.logger.error(
        `Failed to get today's events: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get tomorrow's calendar events.
   * @param userId - User ID to fetch events for
   * @param config - Configuration with transform settings
   * @returns Array of tomorrow's calendar events
   */
  private async getTomorrowEvents(
    userId: string,
    config: GoogleCalendarIntegrationConfigDto,
  ): Promise<IntegrationDataItem[]> {
    try {
      this.logger.debug(`Getting tomorrow's events for user ${userId}`);

      const response = await this.googleOAuthService.getTomorrowEvents(userId);

      return this.transformEvents(response.events, config.transformTo);
    } catch (error) {
      this.logger.error(
        `Failed to get tomorrow's events: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Resolve the user ID based on the source type configuration.
   * @param config - Integration configuration with source type
   * @param formData - Current form data for variable resolution
   * @param context - Execution context with chatbot user ID
   * @returns Resolved user ID or null if not found
   */
  private async resolveUserId(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<string | null> {
    switch (config.sourceType) {
      case 'owner':
        // Use the chatbot owner's calendar (from context)
        if (context?.chatbotUserId) {
          this.logger.debug(`Using owner userId from context: ${context.chatbotUserId}`);
          return context.chatbotUserId;
        }
        this.logger.warn('Owner sourceType requested but no chatbotUserId in context');
        return null;

      case 'static':
        // Use a statically configured user ID
        if (config.sourceId) {
          this.logger.debug(`Using static userId: ${config.sourceId}`);
          return config.sourceId;
        }
        this.logger.warn('Static sourceType requested but no sourceId provided');
        return null;

      case 'variable':
        // Resolve user ID from form data variable
        if (config.sourceVariable && formData[config.sourceVariable]) {
          const resolvedId = String(formData[config.sourceVariable]);
          this.logger.debug(
            `Resolved userId from variable ${config.sourceVariable}: ${resolvedId}`,
          );
          return resolvedId;
        }
        this.logger.warn(
          `Variable sourceType requested but variable ${config.sourceVariable} not found in formData`,
        );
        return null;

      default:
        this.logger.warn(`Unknown sourceType: ${config.sourceType}`);
        return null;
    }
  }

  /**
   * Resolve the target date based on the date source configuration.
   * @param params - Calendar parameters with date source settings
   * @param formData - Current form data for variable resolution
   * @returns Date string in YYYY-MM-DD format, defaults to today
   */
  private resolveDate(
    params: GoogleCalendarParamsDto | undefined,
    formData: Record<string, any>,
  ): string {
    // Default to today's date
    const today = new Date().toISOString().split('T')[0];

    if (!params) {
      this.logger.debug(`No params provided, using today's date: ${today}`);
      return today;
    }

    switch (params.dateSource) {
      case 'static':
        if (params.staticDate) {
          this.logger.debug(`Using static date: ${params.staticDate}`);
          return params.staticDate;
        }
        this.logger.debug(`Static date source but no staticDate, using today: ${today}`);
        return today;

      case 'variable':
        if (params.dateVariable && formData[params.dateVariable]) {
          const resolvedDate = String(formData[params.dateVariable]);
          this.logger.debug(
            `Resolved date from variable ${params.dateVariable}: ${resolvedDate}`,
          );
          return resolvedDate;
        }
        this.logger.debug(
          `Variable date source but variable ${params.dateVariable} not found, using today: ${today}`,
        );
        return today;

      default:
        this.logger.debug(`No dateSource specified, using today's date: ${today}`);
        return today;
    }
  }

  /**
   * Transform calendar events to IntegrationDataItem format.
   * @param events - Array of calendar events from Google Calendar
   * @param transformTo - Transform configuration specifying field mappings
   * @returns Array of IntegrationDataItem objects
   */
  private transformEvents(
    events: any[],
    transformTo: { idField: string; titleField: string; descriptionField?: string },
  ): IntegrationDataItem[] {
    if (!events || events.length === 0) {
      return [];
    }

    return events.map((event) => {
      // Build the transformed item
      const item: IntegrationDataItem = {
        id: this.getFieldValue(event, transformTo.idField) || event.id,
        title: this.getFieldValue(event, transformTo.titleField) || event.summary || 'Untitled Event',
        enabled: true,
      };

      // Add description if configured
      if (transformTo.descriptionField) {
        const description = this.getFieldValue(event, transformTo.descriptionField);
        if (description) {
          item.description = description;
        }
      }

      // Add time information to description if not already present
      if (!item.description && event.start) {
        const startTime = event.start.dateTime
          ? new Date(event.start.dateTime).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'All day';
        item.description = startTime;
      }

      return item;
    });
  }

  /**
   * Get a field value from an event object using dot notation.
   * Supports nested fields like 'start.dateTime'.
   * @param event - Event object
   * @param fieldPath - Field path (e.g., 'id', 'start.dateTime')
   * @returns Field value or undefined if not found
   */
  private getFieldValue(event: any, fieldPath: string): string | undefined {
    if (!fieldPath) return undefined;

    const parts = fieldPath.split('.');
    let value: any = event;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value !== null && value !== undefined ? String(value) : undefined;
  }
}
