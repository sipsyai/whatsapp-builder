import { useEffect, useCallback, useRef, useState } from 'react';
import {
    testSessionSocket,
    connect,
    disconnect,
    joinTestSession,
    leaveTestSession,
    sendTestMessage,
} from '../../../api/testSocket';
import type {
    TestMessage,
    NodeExecutionResult,
} from '../types';

export interface UseTesterSocketOptions {
    /** Called when a new message is received */
    onMessage?: (message: TestMessage) => void;
    /** Called when a node is executed */
    onNodeExecuted?: (nodeId: string, result: NodeExecutionResult) => void;
    /** Called when variables are updated */
    onVariablesUpdated?: (variables: Record<string, unknown>) => void;
    /** Called when the bot is waiting for user input */
    onWaitingInput?: (
        inputType: 'text' | 'button' | 'list' | 'location' | 'media',
        options?: {
            buttons?: Array<{ id: string; title: string }>;
            listSections?: Array<{
                title: string;
                rows: Array<{ id: string; title: string; description?: string }>;
            }>;
        }
    ) => void;
    /** Called when the test session is started */
    onStarted?: (sessionId: string, chatbotId: string, chatbotName: string) => void;
    /** Called when the test session is completed */
    onCompleted?: (
        reason: 'flow-ended' | 'user-ended' | 'timeout' | 'error',
        summary: {
            totalNodes: number;
            executedNodes: number;
            totalMessages: number;
            duration: number;
        }
    ) => void;
    /** Called when an error occurs */
    onError?: (error: string, nodeId?: string) => void;
    /** Called when connection status changes */
    onConnectionChange?: (connected: boolean) => void;
}

export interface UseTesterSocketReturn {
    /** Whether the socket is connected */
    isConnected: boolean;
    /** Connect to the socket server */
    connect: () => void;
    /** Disconnect from the socket server */
    disconnect: () => void;
    /** Join a test session room */
    joinSession: (sessionId: string) => void;
    /** Leave a test session room */
    leaveSession: (sessionId: string) => void;
    /** Send a message in the test session */
    sendMessage: (sessionId: string, message: string, buttonId?: string, listRowId?: string) => void;
    /** Current session ID if joined */
    currentSessionId: string | null;
}

export function useTesterSocket(options: UseTesterSocketOptions = {}): UseTesterSocketReturn {
    const [isConnected, setIsConnected] = useState(testSessionSocket.connected);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Use refs to avoid stale closures in event handlers
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Connection event handlers
    useEffect(() => {
        const handleConnect = () => {
            setIsConnected(true);
            optionsRef.current.onConnectionChange?.(true);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            optionsRef.current.onConnectionChange?.(false);
        };

        const handleConnectError = (error: Error) => {
            console.error('[TesterSocket] Connection error:', error.message);
            optionsRef.current.onError?.(error.message);
        };

        testSessionSocket.on('connect', handleConnect);
        testSessionSocket.on('disconnect', handleDisconnect);
        testSessionSocket.on('connect_error', handleConnectError);

        // Set initial state
        setIsConnected(testSessionSocket.connected);

        return () => {
            testSessionSocket.off('connect', handleConnect);
            testSessionSocket.off('disconnect', handleDisconnect);
            testSessionSocket.off('connect_error', handleConnectError);
        };
    }, []);

    // Test session event handlers
    useEffect(() => {
        const handleStarted = (data: {
            sessionId: string;
            chatbotId: string;
            chatbotName: string;
        }) => {
            optionsRef.current.onStarted?.(data.sessionId, data.chatbotId, data.chatbotName);
        };

        const handleMessage = (message: TestMessage) => {
            optionsRef.current.onMessage?.(message);
        };

        const handleNodeExecuted = (result: NodeExecutionResult) => {
            optionsRef.current.onNodeExecuted?.(result.nodeId, result);
        };

        const handleVariablesUpdated = (data: {
            sessionId: string;
            variables: Record<string, unknown>;
        }) => {
            optionsRef.current.onVariablesUpdated?.(data.variables);
        };

        const handleWaitingInput = (data: {
            sessionId: string;
            inputType: 'text' | 'button' | 'list' | 'location' | 'media';
            options?: {
                buttons?: Array<{ id: string; title: string }>;
                listSections?: Array<{
                    title: string;
                    rows: Array<{ id: string; title: string; description?: string }>;
                }>;
            };
        }) => {
            optionsRef.current.onWaitingInput?.(data.inputType, data.options);
        };

        const handleCompleted = (data: {
            sessionId: string;
            reason: 'flow-ended' | 'user-ended' | 'timeout' | 'error';
            summary: {
                totalNodes: number;
                executedNodes: number;
                totalMessages: number;
                duration: number;
            };
        }) => {
            optionsRef.current.onCompleted?.(data.reason, data.summary);
        };

        const handleError = (data: {
            sessionId: string;
            error: string;
            nodeId?: string;
        }) => {
            optionsRef.current.onError?.(data.error, data.nodeId);
        };

        testSessionSocket.on('test:started', handleStarted);
        testSessionSocket.on('test:message', handleMessage);
        testSessionSocket.on('test:node-executed', handleNodeExecuted);
        testSessionSocket.on('test:variables-updated', handleVariablesUpdated);
        testSessionSocket.on('test:waiting-input', handleWaitingInput);
        testSessionSocket.on('test:completed', handleCompleted);
        testSessionSocket.on('test:error', handleError);

        return () => {
            testSessionSocket.off('test:started', handleStarted);
            testSessionSocket.off('test:message', handleMessage);
            testSessionSocket.off('test:node-executed', handleNodeExecuted);
            testSessionSocket.off('test:variables-updated', handleVariablesUpdated);
            testSessionSocket.off('test:waiting-input', handleWaitingInput);
            testSessionSocket.off('test:completed', handleCompleted);
            testSessionSocket.off('test:error', handleError);
        };
    }, []);

    // Memoized action handlers
    const handleConnect = useCallback(() => {
        connect();
    }, []);

    const handleDisconnect = useCallback(() => {
        if (currentSessionId) {
            leaveTestSession(currentSessionId);
            setCurrentSessionId(null);
        }
        disconnect();
    }, [currentSessionId]);

    const handleJoinSession = useCallback((sessionId: string) => {
        // Leave previous session if any
        if (currentSessionId && currentSessionId !== sessionId) {
            leaveTestSession(currentSessionId);
        }

        // Connect if not connected
        if (!testSessionSocket.connected) {
            connect();
        }

        joinTestSession(sessionId);
        setCurrentSessionId(sessionId);
    }, [currentSessionId]);

    const handleLeaveSession = useCallback((sessionId: string) => {
        leaveTestSession(sessionId);
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
        }
    }, [currentSessionId]);

    const handleSendMessage = useCallback((
        sessionId: string,
        message: string,
        buttonId?: string,
        listRowId?: string
    ) => {
        sendTestMessage(sessionId, message, buttonId, listRowId);
    }, []);

    return {
        isConnected,
        connect: handleConnect,
        disconnect: handleDisconnect,
        joinSession: handleJoinSession,
        leaveSession: handleLeaveSession,
        sendMessage: handleSendMessage,
        currentSessionId,
    };
}
