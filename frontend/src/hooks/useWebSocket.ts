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
        socket.on('message:received', (data: any) => {
            console.log('New message received:', data);

            // Transform MessageReceivedDto from backend to Message interface
            const message: Message = {
                id: data.messageId,              // Backend sends 'messageId', we need 'id'
                conversationId: data.conversationId,
                senderId: data.senderId,
                type: data.type,
                content: data.content,
                status: data.status,
                timestamp: data.timestamp,
                createdAt: data.timestamp,       // Use timestamp for createdAt
                updatedAt: data.timestamp,       // Use timestamp for updatedAt
            };

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
            socket.off('message:received');
            socket.off('message:status');
            socket.disconnect();
        };
    }, []);

    return { connected, newMessage, messageStatusUpdate };
}
