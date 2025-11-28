# React Performance Optimization

> **Project Context**: WhatsApp Builder uses React.memo, useCallback, useMemo for optimal performance with complex node-based UIs

## Table of Contents
1. [React.memo](#reactmemo)
2. [useCallback for Functions](#usecallback-for-functions)
3. [useMemo for Values](#usememo-for-values)
4. [Code Splitting](#code-splitting)
5. [Virtualization](#virtualization)
6. [Common Performance Pitfalls](#common-performance-pitfalls)
7. [Profiling](#profiling)

---

## React.memo

### Basic Memoization

```tsx
// ✅ PATTERN: Memoize component to prevent unnecessary re-renders
import { memo } from 'react';

interface UserCardProps {
  user: User;
  onSelect: (id: string) => void;
}

// Without memo: Re-renders whenever parent re-renders
export const UserCard: React.FC<UserCardProps> = ({ user, onSelect }) => {
  console.log('UserCard rendered');
  return (
    <div onClick={() => onSelect(user.id)}>
      {user.name}
    </div>
  );
};

// With memo: Only re-renders when props change
export const UserCard = memo<UserCardProps>(({ user, onSelect }) => {
  console.log('UserCard rendered');
  return (
    <div onClick={() => onSelect(user.id)}>
      {user.name}
    </div>
  );
});
```

### Custom Comparison Function

```tsx
// ✅ PATTERN: Custom prop comparison
interface MessageProps {
  message: Message;
  timestamp: Date;
  onDelete: (id: string) => void;
}

export const Message = memo<MessageProps>(
  ({ message, onDelete }) => {
    return (
      <div>
        <p>{message.content}</p>
        <button onClick={() => onDelete(message.id)}>Delete</button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    // Return false if props changed (re-render)
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content
    );
    // onDelete is ignored in comparison (assumed stable)
  }
);
```

### When to Use React.memo

```tsx
// ✅ USE React.memo when:

// 1. Component renders often with same props
const ExpensiveList = memo(({ items }) => {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});

// 2. Component receives stable props
const Sidebar = memo(() => {
  return <nav>{/* Static navigation */}</nav>;
});

// 3. Component is large/complex
const DataVisualization = memo(({ data }) => {
  return <ComplexChart data={data} />;
});

// ❌ DON'T use React.memo when:

// 1. Props change frequently
const Counter = ({ count }) => <div>{count}</div>;
// No need for memo, count changes all the time

// 2. Component is simple/fast
const Label = ({ text }) => <span>{text}</span>;
// Memo overhead > render cost

// 3. Props are always new objects/functions
const BadExample = memo(({ config }) => <div>{config.value}</div>);
// Parent creates new config object each render, memo is useless
```

---

## useCallback for Functions

### Project Pattern: Node Handlers

```tsx
// ✅ PROJECT PATTERN: Memoized node operations
export const BuilderPage = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Memoize deleteNode to prevent child re-renders
  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'start-1') {
      alert('Cannot delete the Start node');
      return;
    }

    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== nodeId && edge.target !== nodeId
    ));
  }, [setNodes, setEdges]); // setState functions are stable

  // Add handlers to nodes
  const nodesWithHandler = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        onDelete: () => deleteNode(n.id) // deleteNode is memoized
      }
    }));
  }, [nodes, deleteNode]);

  return <ReactFlow nodes={nodesWithHandler} />;
};
```

### Auth Context Pattern (Project Example)

```tsx
// ✅ PROJECT PATTERN: Memoize context functions
export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);

  // Memoize login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      setToken(response.accessToken);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies

  // Memoize logout function
  const logout = useCallback(() => {
    authApi.logout();
    setToken(null);
    setUser(null);
  }, []); // No dependencies

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### useCallback Best Practices

```tsx
// ✅ GOOD: Callback with dependencies
const [userId, setUserId] = useState('');
const fetchUser = useCallback(async () => {
  const data = await api.getUser(userId);
  setUser(data);
}, [userId]); // userId is a dependency

// ✅ GOOD: Callback with no dependencies
const handleClick = useCallback(() => {
  console.log('Clicked!');
}, []);

// ✅ GOOD: Callback using functional setState
const increment = useCallback(() => {
  setCount(prev => prev + 1); // No need to add count to deps
}, []);

// ❌ AVOID: Missing dependencies
const handleUpdate = useCallback(() => {
  updateUser(userId, data); // userId and data should be in deps
}, []); // Missing dependencies!

// ❌ AVOID: Unnecessary useCallback
const handleClick = useCallback(() => {
  console.log('Simple click');
}, []);
// If not passed to memoized child, no benefit
```

---

## useMemo for Values

### Expensive Calculations

```tsx
// ✅ PATTERN: Memoize expensive calculations
export const Dashboard = ({ transactions }) => {
  // Expensive calculation only runs when transactions change
  const statistics = useMemo(() => {
    console.log('Calculating statistics...');
    return {
      total: transactions.reduce((sum, t) => sum + t.amount, 0),
      count: transactions.length,
      average: transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
        : 0,
      byCategory: groupByCategory(transactions), // Complex operation
    };
  }, [transactions]);

  return (
    <div>
      <p>Total: {statistics.total}</p>
      <p>Count: {statistics.count}</p>
      <p>Average: {statistics.average}</p>
    </div>
  );
};
```

### Filtering and Sorting

```tsx
// ✅ PROJECT PATTERN: Memoize filtered/sorted data
export const UserList = ({ users, searchQuery, sortBy }) => {
  const filteredAndSortedUsers = useMemo(() => {
    let result = users;

    // Filter
    if (searchQuery) {
      result = result.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return a.createdAt - b.createdAt;
      return 0;
    });

    return result;
  }, [users, searchQuery, sortBy]);

  return (
    <div>
      {filteredAndSortedUsers.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

### Stable Object References

```tsx
// ✅ PATTERN: Stable object reference for useEffect dependency
export const Chart = ({ dataPoints, options }) => {
  // Create stable config object
  const chartConfig = useMemo(() => ({
    data: dataPoints,
    width: options.width,
    height: options.height,
    theme: options.theme,
  }), [dataPoints, options.width, options.height, options.theme]);

  useEffect(() => {
    // Only re-run when chartConfig actually changes
    initChart(chartConfig);
  }, [chartConfig]);

  return <div id="chart" />;
};
```

### useMemo Best Practices

```tsx
// ✅ USE useMemo when:

// 1. Expensive calculations
const expensiveValue = useMemo(() => {
  return performExpensiveCalculation(data);
}, [data]);

// 2. Creating objects/arrays used in dependencies
const config = useMemo(() => ({ x: 1, y: 2 }), []);
useEffect(() => {
  // Won't run on every render
}, [config]);

// 3. Filtering/sorting large lists
const filtered = useMemo(() => items.filter(fn), [items]);

// ❌ DON'T use useMemo for:

// 1. Simple calculations
const doubled = count * 2; // Don't memoize this

// 2. JSX elements (use React.memo instead)
const element = useMemo(() => <Component />, []); // Wrong approach

// 3. Everything (creates overhead)
const name = useMemo(() => user.name, [user]); // Unnecessary
```

---

## Code Splitting

### React.lazy and Suspense

```tsx
import { lazy, Suspense } from 'react';

// ✅ PATTERN: Lazy load components
const FlowBuilder = lazy(() => import('./features/flow-builder/FlowBuilderPage'));
const ChatPage = lazy(() => import('./features/chat/ChatPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

export const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/builder" element={<FlowBuilder />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
};
```

### Route-Based Code Splitting

```tsx
// ✅ PATTERN: Split by route
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Eagerly loaded (small, critical)
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';

// Lazy loaded (large, non-critical)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

export const App = () => {
  return (
    <BrowserRouter>
      <Header />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
```

### Component-Based Code Splitting

```tsx
// ✅ PATTERN: Split heavy components
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./components/HeavyChart'));
const PDFViewer = lazy(() => import('./components/PDFViewer'));

export const Dashboard = () => {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <h1>Dashboard</h1>

      <button onClick={() => setShowChart(true)}>
        Show Chart
      </button>

      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart data={data} />
        </Suspense>
      )}
    </div>
  );
};
```

---

## Virtualization

### React Window (Large Lists)

```tsx
import { FixedSizeList } from 'react-window';

// ✅ PATTERN: Virtualize long lists
interface VirtualizedListProps {
  items: User[];
}

export const VirtualizedUserList: React.FC<VirtualizedListProps> = ({ items }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <UserCard user={items[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};

// Before: Rendering 10,000 items = SLOW
// After: Rendering ~10 visible items = FAST
```

### Variable Size List

```tsx
import { VariableSizeList } from 'react-window';

// ✅ PATTERN: Variable height items
export const VirtualizedMessageList = ({ messages }) => {
  const listRef = useRef<VariableSizeList>(null);

  const getItemSize = (index: number) => {
    const message = messages[index];
    // Calculate height based on content
    return message.content.length > 100 ? 120 : 60;
  };

  const Row = ({ index, style }) => (
    <div style={style}>
      <Message message={messages[index]} />
    </div>
  );

  return (
    <VariableSizeList
      ref={listRef}
      height={600}
      itemCount={messages.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
};
```

---

## Common Performance Pitfalls

### Pitfall 1: Creating Functions in Render

```tsx
// ❌ BAD: New function on every render
export const List = ({ items }) => {
  return (
    <div>
      {items.map(item => (
        <Item
          key={item.id}
          onClick={() => handleClick(item.id)} // New function every render!
        />
      ))}
    </div>
  );
};

// ✅ GOOD: Memoized handler
export const List = ({ items }) => {
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, []);

  return (
    <div>
      {items.map(item => (
        <Item key={item.id} onClick={() => handleClick(item.id)} />
      ))}
    </div>
  );
};
```

### Pitfall 2: Creating Objects in Render

```tsx
// ❌ BAD: New object every render
export const Chart = ({ data }) => {
  return (
    <ChartComponent
      data={data}
      config={{ width: 500, height: 300 }} // New object!
    />
  );
};

// ✅ GOOD: Memoize object
export const Chart = ({ data }) => {
  const config = useMemo(() => ({ width: 500, height: 300 }), []);

  return <ChartComponent data={data} config={config} />;
};

// ✅ BETTER: Extract constant
const CHART_CONFIG = { width: 500, height: 300 };

export const Chart = ({ data }) => {
  return <ChartComponent data={data} config={CHART_CONFIG} />;
};
```

### Pitfall 3: Unnecessary State

```tsx
// ❌ BAD: Storing derived state
export const ShoppingCart = ({ items }) => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(items.reduce((sum, item) => sum + item.price, 0));
  }, [items]);

  return <div>Total: {total}</div>;
};

// ✅ GOOD: Calculate on render (fast enough)
export const ShoppingCart = ({ items }) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return <div>Total: {total}</div>;
};

// ✅ GOOD: Memoize if expensive
export const ShoppingCart = ({ items }) => {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );
  return <div>Total: {total}</div>;
};
```

### Pitfall 4: Large Component Trees

```tsx
// ❌ BAD: Massive component
export const Dashboard = () => {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  // ... 20 more state variables

  return (
    <div>
      {/* 500 lines of JSX */}
    </div>
  );
};

// ✅ GOOD: Split into smaller components
export const Dashboard = () => {
  return (
    <div>
      <DashboardHeader />
      <DashboardStats />
      <DashboardCharts />
      <DashboardTable />
    </div>
  );
};

// Each component manages its own state
const DashboardStats = () => {
  const [stats, setStats] = useState();
  return <div>{/* Stats UI */}</div>;
};
```

---

## Profiling

### React DevTools Profiler

```tsx
// 1. Wrap component in Profiler
import { Profiler } from 'react';

export const App = () => {
  const onRenderCallback = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  };

  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Dashboard />
    </Profiler>
  );
};

// 2. Use React DevTools browser extension
// - Record performance
// - See what components re-rendered
// - Identify slow components
```

### Performance Measurement

```tsx
// ✅ Measure render time
export const HeavyComponent = () => {
  useEffect(() => {
    const start = performance.now();

    return () => {
      const end = performance.now();
      console.log(`Render took ${end - start}ms`);
    };
  });

  return <div>{/* Heavy rendering */}</div>;
};
```

---

## Quick Performance Checklist

- [ ] Use React.memo for components that render often with same props
- [ ] Use useCallback for functions passed to memoized children
- [ ] Use useMemo for expensive calculations
- [ ] Avoid creating new objects/arrays in render
- [ ] Split code by route for faster initial load
- [ ] Virtualize long lists (>100 items)
- [ ] Profile with React DevTools before optimizing
- [ ] Don't optimize prematurely - measure first
- [ ] Keep components small and focused
- [ ] Use stable keys for lists

---

## Performance Optimization Decision Tree

```
Is component slow?
├─ No → Don't optimize yet
└─ Yes
   ├─ Does it re-render unnecessarily?
   │  ├─ Yes → Use React.memo
   │  └─ No
   │     ├─ Is render expensive?
   │     │  ├─ Yes → Split into smaller components
   │     │  └─ No
   │     │     ├─ Is it a long list?
   │     │     │  ├─ Yes → Use virtualization
   │     │     │  └─ No
   │     │     │     ├─ Is calculation expensive?
   │     │     │     │  ├─ Yes → Use useMemo
   │     │     │     │  └─ No → Profile deeper
```
