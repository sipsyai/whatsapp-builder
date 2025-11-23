import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FlowsService } from './flows.service';

@Controller('flows')
export class FlowsController {
    constructor(private readonly flowsService: FlowsService) { }

    @Post()
    create(@Body() createFlowDto: any) {
        return this.flowsService.create(createFlowDto);
    }

    @Get()
    findAll() {
        return this.flowsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.flowsService.findOne(id);
    }
}
