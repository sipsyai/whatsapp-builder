import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsInt, Min, Max, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CalendarPermission, InviteStatus } from '../../../entities/calendar-share.entity';
import { AppointmentStatus } from '../../../entities/appointment.entity';

// =====================================================
// Calendar DTOs
// =====================================================

export class CreateCalendarDto {
  @ApiProperty({ example: 'Work Calendar' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'My work appointments' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateCalendarDto {
  @ApiPropertyOptional({ example: 'Updated Calendar Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#ef4444' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CalendarResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  googleCalendarId: string | null;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  permission?: CalendarPermission;

  @ApiPropertyOptional()
  ownerName?: string;
}

// =====================================================
// Calendar Share DTOs
// =====================================================

export class CreateInviteDto {
  @ApiProperty({ description: 'Calendar ID' })
  @IsUUID()
  calendarId: string;

  @ApiProperty({ enum: CalendarPermission, example: 'READ' })
  @IsEnum(CalendarPermission)
  permission: CalendarPermission;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  invitedEmail?: string;
}

export class AcceptInviteDto {
  @ApiProperty({ description: 'Invite token from the link' })
  @IsString()
  token: string;
}

export class CalendarShareResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  calendarId: string;

  @ApiProperty()
  userId: string | null;

  @ApiProperty({ enum: CalendarPermission })
  permission: CalendarPermission;

  @ApiProperty()
  inviteToken: string | null;

  @ApiProperty()
  inviteExpiresAt: Date | null;

  @ApiProperty({ enum: InviteStatus })
  inviteStatus: InviteStatus;

  @ApiProperty()
  invitedEmail: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  userName?: string;

  @ApiPropertyOptional()
  calendarName?: string;
}

export class InviteLinkResponseDto {
  @ApiProperty({ example: 'https://whatsapp.sipsy.ai/invite/abc123' })
  inviteLink: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  token: string;
}

// =====================================================
// Appointment DTOs
// =====================================================

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  calendarId: string;

  @ApiProperty({ example: 'Haircut' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Regular haircut appointment' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-12-15T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-12-15T11:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'Haircut' })
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiPropertyOptional({ example: 60, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  duration?: number;

  @ApiPropertyOptional({ example: 'Customer prefers short style' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: 'Updated Haircut' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AppointmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  calendarId: string;

  @ApiProperty()
  googleEventId: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  customerPhone: string | null;

  @ApiProperty()
  customerName: string | null;

  @ApiProperty()
  customerEmail: string | null;

  @ApiProperty({ enum: AppointmentStatus })
  status: AppointmentStatus;

  @ApiProperty()
  serviceType: string | null;

  @ApiProperty()
  duration: number | null;

  @ApiProperty()
  notes: string | null;

  @ApiProperty()
  createdById: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  calendarName?: string;

  @ApiPropertyOptional()
  calendarColor?: string;
}

export class AppointmentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  calendarId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

// Export type-only interfaces
export interface CalendarWithPermission extends CalendarResponseDto {
  permission: CalendarPermission;
  isOwner: boolean;
}
