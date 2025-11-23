import { client } from '../../api/client';

export interface Flow {
    id: string;
    name: string;
    nodes: any[];
    edges: any[];
    createdAt: string;
    updatedAt: string;
}

export const getFlows = async () => {
    const response = await client.get<Flow[]>('/flows');
    return response.data;
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
