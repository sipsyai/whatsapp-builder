import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ChatBotsService } from './chatbots.service';
import { CreateChatBotDto } from './dto/create-chatbot.dto';
import { UpdateChatBotDto } from './dto/update-chatbot.dto';
import { QueryChatBotsDto } from './dto/query-chatbots.dto';

@Controller('api/chatbots')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ChatBotsController {
  constructor(private readonly chatbotsService: ChatBotsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createChatBotDto: CreateChatBotDto) {
    return this.chatbotsService.create(createChatBotDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryChatBotsDto) {
    return this.chatbotsService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.chatbotsService.findOne(id);
  }

  @Get(':id/stats')
  async getChatBotStats(@Param('id') id: string) {
    return this.chatbotsService.getChatBotStats(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateChatBotDto: UpdateChatBotDto) {
    return this.chatbotsService.update(id, updateChatBotDto);
  }

  @Patch(':id')
  async partialUpdate(
    @Param('id') id: string,
    @Body() updateData: Partial<UpdateChatBotDto>,
  ) {
    return this.chatbotsService.partialUpdate(id, updateData);
  }

  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return this.chatbotsService.restore(id);
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string) {
    return this.chatbotsService.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.chatbotsService.delete(id);
  }

  @Delete(':id/soft')
  async softDelete(@Param('id') id: string) {
    return this.chatbotsService.softDelete(id);
  }
}
