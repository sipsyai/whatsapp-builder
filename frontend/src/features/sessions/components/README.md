# Node History Timeline Components

Visual components for displaying chatbot execution flow and node history with ReactFlow integration.

## Components

### 1. NodeHistoryTimeline

Main component that displays a split view with flow visualization on top and execution timeline on bottom.

#### Props

```typescript
interface NodeHistoryTimelineProps {
    nodeHistory: string[];              // Array of executed node IDs in order
    flowData: {                         // Complete flow structure
        nodes: Node[];                  // ReactFlow nodes array
        edges: Edge[];                  // ReactFlow edges array
    };
    currentNodeId: string;              // ID of currently executing node
    isActive: boolean;                  // Whether session is active
}
```

#### Features

- **Split Layout**: Top half shows mini flow visualization, bottom half shows timeline list
- **Visual Execution State**: Nodes are color-coded by execution status
- **Current Node Highlight**: Pulsing animation on current node
- **Auto-scroll**: Automatically scrolls to current node
- **Status Indicators**: Checkmarks for completed nodes, pulse for current
- **Active Badge**: Shows "Active" badge when session is running

#### Usage

```tsx
import { NodeHistoryTimeline } from '@/features/sessions/components';

<NodeHistoryTimeline
    nodeHistory={['start-1', 'msg-1', 'question-1']}
    flowData={{ nodes, edges }}
    currentNodeId="question-1"
    isActive={true}
/>
```

### 2. MiniFlowVisualization

Read-only mini ReactFlow component for visualizing execution path.

#### Props

```typescript
interface MiniFlowVisualizationProps {
    nodes: Node[];                      // ReactFlow nodes
    edges: Edge[];                      // ReactFlow edges
    executedNodeIds: string[];          // IDs of executed nodes
    currentNodeId: string;              // Current node ID
}
```

#### Features

- **Read-only Mode**: Nodes cannot be dragged or connected
- **Execution Highlighting**:
  - Executed nodes: Green border, full opacity
  - Unexecuted nodes: Gray border, semi-transparent
  - Current node: Pulsing glow animation
- **Edge Styling**:
  - Executed path: Green solid line
  - Unexecuted path: Gray dashed line
- **Auto-fit**: Automatically fits all nodes in view
- **Simplified Nodes**: Compact node display with icons

#### Node Icons

| Node Type | Icon | Color |
|-----------|------|-------|
| START | play_arrow | Primary green |
| MESSAGE | chat | Blue |
| QUESTION | help | Orange |
| CONDITION | call_split | Purple |
| WHATSAPP_FLOW | description | Green |

#### Usage

```tsx
import { MiniFlowVisualization } from '@/features/sessions/components';

<MiniFlowVisualization
    nodes={flowNodes}
    edges={flowEdges}
    executedNodeIds={['start-1', 'msg-1']}
    currentNodeId="msg-1"
/>
```

## Styling & Animations

### Custom Animations

The components use custom CSS animations defined in `/frontend/src/styles/index.css`:

- `animate-pulse-glow`: Pulsing green glow effect for current node
- `animate-pulse-ring`: Expanding ring animation for current node indicator

### Color Scheme

- **Primary**: `#13ec5b` (bright green) - Used for highlights and active states
- **Background Light**: White/light gray for light mode
- **Background Dark**: `#0a160e` / `#193322` for dark mode
- **Borders**: `#23482f` for dark mode borders

## Integration Guide

### 1. Real-time Session Tracking

```tsx
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { NodeHistoryTimeline } from '@/features/sessions/components';

function SessionView({ sessionId, flowId }) {
    const [flowData, setFlowData] = useState(null);
    const [nodeHistory, setNodeHistory] = useState([]);
    const [currentNodeId, setCurrentNodeId] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Fetch flow data
    useEffect(() => {
        fetch(`/api/chatbots/${flowId}`)
            .then(res => res.json())
            .then(data => setFlowData({
                nodes: data.nodes,
                edges: data.edges
            }));
    }, [flowId]);

    // WebSocket connection
    useEffect(() => {
        const socket = io('http://localhost:3000');

        socket.emit('joinSession', sessionId);

        socket.on('nodeExecuted', ({ nodeId }) => {
            setNodeHistory(prev => [...prev, nodeId]);
            setCurrentNodeId(nodeId);
        });

        socket.on('sessionCompleted', () => {
            setIsActive(false);
        });

        return () => socket.disconnect();
    }, [sessionId]);

    if (!flowData) return <div>Loading...</div>;

    return (
        <div className="h-screen flex">
            <div className="flex-1">
                {/* Session content */}
            </div>
            <div className="w-96 border-l">
                <NodeHistoryTimeline
                    nodeHistory={nodeHistory}
                    flowData={flowData}
                    currentNodeId={currentNodeId}
                    isActive={isActive}
                />
            </div>
        </div>
    );
}
```

### 2. Historical Session View

For viewing completed sessions:

```tsx
import { NodeHistoryTimeline } from '@/features/sessions/components';

function CompletedSessionView({ session }) {
    return (
        <div className="h-screen flex">
            <div className="flex-1">
                {/* Session messages/data */}
            </div>
            <div className="w-96 border-l">
                <NodeHistoryTimeline
                    nodeHistory={session.executionHistory}
                    flowData={{
                        nodes: session.flow.nodes,
                        edges: session.flow.edges
                    }}
                    currentNodeId={session.executionHistory[session.executionHistory.length - 1]}
                    isActive={false}
                />
            </div>
        </div>
    );
}
```

### 3. Standalone Mini Visualization

Use the mini visualization component separately:

```tsx
import { MiniFlowVisualization } from '@/features/sessions/components';

function FlowPreview({ flow, executedNodes, currentNode }) {
    return (
        <div className="h-64 border rounded-lg overflow-hidden">
            <MiniFlowVisualization
                nodes={flow.nodes}
                edges={flow.edges}
                executedNodeIds={executedNodes}
                currentNodeId={currentNode}
            />
        </div>
    );
}
```

## Performance Notes

- **ReactFlowProvider**: Each MiniFlowVisualization is wrapped in its own provider
- **Memoization**: Consider wrapping in `React.memo()` for large flows
- **Auto-fit**: Uses debounced fitView to prevent excessive recalculations
- **Scroll Behavior**: Timeline auto-scroll uses smooth behavior for better UX

## Dependencies

- `@xyflow/react` (^12.3.5): ReactFlow library
- Material Symbols: For icons (already included in project)

## File Structure

```
/features/sessions/components/
├── NodeHistoryTimeline.tsx           # Main component
├── MiniFlowVisualization.tsx         # Mini flow visualization
├── NodeHistoryTimelineExample.tsx    # Usage examples
├── index.ts                          # Exports
└── README.md                         # This file
```

## Browser Support

- Modern browsers with CSS Grid support
- Flexbox support required
- CSS animations supported in all modern browsers

## Accessibility

- Semantic HTML structure
- Color contrast meets WCAG AA standards
- Keyboard navigation supported through ReactFlow
- Screen reader friendly labels (can be enhanced)

## Future Enhancements

- [ ] Add node detail tooltips on hover
- [ ] Support for branching path visualization
- [ ] Export timeline as image
- [ ] Playback controls for timeline
- [ ] Performance metrics per node
- [ ] Error state visualization
- [ ] Click node to jump to message in conversation
