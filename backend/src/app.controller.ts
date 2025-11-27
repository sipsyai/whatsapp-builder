import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  getStatus(): { status: string; version: string } {
    return {
      status: 'running',
      version: '1.0.0',
    };
  }
}
