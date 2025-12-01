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

export class AvailabilityQueryDto {
  @ApiProperty({ description: 'Date to check availability (YYYY-MM-DD)', example: '2025-01-15' })
  @IsString()
  date: string;

  @ApiPropertyOptional({ description: 'Working hours start time (HH:MM)', example: '09:00', default: '09:00' })
  @IsOptional()
  @IsString()
  workStart?: string;

  @ApiPropertyOptional({ description: 'Working hours end time (HH:MM)', example: '18:00', default: '18:00' })
  @IsOptional()
  @IsString()
  workEnd?: string;

  @ApiPropertyOptional({ description: 'Slot duration in minutes', example: '60', default: '60' })
  @IsOptional()
  @IsString()
  slotDuration?: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  workingHours: {
    start: string;
    end: string;
  };
  slotDuration: number;
  slots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
  busySlots: number;
}
