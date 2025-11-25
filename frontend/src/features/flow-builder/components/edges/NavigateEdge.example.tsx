/**
 * NavigateEdge Usage Examples
 *
 * Complete examples demonstrating NavigateEdge usage in different scenarios
 */

import { ReactFlow, type Node, type Edge } from '@xyflow/react';
import { NavigateEdge } from './NavigateEdge';
import type { NavigationEdgeData } from '../../types';
import '@xyflow/react/dist/style.css';

// Define custom edge types
const edgeTypes = {
    navigate: NavigateEdge,
};

// Example nodes for demonstration
const exampleNodes: Node[] = [
    {
        id: 'welcome',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Welcome Screen' },
    },
    {
        id: 'form',
        type: 'default',
        position: { x: 400, y: 100 },
        data: { label: 'Form Screen' },
    },
    {
        id: 'confirmation',
        type: 'default',
        position: { x: 700, y: 100 },
        data: { label: 'Confirmation' },
    },
    {
        id: 'loading',
        type: 'default',
        position: { x: 400, y: 300 },
        data: { label: 'Loading' },
    },
];

// ============================================================================
// Example 1: Basic Navigate Action (Blue)
// ============================================================================

export const BasicNavigateExample = () => {
    const edges: Edge<NavigationEdgeData>[] = [
        {
            id: 'edge-1',
            source: 'welcome',
            target: 'form',
            type: 'navigate',
            data: {
                action: {
                    name: 'navigate',
                    next: {
                        type: 'screen',
                        name: 'form',
                    },
                },
                label: 'Start Form',
                sourceScreenId: 'welcome',
                animated: true,
            },
        },
    ];

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={exampleNodes.slice(0, 2)}
                edges={edges}
                edgeTypes={edgeTypes}
                fitView
            />
        </div>
    );
};

// ============================================================================
// Example 2: Complete Action (Green)
// ============================================================================

export const CompleteActionExample = () => {
    const edges: Edge<NavigationEdgeData>[] = [
        {
            id: 'edge-1',
            source: 'confirmation',
            target: 'welcome',
            type: 'navigate',
            data: {
                action: {
                    name: 'complete',
                    payload: {
                        formData: '${data.form}',
                        userId: '${data.user_id}',
                    },
                },
                label: 'Submit & Finish',
                sourceScreenId: 'confirmation',
            },
        },
    ];

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={[exampleNodes[2], exampleNodes[0]]}
                edges={edges}
                edgeTypes={edgeTypes}
                fitView
            />
        </div>
    );
};

// ============================================================================
// Example 3: Data Exchange Action (Purple)
// ============================================================================

export const DataExchangeExample = () => {
    const edges: Edge<NavigationEdgeData>[] = [
        {
            id: 'edge-1',
            source: 'form',
            target: 'loading',
            type: 'navigate',
            data: {
                action: {
                    name: 'data_exchange',
                    payload: {
                        action: 'validate_form',
                        endpoint: '/api/validate',
                    },
                },
                label: 'Validate',
                sourceScreenId: 'form',
                sourceComponentId: 'submit-button',
                animated: true,
            },
        },
    ];

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={[exampleNodes[1], exampleNodes[3]]}
                edges={edges}
                edgeTypes={edgeTypes}
                fitView
            />
        </div>
    );
};

// ============================================================================
// Example 4: All Action Types Together
// ============================================================================

export const AllActionsExample = () => {
    const nodes: Node[] = [
        {
            id: 'start',
            type: 'default',
            position: { x: 100, y: 200 },
            data: { label: 'Start' },
        },
        {
            id: 'step1',
            type: 'default',
            position: { x: 300, y: 100 },
            data: { label: 'Step 1' },
        },
        {
            id: 'step2',
            type: 'default',
            position: { x: 300, y: 300 },
            data: { label: 'Step 2' },
        },
        {
            id: 'end',
            type: 'default',
            position: { x: 500, y: 200 },
            data: { label: 'End' },
        },
    ];

    const edges: Edge<NavigationEdgeData>[] = [
        // Navigate action (Blue)
        {
            id: 'edge-1',
            source: 'start',
            target: 'step1',
            type: 'navigate',
            data: {
                action: {
                    name: 'navigate',
                    next: { type: 'screen', name: 'step1' },
                },
                label: 'Next',
                sourceScreenId: 'start',
                animated: true,
            },
        },
        // Data exchange action (Purple)
        {
            id: 'edge-2',
            source: 'start',
            target: 'step2',
            type: 'navigate',
            data: {
                action: {
                    name: 'data_exchange',
                    payload: { action: 'fetch_data' },
                },
                label: 'Load Data',
                sourceScreenId: 'start',
                animated: true,
            },
        },
        // Complete action (Green)
        {
            id: 'edge-3',
            source: 'step1',
            target: 'end',
            type: 'navigate',
            data: {
                action: {
                    name: 'complete',
                },
                label: 'Finish',
                sourceScreenId: 'step1',
            },
        },
        // Complete action (Green)
        {
            id: 'edge-4',
            source: 'step2',
            target: 'end',
            type: 'navigate',
            data: {
                action: {
                    name: 'complete',
                },
                label: 'Done',
                sourceScreenId: 'step2',
            },
        },
    ];

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                edgeTypes={edgeTypes}
                fitView
            />
        </div>
    );
};

// ============================================================================
// Example 5: Custom Color Override
// ============================================================================

export const CustomColorExample = () => {
    const edges: Edge<NavigationEdgeData>[] = [
        {
            id: 'edge-1',
            source: 'welcome',
            target: 'form',
            type: 'navigate',
            data: {
                action: {
                    name: 'navigate',
                    next: { type: 'screen', name: 'form' },
                },
                label: 'Custom Orange',
                sourceScreenId: 'welcome',
                color: '#f59e0b', // Custom orange color
                animated: true,
            },
        },
    ];

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={exampleNodes.slice(0, 2)}
                edges={edges}
                edgeTypes={edgeTypes}
                fitView
            />
        </div>
    );
};

// ============================================================================
// Example 6: Without Label (Shows Action Name)
// ============================================================================

export const NoLabelExample = () => {
    const edges: Edge<NavigationEdgeData>[] = [
        {
            id: 'edge-1',
            source: 'welcome',
            target: 'form',
            type: 'navigate',
            data: {
                action: {
                    name: 'navigate',
                    next: { type: 'screen', name: 'form' },
                },
                // No label - will show "navigate"
                sourceScreenId: 'welcome',
            },
        },
    ];

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={exampleNodes.slice(0, 2)}
                edges={edges}
                edgeTypes={edgeTypes}
                fitView
            />
        </div>
    );
};

// ============================================================================
// Example 7: Complex Flow with Multiple Paths
// ============================================================================

export const ComplexFlowExample = () => {
    const nodes: Node[] = [
        { id: '1', position: { x: 100, y: 100 }, data: { label: 'Welcome' } },
        { id: '2', position: { x: 300, y: 50 }, data: { label: 'Login' } },
        { id: '3', position: { x: 300, y: 150 }, data: { label: 'Register' } },
        { id: '4', position: { x: 500, y: 50 }, data: { label: 'Dashboard' } },
        { id: '5', position: { x: 500, y: 150 }, data: { label: 'Verify Email' } },
        { id: '6', position: { x: 700, y: 100 }, data: { label: 'Success' } },
    ];

    const edges: Edge<NavigationEdgeData>[] = [
        {
            id: 'e1-2',
            source: '1',
            target: '2',
            type: 'navigate',
            data: {
                action: { name: 'navigate', next: { type: 'screen', name: '2' } },
                label: 'Login',
                sourceScreenId: '1',
            },
        },
        {
            id: 'e1-3',
            source: '1',
            target: '3',
            type: 'navigate',
            data: {
                action: { name: 'navigate', next: { type: 'screen', name: '3' } },
                label: 'Register',
                sourceScreenId: '1',
            },
        },
        {
            id: 'e2-4',
            source: '2',
            target: '4',
            type: 'navigate',
            data: {
                action: { name: 'data_exchange', payload: { action: 'authenticate' } },
                label: 'Auth',
                sourceScreenId: '2',
                animated: true,
            },
        },
        {
            id: 'e3-5',
            source: '3',
            target: '5',
            type: 'navigate',
            data: {
                action: { name: 'data_exchange', payload: { action: 'create_account' } },
                label: 'Create',
                sourceScreenId: '3',
                animated: true,
            },
        },
        {
            id: 'e4-6',
            source: '4',
            target: '6',
            type: 'navigate',
            data: {
                action: { name: 'complete' },
                label: 'Done',
                sourceScreenId: '4',
            },
        },
        {
            id: 'e5-6',
            source: '5',
            target: '6',
            type: 'navigate',
            data: {
                action: { name: 'complete' },
                label: 'Verified',
                sourceScreenId: '5',
            },
        },
    ];

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                edgeTypes={edgeTypes}
                fitView
            />
        </div>
    );
};

// ============================================================================
// Default Export - All Examples Component
// ============================================================================

export default function NavigateEdgeExamples() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
            <h1>NavigateEdge Examples</h1>

            <section>
                <h2>1. Basic Navigate (Blue)</h2>
                <div style={{ height: '400px', border: '1px solid #ccc' }}>
                    <BasicNavigateExample />
                </div>
            </section>

            <section>
                <h2>2. Complete Action (Green)</h2>
                <div style={{ height: '400px', border: '1px solid #ccc' }}>
                    <CompleteActionExample />
                </div>
            </section>

            <section>
                <h2>3. Data Exchange (Purple)</h2>
                <div style={{ height: '400px', border: '1px solid #ccc' }}>
                    <DataExchangeExample />
                </div>
            </section>

            <section>
                <h2>4. All Actions Together</h2>
                <div style={{ height: '400px', border: '1px solid #ccc' }}>
                    <AllActionsExample />
                </div>
            </section>

            <section>
                <h2>5. Custom Color</h2>
                <div style={{ height: '400px', border: '1px solid #ccc' }}>
                    <CustomColorExample />
                </div>
            </section>

            <section>
                <h2>6. Complex Flow</h2>
                <div style={{ height: '600px', border: '1px solid #ccc' }}>
                    <ComplexFlowExample />
                </div>
            </section>
        </div>
    );
}

/**
 * Color Reference:
 * - navigate: #3b82f6 (blue-500)
 * - complete: #22c55e (green-500)
 * - data_exchange: #8b5cf6 (purple-500)
 * - hover: #ef4444 (red-500)
 * - selected: #65C997 (primary)
 * - default: #71717a (zinc-500)
 */
