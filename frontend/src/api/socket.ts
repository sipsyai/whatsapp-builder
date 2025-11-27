import { io } from 'socket.io-client';

// Production: use current origin, Development: localhost
const URL = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000');

// Connect to /messages namespace as expected by backend
export const socket = io(URL + '/messages', {
    autoConnect: false,
    transports: ['websocket'],
});

// Connect to /sessions namespace for chatbot session updates
export const sessionSocket = io(URL + '/sessions', {
    autoConnect: false,
    transports: ['websocket'],
});
