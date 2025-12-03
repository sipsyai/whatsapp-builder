import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Integration types supported for WhatsApp Flow data sources
 */
export enum IntegrationType {
  REST_API = 'rest_api',
  GOOGLE_CALENDAR = 'google_calendar',
  OUTLOOK_CALENDAR = 'outlook_calendar',
  STRIPE_PAYMENTS = 'stripe_payments',
  CUSTOM_WEBHOOK = 'custom_webhook',
}

/**
 * Configuration for transforming API response data to WhatsApp Flow dropdown format
 */
export class TransformConfigDto {
  @IsString()
  idField: string;

  @IsString()
  titleField: string;

  @IsString()
  @IsOptional()
  descriptionField?: string;
}

/**
 * Base integration configuration for WhatsApp Flow dynamic data sources
 */
export class IntegrationConfigDto {
  @IsString()
  componentName: string;

  @IsEnum(IntegrationType)
  integrationType: IntegrationType;

  @IsIn(['owner', 'static', 'variable'])
  sourceType: 'owner' | 'static' | 'variable';

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  sourceVariable?: string;

  @IsString()
  action: string;

  @IsObject()
  @IsOptional()
  params?: Record<string, any>;

  @ValidateNested()
  @Type(() => TransformConfigDto)
  transformTo: TransformConfigDto;

  @IsString()
  @IsOptional()
  dependsOn?: string;

  @IsString()
  @IsOptional()
  filterParam?: string;
}

/**
 * Google Calendar specific action types
 */
export type GoogleCalendarAction =
  | 'check_availability'
  | 'get_events'
  | 'get_today_events'
  | 'get_tomorrow_events'
  | 'list_calendar_users';

/**
 * Parameters specific to Google Calendar integration
 */
export class GoogleCalendarParamsDto {
  @IsString()
  @IsOptional()
  workingHoursStart?: string;

  @IsString()
  @IsOptional()
  workingHoursEnd?: string;

  @IsNumber()
  @IsOptional()
  slotDuration?: number;

  @IsIn(['static', 'variable'])
  @IsOptional()
  dateSource?: 'static' | 'variable';

  @IsString()
  @IsOptional()
  dateVariable?: string;

  @IsString()
  @IsOptional()
  staticDate?: string;

  @IsNumber()
  @IsOptional()
  maxResults?: number;
}

/**
 * Google Calendar specific integration configuration
 */
export class GoogleCalendarIntegrationConfigDto extends IntegrationConfigDto {
  @IsEnum(IntegrationType)
  declare integrationType: IntegrationType.GOOGLE_CALENDAR;

  @IsIn([
    'check_availability',
    'get_events',
    'get_today_events',
    'get_tomorrow_events',
    'list_calendar_users',
  ])
  declare action: GoogleCalendarAction;

  @ValidateNested()
  @Type(() => GoogleCalendarParamsDto)
  @IsOptional()
  declare params?: GoogleCalendarParamsDto;

  constructor() {
    super();
    this.integrationType = IntegrationType.GOOGLE_CALENDAR;
  }
}

/**
 * Context information available during WhatsApp Flow execution
 */
export class FlowExecutionContextDto {
  @IsString()
  @IsOptional()
  flowToken?: string;

  @IsString()
  @IsOptional()
  contextId?: string;

  @IsString()
  @IsOptional()
  nodeId?: string;

  @IsString()
  @IsOptional()
  chatbotUserId?: string;
}
