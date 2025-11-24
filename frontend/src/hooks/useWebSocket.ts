import { useEffect, useState } from 'react';
import { socket } from '../api/socket';
import type { Message } from '../types/messages';

interface UseWebSocketReturn {
    connected: boolean;
    newMessage: Message | null;
    messageStatusUpdate: {
        messageId: string;
        status: string;
    } | null;
}

export function useWebSocket(): UseWebSocketReturn {
    const [connected, setConnected] = useState(false);
    const [newMessage, setNewMessage] = useState<Message | null>(null);
    const [messageStatusUpdate, setMessageStatusUpdate] = useState<{
        messageId: string;
        status: string;
    } | null>(null);

    useEffect(() => {
        // Connect to WebSocket
        socket.connect();

        // Connection events
        socket.on('connect', () => {
            console.log('WebSocket connected');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        });

        // Message events
        socket.on('message:new', (message: Message) => {
            console.log('New message received:', message);
            setNewMessage(message);
        });

        socket.on('message:status', (data: { messageId: string; status: string }) => {
            console.log('Message status update:', data);
            setMessageStatusUpdate(data);
        });

        // Cleanup
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('message:new');
            socket.off('message:status');
            socket.disconnect();
        };
    }, []);

    return { connected, newMessage, messageStatusUpdate };
}
