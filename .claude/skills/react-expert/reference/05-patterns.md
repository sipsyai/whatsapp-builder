# Advanced React Patterns

> **Project Context**: Common patterns used in WhatsApp Builder

## Table of Contents
1. [Compound Components](#compound-components)
2. [Render Props](#render-props)
3. [Custom Hooks Pattern](#custom-hooks-pattern)
4. [Provider Pattern](#provider-pattern)
5. [HOC (Higher-Order Components)](#hoc-higher-order-components)
6. [State Reducer Pattern](#state-reducer-pattern)

---

## Compound Components

### Basic Compound Components

```tsx
// ✅ PATTERN: Components that work together
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export const Tabs: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="tab-list">{children}</div>;
};

export const Tab: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const { activeTab, setActiveTab } = context;

  return (
    <button
      className={activeTab === id ? 'active' : ''}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
};

export const TabPanel: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  const { activeTab } = context;

  return activeTab === id ? <div>{children}</div> : null;
};

// Usage
<Tabs>
  <TabList>
    <Tab id="tab1">Tab 1</Tab>
    <Tab id="tab2">Tab 2</Tab>
  </TabList>
  <TabPanel id="tab1">Content 1</TabPanel>
  <TabPanel id="tab2">Content 2</TabPanel>
</Tabs>
```

---

## Render Props

### Basic Render Props

```tsx
// ✅ PATTERN: Function as children
interface MouseTrackerProps {
  children: (position: { x: number; y: number }) => React.ReactNode;
}

export const MouseTracker: React.FC<MouseTrackerProps> = ({ children }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return <>{children(position)}</>;
};

// Usage
<MouseTracker>
  {({ x, y }) => (
    <div>Mouse position: {x}, {y}</div>
  )}
</MouseTracker>
```

---

## Custom Hooks Pattern

### Extracting Logic to Hooks (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: useFlowCanvas hook
import { useState, useCallback, useMemo } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';

export function useFlowCanvas(options: UseFlowCanvasOptions) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const addNode = useCallback((node: Node) => {
    setNodes(prev => [...prev, node]);
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addNode,
    deleteNode,
  };
}

// Usage in component
export const FlowBuilder = () => {
  const {
    nodes,
    edges,
    addNode,
    deleteNode,
  } = useFlowCanvas({ screens });

  return <ReactFlow nodes={nodes} edges={edges} />;
};
```

---

## Provider Pattern

### Auth Provider (Project Example)

```tsx
// ✅ PROJECT PATTERN: Global state with Context + Custom Hook
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('token', response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// Usage
<AuthProvider>
  <App />
</AuthProvider>

// In components
const { user, login, logout } = useAuth();
```

---

## HOC (Higher-Order Components)

### Basic HOC

```tsx
// ✅ PATTERN: HOC for authentication
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <LoadingSpinner />;
    if (!isAuthenticated) return <Navigate to="/login" />;

    return <Component {...props} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
```

---

## State Reducer Pattern

### useReducer for Complex State

```tsx
// ✅ PATTERN: Complex state management
type FlowState = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isLoading: boolean;
};

type FlowAction =
  | { type: 'ADD_NODE'; payload: Node }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<Node> } }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean };

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'ADD_NODE':
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
      };
    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== action.payload),
        edges: state.edges.filter(
          e => e.source !== action.payload && e.target !== action.payload
        ),
      };
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === action.payload.id ? { ...n, ...action.payload.updates } : n
        ),
      };
    case 'SELECT_NODE':
      return { ...state, selectedNodeId: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export const FlowBuilder = () => {
  const [state, dispatch] = useReducer(flowReducer, {
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isLoading: false,
  });

  const addNode = (node: Node) => {
    dispatch({ type: 'ADD_NODE', payload: node });
  };

  const deleteNode = (nodeId: string) => {
    dispatch({ type: 'DELETE_NODE', payload: nodeId });
  };

  return <div>{/* UI */}</div>;
};
```

---

## Quick Reference

### When to Use Each Pattern

**Compound Components**: Components that share state and work together (Tabs, Accordion)

**Render Props**: Sharing logic while maintaining render flexibility

**Custom Hooks**: Extract and reuse stateful logic

**Provider Pattern**: Global state (auth, theme, language)

**HOC**: Add behavior to existing components (auth, logging)

**State Reducer**: Complex state with many transitions
