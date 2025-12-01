import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OAuthCallbackDto {
  @ApiProperty({ description: 'Authorization code from Google' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'State parameter for CSRF protection' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class CalendarEventsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  timeMin?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-01-02T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  timeMax?: string;

  @ApiPropertyOptional({ description: 'Maximum number of events', example: '10' })
  @IsOptional()
  @IsString()
  maxResults?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;
  htmlLink: string;
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

export interface OAuthStatusResponse {
  connected: boolean;
  provider: string;
  email?: string;
  expiresAt?: Date;
  connectedAt?: Date;
}

export interface AuthUrlResponse {
  authUrl: string;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  nextPageToken?: string;
}
