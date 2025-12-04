/**
 * Test Session Socket
 *
 * This module provides socket connection management for chatbot test sessions.
 * It uses the testSessionSocket from the main socket module and provides
 * additional utilities for test-specific operations.
 */

import { testSessionSocket, updateSocketAuth } from './socket';
import type { Socket } from 'socket.io-client';

// Re-export the test session socket instance
export { testSessionSocket };

// Connection state helpers
export const isConnected = (): boolean => testSessionSocket.connected;

export const getSocketId = (): string | undefined => testSessionSocket.id;

// Connection management
export const connect = (): void => {
    if (!testSessionSocket.connected) {
        // Update auth token from localStorage before connecting
        // This ensures we have the latest token after user login
        updateSocketAuth();
        testSessionSocket.connect();
    }
};

export const disconnect = (): void => {
    if (testSessionSocket.connected) {
        testSessionSocket.disconnect();
    }
};

// Event emitters for test sessions
export const joinTestSession = (sessionId: string): void => {
    testSessionSocket.emit('test:join', { testSessionId: sessionId });
};

export const leaveTestSession = (sessionId: string): void => {
    testSessionSocket.emit('test:leave', { testSessionId: sessionId });
};

export const sendTestMessage = (
    sessionId: string,
    message: string,
    buttonId?: string,
    listRowId?: string
): void => {
    testSessionSocket.emit('test:send-message', {
        testSessionId: sessionId,
        message,
        buttonId,
        listRowId,
    });
};

// Type-safe socket accessor
export const getTestSocket = (): Socket => testSessionSocket;
