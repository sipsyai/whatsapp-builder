import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class SendTextMessageDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  @IsOptional()
  previewUrl?: boolean;
}
