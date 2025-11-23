import { client } from '../../api/client';

export interface Flow {
    id: string;
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    isActive: boolean;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface FlowStats {
    nodeCount: number;
    edgeCount: number;
    nodeTypes: Record<string, number>;
}

export interface QueryFlowsParams {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'ASC' | 'DESC';
    isActive?: boolean;
}

export const getFlows = async (params?: QueryFlowsParams) => {
    const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
    ).toString() : '';

    const response = await client.get<{ data: Flow[], total: number, limit: number, offset: number }>(`/flows${queryString}`);
    // Backend returns {data: Flow[], total, limit, offset}, extract just the data array
    return response.data.data || [];
};

export const getFlow = async (id: string) => {
    const response = await client.get<Flow>(`/flows/${id}`);
    return response.data;
};

export const createFlow = async (data: Partial<Flow>) => {
    const response = await client.post<Flow>('/flows', data);
    return response.data;
};

export const updateFlow = async (id: string, data: Partial<Flow>) => {
    const response = await client.put<Flow>(`/flows/${id}`, data);
    return response.data;
};

export const deleteFlow = async (id: string) => {
    const response = await client.delete(`/flows/${id}`);
    return response.data;
};

export const getFlowStats = async (id: string) => {
    const response = await client.get<FlowStats>(`/flows/${id}/stats`);
    return response.data;
};

export const softDeleteFlow = async (id: string) => {
    const response = await client.delete(`/flows/${id}/soft`);
    return response.data;
};

export const restoreFlow = async (id: string) => {
    const response = await client.patch(`/flows/${id}/restore`);
    return response.data;
};
