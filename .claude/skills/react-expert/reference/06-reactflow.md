# ReactFlow Integration Patterns

> **Project Context**: WhatsApp Builder uses @xyflow/react v12 for node-based flow editing

## Table of Contents
1. [Basic Setup](#basic-setup)
2. [Custom Nodes](#custom-nodes)
3. [Custom Edges](#custom-edges)
4. [State Management](#state-management)
5. [Drag and Drop](#drag-and-drop)
6. [Event Handling](#event-handling)
7. [TypeScript Types](#typescript-types)

---

## Basic Setup

### Installation

```bash
npm install @xyflow/react
```

### Basic ReactFlow Component

```tsx
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Node, Edge } from '@xyflow/react';

export const FlowCanvas = () => {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      type: 'default',
      position: { x: 0, y: 0 },
      data: { label: 'Node 1' },
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([]);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
```

### Using State Hooks (Recommended)

```tsx
import { ReactFlow, useNodesState, useEdgesState } from '@xyflow/react';

// ✅ PROJECT PATTERN: useNodesState and useEdgesState
export const FlowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
    />
  );
};
```

---

## Custom Nodes

### Custom Node Component (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Custom node with TypeScript
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface ScreenNodeData {
  screen: BuilderScreen;
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ScreenNode = memo<NodeProps<ScreenNodeData>>(({ data, selected }) => {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-white shadow-md
        ${selected ? 'border-blue-500' : 'border-gray-300'}
      `}
    >
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} />

      {/* Node Content */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined">check_box</span>
        <div>
          <div className="font-semibold">{data.label}</div>
          <div className="text-xs text-gray-500">
            {data.screen.components.length} components
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-2">
        <button onClick={data.onEdit} className="text-sm text-blue-600">
          Edit
        </button>
        <button onClick={data.onDelete} className="text-sm text-red-600">
          Delete
        </button>
      </div>

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

ScreenNode.displayName = 'ScreenNode';
```

### Registering Custom Node Types

```tsx
// ✅ PROJECT PATTERN: Node types registry
import { type NodeTypes } from '@xyflow/react';

const nodeTypes: NodeTypes = {
  screen: ScreenNode,
  start: StartNode,
  message: MessageNode,
  question: QuestionNode,
};

export const FlowCanvas = () => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
    />
  );
};
```

### Multiple Handles

```tsx
// ✅ PATTERN: Node with multiple connection points
export const QuestionNode = memo<NodeProps<QuestionNodeData>>(({ data }) => {
  return (
    <div className="custom-node">
      <Handle type="target" position={Position.Top} id="input" />

      <div>{data.question}</div>

      {/* Multiple output handles for different answers */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        style={{ top: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="no"
        style={{ top: '70%' }}
      />
    </div>
  );
});
```

---

## Custom Edges

### Custom Edge Component (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Custom edge with label
import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

export interface NavigationEdgeData {
  action: NavigateAction;
  sourceScreenId: string;
  label?: string;
}

export const NavigateEdge = memo<EdgeProps<NavigationEdgeData>>(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  }) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    return (
      <>
        <BaseEdge id={id} path={edgePath} />
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="px-2 py-1 bg-white border rounded text-xs">
              {data?.label || 'Navigate'}
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);
```

### Registering Custom Edge Types

```tsx
// ✅ PROJECT PATTERN: Edge types registry
import { type EdgeTypes } from '@xyflow/react';

const edgeTypes: EdgeTypes = {
  navigate: NavigateEdge,
  deletable: DeletableEdge,
};

const defaultEdgeOptions = {
  type: 'navigate',
  animated: false,
};

export const FlowCanvas = () => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
    />
  );
};
```

---

## State Management

### Using useNodesState and useEdgesState

```tsx
// ✅ PROJECT PATTERN: State management with ReactFlow hooks
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';

export const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ScreenNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<NavigationEdgeData>>([]);

  // Add node
  const addNode = useCallback((node: Node<ScreenNodeData>) => {
    setNodes(prev => [...prev, node]);
  }, [setNodes]);

  // Update node
  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes(prev =>
      prev.map(node => (node.id === nodeId ? { ...node, ...updates } : node))
    );
  }, [setNodes]);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev =>
      prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    );
  }, [setNodes, setEdges]);

  // Handle connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(prev => addEdge(connection, prev));
    },
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
    />
  );
};
```

### Syncing External State with ReactFlow

```tsx
// ✅ PROJECT PATTERN: Sync screens with nodes
export function useFlowCanvas({ screens }: { screens: BuilderScreen[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync nodes when screens change
  useMemo(() => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const updatedNodes = screens.map(screen => {
      const existingNode = nodeMap.get(screen.id);

      return {
        id: screen.id,
        type: 'screen',
        position: existingNode?.position || { x: 0, y: 0 },
        data: {
          screen,
          label: screen.title || screen.id,
        },
      } as Node<ScreenNodeData>;
    });

    // Only update if screens actually changed
    if (JSON.stringify(nodes.map(n => n.data.screen)) !== JSON.stringify(screens)) {
      setNodes(updatedNodes);
    }
  }, [screens, setNodes]);

  return { nodes, edges, onNodesChange, onEdgesChange };
}
```

---

## Drag and Drop

### Drag from Sidebar to Canvas (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Draggable component in sidebar
export const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'message')}
        className="draggable-node"
      >
        Message Node
      </div>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, 'question')}
        className="draggable-node"
      >
        Question Node
      </div>
    </aside>
  );
};

// ✅ PROJECT PATTERN: Drop handler in canvas
export const FlowCanvas = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      // Convert screen coordinates to flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: generateUUID(),
        type,
        position,
        data: { label: `New ${type}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
      />
    </div>
  );
};
```

---

## Event Handling

### Node Events

```tsx
// ✅ PATTERN: Handle node clicks
export const FlowCanvas = () => {
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node.id);
    setSelectedNode(node);
  }, []);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node double-clicked:', node.id);
    openNodeEditor(node);
  }, []);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node dragged to:', node.position);
    saveNodePosition(node.id, node.position);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onNodeDragStop={onNodeDragStop}
    />
  );
};
```

### Edge Events

```tsx
// ✅ PATTERN: Handle edge clicks
export const FlowCanvas = () => {
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    console.log('Edge clicked:', edge.id);
  }, []);

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => updateEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onEdgeClick={onEdgeClick}
      onEdgeUpdate={onEdgeUpdate}
    />
  );
};
```

### Connection Validation (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Validate connections before creating
export const FlowCanvas = () => {
  const isValidConnection = useCallback(
    (connection: Connection) => {
      // Prevent connecting to start node
      const targetNode = nodes.find(n => n.id === connection.target);
      if (targetNode?.type === 'start') {
        return false;
      }

      // Prevent self-connections
      if (connection.source === connection.target) {
        return false;
      }

      // Prevent duplicate connections
      const isDuplicate = edges.some(
        edge =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          edge.sourceHandle === connection.sourceHandle
      );

      return !isDuplicate;
    },
    [nodes, edges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      isValidConnection={isValidConnection}
    />
  );
};
```

---

## TypeScript Types

### Core Types

```tsx
import type {
  Node,
  Edge,
  Connection,
  NodeProps,
  EdgeProps,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
```

### Custom Node Data Types (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Type-safe node data
export interface ScreenNodeData {
  screen: BuilderScreen;
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface MessageNodeData {
  message: string;
  type: 'text' | 'image';
  onConfig?: () => void;
}

export interface QuestionNodeData {
  question: string;
  questionType: 'text' | 'buttons' | 'list';
  buttons?: string[];
  onConfig?: () => void;
}

// Typed nodes
type ScreenNode = Node<ScreenNodeData, 'screen'>;
type MessageNode = Node<MessageNodeData, 'message'>;
type QuestionNode = Node<QuestionNodeData, 'question'>;

// Union type for all node types
type FlowNode = ScreenNode | MessageNode | QuestionNode;
```

### Custom Edge Data Types (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Type-safe edge data
export interface NavigationEdgeData {
  action: NavigateAction;
  sourceScreenId: string;
  label?: string;
}

export interface NavigateAction {
  name: 'navigate';
  next: {
    type: 'screen';
    name: string;
  };
}

// Typed edge
type NavigationEdge = Edge<NavigationEdgeData, 'navigate'>;
```

---

## Advanced Patterns

### Auto Layout (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Auto-arrange nodes with dagre
import dagre from 'dagre';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: {
    direction?: LayoutDirection;
    nodeWidth?: number;
    nodeHeight?: number;
  } = {}
) {
  const {
    direction = 'TB',
    nodeWidth = 280,
    nodeHeight = 80,
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Usage
const handleAutoLayout = () => {
  const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges, {
    direction: 'TB',
  });
  setNodes(layoutedNodes);
};
```

### Fit View on Changes

```tsx
// ✅ PATTERN: Auto-fit view when nodes change
export const FlowCanvas = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      // Fit view with padding
      reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
    }
  }, [nodes, reactFlowInstance]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onInit={setReactFlowInstance}
      fitView
    />
  );
};
```

---

## Quick Reference

### Essential Props

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  defaultEdgeOptions={defaultEdgeOptions}
  onNodeClick={onNodeClick}
  onEdgeClick={onEdgeClick}
  isValidConnection={isValidConnection}
  fitView
  minZoom={0.5}
  maxZoom={2}
>
  <Background />
  <Controls />
  <MiniMap />
</ReactFlow>
```

### Common Imports

```tsx
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
```
