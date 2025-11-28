import { client } from '../../api/client';
import type {
  DataSourceConnection,
  CreateConnectionDto,
  UpdateConnectionDto,
  TestConnectionRequest,
  TestConnectionResponse as ConnectionTestResponse,
  GroupedConnections,
} from './types';

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

export interface TestEndpointRequest {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    params?: Record<string, any>;
    body?: any;
}

export interface TestEndpointResponse {
    success: boolean;
    statusCode?: number;
    responseTime: number;
    data?: any;
    error?: string;
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

export const testEndpoint = async (
    id: string,
    request: TestEndpointRequest
): Promise<TestEndpointResponse> => {
    const response = await client.post<TestEndpointResponse>(`/api/data-sources/${id}/test-endpoint`, request);
    return response.data;
};

// ============================================================================
// Connection API
// ============================================================================

export const connectionApi = {
  // Get all connections for a data source
  getByDataSource: async (dataSourceId: string): Promise<DataSourceConnection[]> => {
    const response = await client.get<DataSourceConnection[]>(`/api/data-sources/${dataSourceId}/connections`);
    return response.data;
  },

  // Get active connections for a data source
  getActiveByDataSource: async (dataSourceId: string): Promise<DataSourceConnection[]> => {
    const response = await client.get<DataSourceConnection[]>(`/api/data-sources/${dataSourceId}/connections/active`);
    return response.data;
  },

  // Get single connection
  getById: async (connectionId: string): Promise<DataSourceConnection> => {
    const response = await client.get<DataSourceConnection>(`/api/data-sources/connections/${connectionId}`);
    return response.data;
  },

  // Create connection
  create: async (dataSourceId: string, data: CreateConnectionDto): Promise<DataSourceConnection> => {
    const response = await client.post<DataSourceConnection>(`/api/data-sources/${dataSourceId}/connections`, data);
    return response.data;
  },

  // Update connection
  update: async (connectionId: string, data: UpdateConnectionDto): Promise<DataSourceConnection> => {
    const response = await client.put<DataSourceConnection>(`/api/data-sources/connections/${connectionId}`, data);
    return response.data;
  },

  // Delete connection
  delete: async (connectionId: string): Promise<void> => {
    await client.delete(`/api/data-sources/connections/${connectionId}`);
  },

  // Execute connection
  execute: async (connectionId: string, request?: TestConnectionRequest): Promise<ConnectionTestResponse> => {
    const response = await client.post<ConnectionTestResponse>(`/api/data-sources/connections/${connectionId}/execute`, request);
    return response.data;
  },

  // Execute chained connection
  executeChain: async (connectionId: string, contextData?: Record<string, any>): Promise<any> => {
    const response = await client.post(`/api/data-sources/connections/${connectionId}/execute-chain`, { contextData });
    return response.data;
  },

  // Get all active connections grouped by data source (for selectors)
  getAllActiveGrouped: async (): Promise<GroupedConnections[]> => {
    const response = await client.get<GroupedConnections[]>('/api/data-sources/connections/grouped/active');
    return response.data;
  },
};
