import { client } from '../../api/client';
import type { AuthResponse, LoginCredentials, User } from './types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await client.get<User>('/api/auth/me');
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
