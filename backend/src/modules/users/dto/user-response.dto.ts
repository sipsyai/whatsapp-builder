import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'Unique user identifier (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Phone number in E.164 format', example: '+905321234567' })
  phoneNumber: string;

  @ApiProperty({ description: 'User display name', example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ description: 'URL to user avatar image', example: 'https://example.com/avatars/john.jpg' })
  avatar?: string;

  @ApiProperty({ description: 'Account creation timestamp', example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
