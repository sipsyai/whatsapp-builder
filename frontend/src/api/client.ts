import axios from 'axios';

// Production: relative URL (same domain), Development: localhost
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

export const client = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Add Authorization header
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle 401 errors
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage and reload
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Only reload if not already on a public page
            if (!window.location.pathname.includes('/login')) {
                window.location.reload();
            }
        }
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);
