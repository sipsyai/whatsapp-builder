# Types

React Flow's type system provides comprehensive TypeScript definitions for building node-based UI applications. This reference documents all available types.

## Type Categories

### Connection Types
- **Align** - Values for NodeToolbar alignment positioning
- **Connection** - Basic minimal description of edges between nodes
- **ConnectionLineComponent** - Custom React component for connection line rendering
- **ConnectionLineComponentProps** - Props passed to custom connection line components
- **ConnectionLineType** - Style options for connection lines during edge creation
- **ConnectionMode** - Rules governing how node connections are established
- **ConnectionState** - Data describing an ongoing connection attempt

### Coordinate & Position Types
- **CoordinateExtent** - Two-point coordinate system representing bounds
- **Position** - Enum for edge and handle positioning (less precise than PanelPosition)
- **PanelPosition** - Component positioning in viewport corners
- **XYPosition** - Objects containing x and y coordinate values
- **Viewport** - Current display position and zoom level of the flow

### Node Types
- **Node** - Complete node description with all render requirements
- **NodeChange** - Union type representing various node state modifications
- **NodeConnection** - Connection including edgeId reference
- **NodeHandle** - Handle definition for server-side rendering
- **NodeMouseHandler** - Callback function for node mouse events
- **NodeOrigin** - Origin point determining node placement relative to coordinates
- **NodeProps** - Props received by custom node components
- **NodeTypes** - Custom node type definitions
- **InternalNode** - Extended Node type with internal React Flow properties

### Edge Types
- **Edge** - Complete edge description with rendering information
- **EdgeChange** - Union representing various edge modifications
- **EdgeMarker** - Marker configuration for edge endpoints
- **EdgeMouseHandler** - Callback for edge mouse events
- **EdgeProps** - Props passed to custom edge components
- **EdgeTypes** - Custom edge type definitions
- **DefaultEdgeOptions** - Default property values for new edges
- **MarkerType** - Available edge marker options

### Callback & Handler Types
- **OnConnect** - Triggered when new connections form
- **OnConnectStart** - Triggered when connection creation begins
- **OnConnectEnd** - Triggered when connection creation completes or cancels
- **OnReconnect** - Triggered when existing edges reconnect
- **OnNodesChange** - Handles node state updates
- **OnEdgesChange** - Handles edge state updates
- **OnNodeDrag** - Called during node dragging
- **OnMove** - Called during viewport movement
- **OnDelete** - Called when nodes or edges delete
- **OnBeforeDelete** - Called before deletion occurs
- **OnNodesDelete** - Specifically handles node deletion
- **OnEdgesDelete** - Specifically handles edge deletion
- **OnSelectionChangeFunc** - Called when selection changes
- **OnInit** - Called when ReactFlow initializes
- **OnError** - Error event callback

### Validation & Control Types
- **IsValidConnection** - Function determining connection validity
- **SelectionMode** - Selection behavior (full or partial)
- **SelectionDragHandler** - Handles drag events for selected nodes
- **ConnectionMode** - Connection establishment rules
- **DeleteElements** - Asynchronously deletes nodes and edges
- **OnBeforeDelete** - Pre-deletion validation callback

### Utility Types
- **Handle** - Handle attributes (id, position, type)
- **HandleConnection** - Connection with edgeId
- **Rect** - Rectangle with dimensions and position
- **SnapGrid** - Grid size for node snapping
- **ResizeParams** - NodeResizer event properties
- **FitViewOptions** - Viewport fitting customization
- **MiniMapNodeProps** - Minimap node properties
- **ReactFlowInstance** - Methods for querying and manipulating flow state
- **ReactFlowJsonObject** - JSON-serializable flow representation
- **KeyCode** - Keyboard key codes and combinations
- **BackgroundVariant** - Background pattern options (enum)
- **ColorMode** - Available color modes for ReactFlow
- **AriaLabelConfig** - ARIA label and description customization
- **ProOptions** - Attribution control settings

## Usage Pattern

These types integrate with React Flow's hooks and components to provide full TypeScript support throughout your application:

```typescript
import { Node, Edge, OnConnect } from 'reactflow';

const handleConnect: OnConnect = (connection) => {
  // Type-safe connection handling
};
```

Last updated November 5, 2025
