import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// Connect to /messages namespace as expected by backend
export const socket = io(URL + '/messages', {
    autoConnect: false,
    transports: ['websocket'],
});
