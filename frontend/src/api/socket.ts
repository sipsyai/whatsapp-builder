import { io, Socket } from 'socket.io-client';

// Production: use current origin, Development: localhost
const URL = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000');

// Get token from localStorage
const getAuthToken = () => localStorage.getItem('token');

// Create socket with authentication
const createAuthenticatedSocket = (namespace: string): Socket => {
    const socket = io(URL + namespace, {
        autoConnect: false,
        transports: ['websocket'],
        auth: {
            token: getAuthToken(),
        },
    });

    // Update token on reconnection attempt
    socket.on('connect_error', (error) => {
        if (error.message.includes('Authentication failed')) {
            console.error('Socket authentication failed:', error.message);
            // Token might be expired, let the app handle it
        }
    });

    return socket;
};

// Connect to /messages namespace as expected by backend
export const socket = createAuthenticatedSocket('/messages');

// Connect to /sessions namespace for chatbot session updates
export const sessionSocket = createAuthenticatedSocket('/sessions');

// Helper to update auth token on existing sockets (call after login)
export const updateSocketAuth = () => {
    const token = getAuthToken();
    socket.auth = { token };
    sessionSocket.auth = { token };
};

// Helper to reconnect sockets with new auth
export const reconnectSockets = () => {
    updateSocketAuth();
    if (socket.connected) {
        socket.disconnect();
        socket.connect();
    }
    if (sessionSocket.connected) {
        sessionSocket.disconnect();
        sessionSocket.connect();
    }
};
