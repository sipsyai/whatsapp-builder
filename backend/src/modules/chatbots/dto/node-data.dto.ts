import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ButtonItemDto, ListSectionDto } from './list-section.dto';

export enum NodeDataType {
  START = 'start',
  MESSAGE = 'message',
  QUESTION = 'question',
  CONDITION = 'condition',
  WHATSAPP_FLOW = 'whatsapp_flow',
  REST_API = 'rest_api',
  GOOGLE_CALENDAR = 'google_calendar',
}

export enum QuestionType {
  TEXT = 'text',
  BUTTONS = 'buttons',
  LIST = 'list',
}

// Condition Group DTOs for multi-condition support
export class ConditionDto {
  @ApiProperty({ description: 'Unique condition identifier', example: 'cond_1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Variable name for condition', example: 'user_age' })
  @IsString()
  variable: string;

  @ApiProperty({ description: 'Condition operator', example: 'eq' })
  @IsString()
  operator: string;

  @ApiProperty({ description: 'Value to compare against', example: '18' })
  @IsString()
  value: string;
}

export class ConditionGroupDto {
  @ApiProperty({ description: 'Array of conditions', type: [ConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions: ConditionDto[];

  @ApiProperty({ description: 'Logical operator between conditions', enum: ['AND', 'OR'] })
  @IsIn(['AND', 'OR'])
  logicalOperator: 'AND' | 'OR';
}

export class NodeDataDto {
  @ApiProperty({ description: 'Display label for the node', example: 'Welcome Message' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'Type of node data', enum: NodeDataType, example: 'message' })
  @IsOptional()
  @IsEnum(NodeDataType)
  type?: NodeDataType;

  @ApiPropertyOptional({ description: 'Message content or text to display', example: 'Hello! Welcome to our service.' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Variable name to store user input', example: 'user_name' })
  @IsOptional()
  @IsString()
  variable?: string;

  @ApiPropertyOptional({ description: 'Array of options for buttons or list items', example: ['Option 1', 'Option 2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Variable name for condition evaluation', example: 'user_age' })
  @IsOptional()
  @IsString()
  conditionVar?: string;

  @ApiPropertyOptional({ description: 'Condition operator (eq, ne, gt, lt, contains)', example: 'eq' })
  @IsOptional()
  @IsString()
  conditionOp?: string;

  @ApiPropertyOptional({ description: 'Value to compare against', example: '18' })
  @IsOptional()
  @IsString()
  conditionVal?: string;

  @ApiPropertyOptional({ description: 'Condition group for multi-condition support', type: ConditionGroupDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConditionGroupDto)
  conditionGroup?: ConditionGroupDto;

  @ApiPropertyOptional({ description: 'Type of message (text, image, document)', example: 'text' })
  @IsOptional()
  @IsString()
  messageType?: string;

  @ApiPropertyOptional({ description: 'Type of question input', enum: QuestionType, example: 'buttons' })
  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @ApiPropertyOptional({ description: 'Header text for interactive messages', example: 'Select an Option' })
  @IsOptional()
  @IsString()
  headerText?: string;

  @ApiPropertyOptional({ description: 'Footer text for interactive messages', example: 'Powered by WhatsApp Builder' })
  @IsOptional()
  @IsString()
  footerText?: string;

  @ApiPropertyOptional({ description: 'Whether to include media in header', example: false })
  @IsOptional()
  @IsBoolean()
  mediaHeader?: boolean;

  @ApiPropertyOptional({
    description: 'Button items for interactive messages (max 3 buttons)',
    type: [ButtonItemDto],
    example: [
      { id: 'btn_1', title: 'Yes' },
      { id: 'btn_2', title: 'No' },
      { id: 'btn_3', title: 'Maybe' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ButtonItemDto)
  buttons?: ButtonItemDto[];

  @ApiPropertyOptional({ description: 'Button text for list messages', example: 'View Options' })
  @IsOptional()
  @IsString()
  listButtonText?: string;

  @ApiPropertyOptional({ description: 'Sections for list-type questions', type: [ListSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListSectionDto)
  listSections?: ListSectionDto[];

  // Dynamic List/Buttons Fields
  @ApiPropertyOptional({ description: 'Variable name containing array data for dynamic list', example: 'categories' })
  @IsOptional()
  @IsString()
  dynamicListSource?: string;

  @ApiPropertyOptional({ description: 'Variable name containing array data for dynamic buttons', example: 'options' })
  @IsOptional()
  @IsString()
  dynamicButtonsSource?: string;

  @ApiPropertyOptional({ description: 'Field name to use as label from dynamic data items', example: 'name' })
  @IsOptional()
  @IsString()
  dynamicLabelField?: string;

  @ApiPropertyOptional({ description: 'Field name to use as description from dynamic data items', example: 'description' })
  @IsOptional()
  @IsString()
  dynamicDescField?: string;

  @ApiPropertyOptional({ description: 'WhatsApp Flow ID from Meta', example: '1234567890' })
  @IsOptional()
  @IsString()
  whatsappFlowId?: string;

  @ApiPropertyOptional({ description: 'Flow mode: navigate or data_exchange', example: 'data_exchange' })
  @IsOptional()
  @IsString()
  flowMode?: string;

  @ApiPropertyOptional({ description: 'Call-to-action button text (max 20 chars)', example: 'Start Flow' })
  @IsOptional()
  @IsString()
  flowCta?: string;

  @ApiPropertyOptional({ description: 'Flow message body text', example: 'Please complete the following form' })
  @IsOptional()
  @IsString()
  flowBodyText?: string;

  @ApiPropertyOptional({ description: 'Optional header text for flow message', example: 'Appointment Booking' })
  @IsOptional()
  @IsString()
  flowHeaderText?: string;

  @ApiPropertyOptional({ description: 'Optional footer text for flow message', example: 'Takes 2 minutes' })
  @IsOptional()
  @IsString()
  flowFooterText?: string;

  @ApiPropertyOptional({ description: 'Starting screen ID for the flow', example: 'WELCOME_SCREEN' })
  @IsOptional()
  @IsString()
  flowInitialScreen?: string;

  @ApiPropertyOptional({ description: 'Initial data to pass to the flow', example: { user_id: '123' } })
  @IsOptional()
  flowInitialData?: any;

  @ApiPropertyOptional({ description: 'Variable name to store flow response', example: 'flow_result' })
  @IsOptional()
  @IsString()
  flowOutputVariable?: string;

  @ApiPropertyOptional({ description: 'Data Source UUID for WhatsApp Flow dynamic data', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  dataSourceId?: string;

  @ApiPropertyOptional({ description: 'API endpoint path for Data Source', example: '/api/brands' })
  @IsOptional()
  @IsString()
  dataSourceEndpoint?: string;

  @ApiPropertyOptional({ description: 'Key to extract array from Data Source response', example: 'data' })
  @IsOptional()
  @IsString()
  dataSourceDataKey?: string;

  // REST API Fields
  @ApiPropertyOptional({ description: 'REST API URL (supports {{variable}})', example: 'http://192.168.1.18:1337/api/categories' })
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiPropertyOptional({ description: 'HTTP Method', enum: ['GET', 'POST', 'PUT', 'DELETE'] })
  @IsOptional()
  @IsString()
  apiMethod?: string;

  @ApiPropertyOptional({ description: 'Request headers' })
  @IsOptional()
  apiHeaders?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Request body (JSON string)' })
  @IsOptional()
  @IsString()
  apiBody?: string;

  @ApiPropertyOptional({ description: 'Content-Type for request body', enum: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'] })
  @IsOptional()
  @IsString()
  apiContentType?: string;

  @ApiPropertyOptional({ description: 'Variable to store response', example: 'api_result' })
  @IsOptional()
  @IsString()
  apiOutputVariable?: string;

  @ApiPropertyOptional({ description: 'JSON path to extract (e.g., "data")', example: 'data' })
  @IsOptional()
  @IsString()
  apiResponsePath?: string;

  @ApiPropertyOptional({ description: 'Variable to store error', example: 'api_error' })
  @IsOptional()
  @IsString()
  apiErrorVariable?: string;

  @ApiPropertyOptional({ description: 'Request timeout in ms', example: 30000 })
  @IsOptional()
  apiTimeout?: number;

  @ApiPropertyOptional({ description: 'Field to filter response array by', example: 'mobile' })
  @IsOptional()
  @IsString()
  apiFilterField?: string;

  @ApiPropertyOptional({ description: 'Value to filter by (supports {{variable}})', example: '{{customer_phone}}' })
  @IsOptional()
  @IsString()
  apiFilterValue?: string;

  // REST API Query Params
  @ApiPropertyOptional({ description: 'Query parameters as key-value pairs' })
  @IsOptional()
  apiQueryParams?: Record<string, string>;

  // REST API Authentication Fields
  @ApiPropertyOptional({ description: 'Authentication type', enum: ['none', 'bearer', 'basic', 'api_key'] })
  @IsOptional()
  @IsString()
  apiAuthType?: string;

  @ApiPropertyOptional({ description: 'Bearer token or API key value' })
  @IsOptional()
  @IsString()
  apiAuthToken?: string;

  @ApiPropertyOptional({ description: 'Basic auth username' })
  @IsOptional()
  @IsString()
  apiAuthUsername?: string;

  @ApiPropertyOptional({ description: 'Basic auth password' })
  @IsOptional()
  @IsString()
  apiAuthPassword?: string;

  @ApiPropertyOptional({ description: 'API Key header name', example: 'X-API-Key' })
  @IsOptional()
  @IsString()
  apiAuthKeyName?: string;

  @ApiPropertyOptional({ description: 'API Key value' })
  @IsOptional()
  @IsString()
  apiAuthKeyValue?: string;

  @ApiPropertyOptional({ description: 'API Key location', enum: ['header', 'query'] })
  @IsOptional()
  @IsString()
  apiAuthKeyLocation?: string;

  // Google Calendar Fields
  @ApiPropertyOptional({ description: 'Calendar action type', enum: ['get_today_events', 'get_tomorrow_events', 'get_events', 'check_availability'] })
  @IsOptional()
  @IsString()
  calendarAction?: string;

  @ApiPropertyOptional({ description: 'Calendar user source type', enum: ['owner', 'static', 'variable'] })
  @IsOptional()
  @IsString()
  calendarUserSource?: string;

  @ApiPropertyOptional({ description: 'Static calendar user ID' })
  @IsOptional()
  @IsString()
  calendarUserId?: string;

  @ApiPropertyOptional({ description: 'Variable containing calendar user ID' })
  @IsOptional()
  @IsString()
  calendarUserVariable?: string;

  @ApiPropertyOptional({ description: 'Calendar date source type', enum: ['variable', 'static'] })
  @IsOptional()
  @IsString()
  calendarDateSource?: string;

  @ApiPropertyOptional({ description: 'Variable containing the date', example: 'selected_date' })
  @IsOptional()
  @IsString()
  calendarDateVariable?: string;

  @ApiPropertyOptional({ description: 'Static date value (YYYY-MM-DD)', example: '2024-12-01' })
  @IsOptional()
  @IsString()
  calendarStaticDate?: string;

  @ApiPropertyOptional({ description: 'Calendar end date source type', enum: ['variable', 'static'] })
  @IsOptional()
  @IsString()
  calendarEndDateSource?: string;

  @ApiPropertyOptional({ description: 'Variable containing the end date' })
  @IsOptional()
  @IsString()
  calendarEndDateVariable?: string;

  @ApiPropertyOptional({ description: 'Static end date value (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  calendarStaticEndDate?: string;

  @ApiPropertyOptional({ description: 'Maximum number of events to retrieve', example: 10 })
  @IsOptional()
  calendarMaxResults?: number;

  @ApiPropertyOptional({ description: 'Working hours start time (HH:mm)', example: '09:00' })
  @IsOptional()
  @IsString()
  calendarWorkingHoursStart?: string;

  @ApiPropertyOptional({ description: 'Working hours end time (HH:mm)', example: '18:00' })
  @IsOptional()
  @IsString()
  calendarWorkingHoursEnd?: string;

  @ApiPropertyOptional({ description: 'Slot duration in minutes', example: 30 })
  @IsOptional()
  calendarSlotDuration?: number;

  @ApiPropertyOptional({ description: 'Variable to store calendar output', example: 'calendar_result' })
  @IsOptional()
  @IsString()
  calendarOutputVariable?: string;

  @ApiPropertyOptional({ description: 'Output format type', enum: ['full', 'slots_only'] })
  @IsOptional()
  @IsString()
  calendarOutputFormat?: string;
}
