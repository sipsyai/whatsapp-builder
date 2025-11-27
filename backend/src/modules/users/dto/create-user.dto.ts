import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiPropertyOptional({
    description: 'Phone number in E.164 format',
    example: '+905321234567',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Phone number must be in E.164 format' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'URL to user avatar image',
    example: 'https://example.com/avatars/john.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;
}
