import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class FlowsService {
    private flows: any[] = [];

    create(flow: any) {
        const newFlow = { id: crypto.randomUUID(), ...flow, createdAt: new Date() };
        this.flows.push(newFlow);
        return newFlow;
    }

    findAll() {
        return this.flows;
    }

    findOne(id: string) {
        return this.flows.find(flow => flow.id === id);
    }
}
