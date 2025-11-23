import { client } from '../../api/client';

export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
    updatedAt: string;
}

export const getUsers = async () => {
    const response = await client.get<User[]>('/api/users');
    return response.data;
};

export const getUser = async (id: string) => {
    const response = await client.get<User>(`/api/users/${id}`);
    return response.data;
};

export const createUser = async (data: Partial<User>) => {
    const response = await client.post<User>('/api/users', data);
    return response.data;
};

export const updateUser = async (id: string, data: Partial<User>) => {
    const response = await client.put<User>(`/api/users/${id}`, data);
    return response.data;
};

export const deleteUser = async (id: string) => {
    const response = await client.delete(`/api/users/${id}`);
    return response.data;
};
