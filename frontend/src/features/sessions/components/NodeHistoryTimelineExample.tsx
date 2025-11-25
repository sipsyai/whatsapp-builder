/**
 * Example Usage of NodeHistoryTimeline Component
 *
 * This file demonstrates how to use the NodeHistoryTimeline component
 * in your session/chatbot execution views.
 */

import { NodeHistoryTimeline } from './NodeHistoryTimeline';
import type { Node, Edge } from '@xyflow/react';

// Example usage in a component
export const SessionDetailView = () => {
    // Example flow data - this would come from your API or state
    const flowData: { nodes: Node[]; edges: Edge[] } = {
        nodes: [
            {
                id: 'start-1',
                type: 'start',
                position: { x: 50, y: 50 },
                data: { label: 'Start Flow', type: 'start' }
            },
            {
                id: 'msg-1',
                type: 'message',
                position: { x: 250, y: 50 },
                data: { label: 'Welcome Message', type: 'message', content: 'Hello! How can I help you?' }
            },
            {
                id: 'question-1',
                type: 'question',
                position: { x: 450, y: 50 },
                data: {
                    label: 'Choose Option',
                    type: 'question',
                    questionType: 'buttons',
                    buttons: [
                        { id: 'btn-1', title: 'Option 1' },
                        { id: 'btn-2', title: 'Option 2' }
                    ]
                }
            },
            {
                id: 'condition-1',
                type: 'condition',
                position: { x: 650, y: 50 },
                data: { label: 'Check Response', type: 'condition', conditionVar: 'response', conditionOp: '==', conditionVal: 'yes' }
            },
            {
                id: 'msg-2',
                type: 'message',
                position: { x: 850, y: 50 },
                data: { label: 'Thank You', type: 'message', content: 'Thank you for your response!' }
            }
        ],
        edges: [
            { id: 'e1', source: 'start-1', target: 'msg-1' },
            { id: 'e2', source: 'msg-1', target: 'question-1' },
            { id: 'e3', source: 'question-1', target: 'condition-1' },
            { id: 'e4', source: 'condition-1', target: 'msg-2' }
        ]
    };

    // Example node execution history - this would be tracked as the chatbot executes
    // Each entry is a node ID that has been executed in order
    const nodeHistory = ['start-1', 'msg-1', 'question-1', 'condition-1'];

    // Current node being executed
    const currentNodeId = 'condition-1';

    // Whether the session is active
    const isActive = true;

    return (
        <div className="h-screen flex">
            {/* Main content area */}
            <div className="flex-1">
                {/* Your session content goes here */}
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                        Session Details
                    </h1>
                    {/* Session messages, etc. */}
                </div>
            </div>

            {/* Timeline sidebar */}
            <div className="w-96 border-l border-zinc-200 dark:border-[#23482f]">
                <NodeHistoryTimeline
                    nodeHistory={nodeHistory}
                    flowData={flowData}
                    currentNodeId={currentNodeId}
                    isActive={isActive}
                />
            </div>
        </div>
    );
};

/**
 * Integration Example with WebSocket/Real-time Updates
 */
export const RealTimeSessionView = () => {
    // In a real implementation, you would:
    // 1. Fetch flow data from API on mount
    // 2. Connect to WebSocket/Socket.IO
    // 3. Listen for execution events and update nodeHistory
    // 4. Update currentNodeId as nodes are executed

    /*
    useEffect(() => {
        const socket = io('http://localhost:3000');

        socket.on('nodeExecuted', (data: { nodeId: string }) => {
            setNodeHistory(prev => [...prev, data.nodeId]);
            setCurrentNodeId(data.nodeId);
        });

        socket.on('sessionCompleted', () => {
            setIsActive(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);
    */

    return <div>Real-time session view implementation</div>;
};
