# Quick Start Guide - Node History Timeline

## 1. Import the Component

```typescript
import { NodeHistoryTimeline } from '@/features/sessions/components';
```

## 2. Prepare Your Data

```typescript
// Fetch flow structure from API
const flowData = await fetch(`/api/chatbots/${chatbotId}`).then(r => r.json());

// Track execution history (updated via WebSocket)
const [nodeHistory, setNodeHistory] = useState<string[]>([]);
const [currentNodeId, setCurrentNodeId] = useState<string>('');
const [isActive, setIsActive] = useState(true);
```

## 3. Add to Your Layout

```typescript
<div className="h-screen flex">
    {/* Your main content */}
    <div className="flex-1">
        {/* Session messages, chat, etc. */}
    </div>

    {/* Timeline sidebar */}
    <div className="w-96 border-l border-zinc-200 dark:border-[#23482f]">
        <NodeHistoryTimeline
            nodeHistory={nodeHistory}
            flowData={{
                nodes: flowData.nodes,
                edges: flowData.edges
            }}
            currentNodeId={currentNodeId}
            isActive={isActive}
        />
    </div>
</div>
```

## 4. Connect WebSocket Events

```typescript
useEffect(() => {
    const socket = io('http://localhost:3000');

    // Join session room
    socket.emit('joinSession', sessionId);

    // Listen for node execution
    socket.on('nodeExecuted', ({ nodeId }) => {
        setNodeHistory(prev => [...prev, nodeId]);
        setCurrentNodeId(nodeId);
    });

    // Handle session completion
    socket.on('sessionCompleted', () => {
        setIsActive(false);
    });

    return () => socket.disconnect();
}, [sessionId]);
```

## 5. That's It!

The timeline will:
- Auto-update as nodes execute
- Highlight the current node with pulsing animation
- Auto-scroll to keep current node visible
- Show execution progress in mini flow visualization
- Display checkmarks on completed nodes

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `nodeHistory` | `string[]` | Array of executed node IDs in chronological order |
| `flowData` | `{ nodes: Node[], edges: Edge[] }` | Complete ReactFlow structure |
| `currentNodeId` | `string` | ID of the currently executing node |
| `isActive` | `boolean` | Whether the session is still active/running |

## Visual States

### Node States in Mini Flow
- **Unexecuted**: Gray, faded, with dashed edges
- **Executed**: Green border, bright, with solid edges
- **Current**: Pulsing glow animation

### Timeline Item States
- **Completed**: Green checkmark icon
- **Current**: Pulsing dot + "Current" badge + auto-scroll

## Styling Notes

- Recommended sidebar width: `w-96` (384px)
- Height: Use `h-screen` or any container with defined height
- Works in both light and dark modes
- Responsive grid layout adjusts automatically

## Common Issues

### Issue: Timeline not updating
**Solution**: Ensure you're updating state correctly:
```typescript
setNodeHistory(prev => [...prev, newNodeId]); // ✅ Correct
setNodeHistory([...nodeHistory, newNodeId]);  // ❌ May cause issues
```

### Issue: Flow not visible
**Solution**: Ensure parent has defined height:
```typescript
<div className="h-screen"> {/* or h-full with parent height */}
    <NodeHistoryTimeline {...props} />
</div>
```

### Issue: Nodes not highlighting
**Solution**: Ensure node IDs match exactly:
```typescript
nodeHistory = ['start-1', 'msg-1']  // ✅
flowData.nodes = [{ id: 'start-1', ... }, { id: 'msg-1', ... }] // ✅
```

## Advanced Usage

### With Loading State

```typescript
{!flowData ? (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">Loading...</div>
    </div>
) : (
    <NodeHistoryTimeline {...props} />
)}
```

### With Error Handling

```typescript
try {
    const data = await fetchFlowData();
    setFlowData(data);
} catch (error) {
    console.error('Failed to load flow:', error);
    // Show error state
}
```

### Historical Session (No WebSocket)

```typescript
// For viewing completed sessions
<NodeHistoryTimeline
    nodeHistory={session.executedNodes}
    flowData={session.flow}
    currentNodeId={session.executedNodes[session.executedNodes.length - 1]}
    isActive={false}  // Session is completed
/>
```

## Performance Tips

1. **Memoize flow data** if it doesn't change:
   ```typescript
   const memoizedFlowData = useMemo(() => ({ nodes, edges }), [nodes, edges]);
   ```

2. **Debounce updates** for rapid execution:
   ```typescript
   const debouncedUpdate = useDebounce(updateHistory, 100);
   ```

3. **Lazy load** for large flows:
   ```typescript
   const [showTimeline, setShowTimeline] = useState(false);
   ```

## Examples

See `NodeHistoryTimelineExample.tsx` for complete working examples including:
- Basic integration
- WebSocket real-time updates
- Historical session view
- Error handling
- Loading states

## Support

For more details:
- Full documentation: `README.md`
- Feature overview: `FEATURES.md`
- Code examples: `NodeHistoryTimelineExample.tsx`

---

**Ready to use!** Just import, pass props, and it works.
