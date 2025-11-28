import { client } from '../../api/client';

// Type definitions
export type DataSourceType = 'REST_API' | 'STRAPI' | 'GRAPHQL';
export type AuthType = 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC';

// Interfaces
export interface DataSource {
    id: string;
    name: string;
    description?: string;
    type: DataSourceType;
    baseUrl: string;
    authType: AuthType;
    authToken?: string;
    authHeaderName?: string;
    headers?: Record<string, string>;
    config?: Record<string, any>;
    isActive: boolean;
    timeout?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDataSourceDto {
    name: string;
    description?: string;
    type: DataSourceType;
    baseUrl: string;
    authType: AuthType;
    authToken?: string;
    authHeaderName?: string;
    headers?: Record<string, string>;
    config?: Record<string, any>;
    isActive?: boolean;
    timeout?: number;
}

export interface UpdateDataSourceDto {
    name?: string;
    description?: string;
    type?: DataSourceType;
    baseUrl?: string;
    authType?: AuthType;
    authToken?: string;
    authHeaderName?: string;
    headers?: Record<string, string>;
    config?: Record<string, any>;
    isActive?: boolean;
    timeout?: number;
}

export interface TestConnectionResponse {
    success: boolean;
    message: string;
    responseTime?: number;
    statusCode?: number;
}

// API Functions
export const getAllDataSources = async (): Promise<DataSource[]> => {
    const response = await client.get<DataSource[]>('/api/data-sources');
    return response.data;
};

export const getActiveDataSources = async (): Promise<DataSource[]> => {
    const response = await client.get<DataSource[]>('/api/data-sources/active');
    return response.data;
};

export const getDataSource = async (id: string): Promise<DataSource> => {
    const response = await client.get<DataSource>(`/api/data-sources/${id}`);
    return response.data;
};

export const createDataSource = async (data: CreateDataSourceDto): Promise<DataSource> => {
    const response = await client.post<DataSource>('/api/data-sources', data);
    return response.data;
};

export const updateDataSource = async (id: string, data: UpdateDataSourceDto): Promise<DataSource> => {
    const response = await client.put<DataSource>(`/api/data-sources/${id}`, data);
    return response.data;
};

export const deleteDataSource = async (id: string): Promise<void> => {
    await client.delete(`/api/data-sources/${id}`);
};

export const testConnection = async (id: string): Promise<TestConnectionResponse> => {
    const response = await client.post<TestConnectionResponse>(`/api/data-sources/${id}/test`);
    return response.data;
};
