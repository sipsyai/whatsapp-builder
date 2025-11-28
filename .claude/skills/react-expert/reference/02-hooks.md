# React Hooks Comprehensive Reference

> **Project Context**: WhatsApp Builder heavily uses hooks for state management, side effects, and performance optimization

## Table of Contents
1. [useState](#usestate)
2. [useEffect](#useeffect)
3. [useCallback](#usecallback)
4. [useMemo](#usememo)
5. [useRef](#useref)
6. [useContext](#usecontext)
7. [Custom Hooks](#custom-hooks)
8. [Hook Rules](#hook-rules)

---

## useState

### Basic Usage

```tsx
import { useState } from 'react';

export const Counter = () => {
  // ✅ BASIC: Simple state
  const [count, setCount] = useState(0);

  // ✅ WITH TYPE: Explicit type annotation
  const [user, setUser] = useState<User | null>(null);

  // ✅ ARRAY STATE: Managing lists
  const [items, setItems] = useState<string[]>([]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(prev => prev + 1)}>Increment (functional)</button>
    </div>
  );
};
```

### Lazy Initialization (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Initialize from localStorage
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  // ...
}
```

**Why lazy initialization?**
- Expensive computation runs only once
- Prevents reading localStorage on every render
- Better performance

### Functional Updates

```tsx
// ❌ WRONG: Using current state directly (can cause issues)
const handleIncrement = () => {
  setCount(count + 1);
  setCount(count + 1); // Still increments by 1, not 2!
};

// ✅ CORRECT: Functional update
const handleIncrement = () => {
  setCount(prev => prev + 1);
  setCount(prev => prev + 1); // Now increments by 2
};
```

### Complex State Updates

```tsx
// ✅ PROJECT PATTERN: Updating arrays immutably
const [nodes, setNodes] = useState<Node[]>([]);

// Add item
const addNode = (node: Node) => {
  setNodes(prev => [...prev, node]);
};

// Update item
const updateNode = (nodeId: string, updates: Partial<Node>) => {
  setNodes(prev =>
    prev.map(node => (node.id === nodeId ? { ...node, ...updates } : node))
  );
};

// Delete item
const deleteNode = (nodeId: string) => {
  setNodes(prev => prev.filter(node => node.id !== nodeId));
};

// Reorder items
const reorderComponents = (screenId: string, newOrder: string[]) => {
  setNodes(prev => {
    const newNodes = [...prev];
    // Reordering logic
    return newNodes;
  });
};
```

---

## useEffect

### Basic Side Effects

```tsx
import { useEffect } from 'react';

export const UserProfile = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState<User | null>(null);

  // ✅ BASIC: Run on mount and when userId changes
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
};
```

### Cleanup Pattern (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Cleanup subscriptions
useEffect(() => {
  const socket = io('http://localhost:3000');

  socket.on('message', handleMessage);
  socket.on('update', handleUpdate);

  // Cleanup function
  return () => {
    socket.off('message', handleMessage);
    socket.off('update', handleUpdate);
    socket.disconnect();
  };
}, []);
```

### Auto-Scroll Effect (Project Example)

```tsx
// ✅ PROJECT PATTERN: Scroll to bottom on messages change
export const ChatWindow = ({ conversation }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]); // Re-run when messages change

  return (
    <div>
      {conversation.messages.map(msg => <Message key={msg.id} {...msg} />)}
      <div ref={messagesEndRef} />
    </div>
  );
};
```

### Async Operations in useEffect

```tsx
// ✅ CORRECT: Proper async handling
useEffect(() => {
  let cancelled = false;

  const fetchData = async () => {
    try {
      const data = await api.getData();
      if (!cancelled) {
        setData(data);
      }
    } catch (error) {
      if (!cancelled) {
        setError(error);
      }
    }
  };

  fetchData();

  return () => {
    cancelled = true; // Prevent state update after unmount
  };
}, []);

// ❌ WRONG: Making useEffect async directly
useEffect(async () => {
  const data = await api.getData(); // DON'T DO THIS
  setData(data);
}, []);
```

### Token Verification Pattern (Project Example)

```tsx
// ✅ PROJECT PATTERN: Verify token on mount
useEffect(() => {
  const verifyToken = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    } catch (error) {
      // Token is invalid, clear everything
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  verifyToken();
}, [token]); // Only re-run if token changes
```

### Dependency Array Rules

```tsx
// ✅ CORRECT: All external values in dependencies
useEffect(() => {
  const fetchUser = async () => {
    const data = await api.getUser(userId);
    setUser(data);
  };
  fetchUser();
}, [userId]); // userId is external value

// ⚠️ WARNING: Missing dependency (ESLint will warn)
useEffect(() => {
  console.log(userId); // userId used but not in deps
}, []); // Missing userId in dependencies

// ✅ CORRECT: Empty array for mount-only effects
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []); // Intentionally empty
```

---

## useCallback

### Basic Usage

```tsx
import { useCallback } from 'react';

export const MyComponent = () => {
  const [count, setCount] = useState(0);

  // ✅ MEMOIZED: Function reference stays the same
  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1);
  }, []); // No dependencies, function never changes

  // ✅ WITH DEPENDENCIES: Function updates when userId changes
  const handleFetchUser = useCallback(async () => {
    const data = await fetchUser(userId);
    setUser(data);
  }, [userId]); // Recreates when userId changes

  return <Button onClick={handleIncrement}>+</Button>;
};
```

### Project Pattern: Event Handlers

```tsx
// ✅ PROJECT PATTERN: Memoized event handlers
export function BuilderPage() {
  const [nodes, setNodes] = useState<Node[]>([]);

  // Memoized callback prevents child re-renders
  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'start-1') {
      alert('Cannot delete the Start node');
      return;
    }

    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== nodeId && edge.target !== nodeId
    ));
  }, [setNodes, setEdges]); // Dependencies are stable setState functions

  return <NodeList nodes={nodes} onDelete={deleteNode} />;
}
```

### Auth Context Pattern (Project Example)

```tsx
// ✅ PROJECT PATTERN: Memoized auth functions
export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

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

  const logout = useCallback(() => {
    authApi.logout();
    setToken(null);
    setUser(null);
  }, []); // No dependencies

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### When to Use useCallback

```tsx
// ✅ USE useCallback when:
// 1. Passing to memoized child components
const MemoizedChild = React.memo(Child);
const handleClick = useCallback(() => {...}, []);
<MemoizedChild onClick={handleClick} />

// 2. Function is a dependency of useEffect/useMemo
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData should be memoized

// 3. Function is used in expensive operations
const items = useMemo(() => {
  return processItems(data, filterFn);
}, [data, filterFn]); // filterFn should be memoized

// ❌ DON'T use useCallback for:
// 1. Simple inline handlers
<button onClick={() => setCount(prev => prev + 1)}>+</button>

// 2. Handlers that aren't passed to children
const handleClick = () => console.log('clicked'); // No need to memoize
```

---

## useMemo

### Basic Usage

```tsx
import { useMemo } from 'react';

export const UserList = ({ users, searchQuery }) => {
  // ✅ MEMOIZED: Only recalculates when dependencies change
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  return (
    <div>
      {filteredUsers.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

### Project Pattern: Nodes with Handlers

```tsx
// ✅ PROJECT PATTERN: Memoize nodes with handlers
export const BuilderPage = () => {
  const [nodes, setNodes] = useState<Node[]>([]);

  const deleteNode = useCallback((nodeId: string) => {
    // ...
  }, [setNodes, setEdges]);

  // Add handlers to all nodes (memoized for performance)
  const nodesWithHandler = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        onConfig: () => setConfigNode(n),
        onDelete: () => deleteNode(n.id)
      }
    }));
  }, [nodes, deleteNode]);

  return <ReactFlow nodes={nodesWithHandler} />;
};
```

### Derived State Pattern

```tsx
// ✅ GOOD: Use useMemo for derived state
const ShoppingCart = ({ items }) => {
  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <div>
      <p>Items: {itemCount}</p>
      <p>Total: ${totalPrice.toFixed(2)}</p>
    </div>
  );
};

// ❌ BAD: Calculating on every render
const ShoppingCart = ({ items }) => {
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Recalculated on EVERY render, even if items didn't change
};
```

### When to Use useMemo

```tsx
// ✅ USE useMemo when:
// 1. Expensive calculations
const sortedData = useMemo(() => {
  return [...data].sort(complexSortFunction);
}, [data]);

// 2. Object/array that's a dependency of useEffect
const config = useMemo(() => ({ setting1, setting2 }), [setting1, setting2]);
useEffect(() => {
  initWithConfig(config);
}, [config]); // config stays stable

// 3. Filtering/transforming large datasets
const filteredItems = useMemo(() => {
  return items.filter(complexFilter);
}, [items]);

// ❌ DON'T use useMemo for:
// 1. Simple calculations
const doubled = count * 2; // No need to memoize

// 2. Already stable values
const userId = user?.id; // No need to memoize
```

---

## useRef

### DOM Reference

```tsx
import { useRef, useEffect } from 'react';

export const AutoFocusInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
};
```

### Project Pattern: ReactFlow Instance

```tsx
// ✅ PROJECT PATTERN: Store ReactFlow instance
export const BuilderPage = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onDrop = useCallback((event: React.DragEvent) => {
    if (!reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Use position to add node
  }, [reactFlowInstance]);

  return (
    <div ref={reactFlowWrapper}>
      <ReactFlow onInit={setReactFlowInstance} />
    </div>
  );
};
```

### Storing Mutable Values

```tsx
// ✅ USE useRef for values that don't trigger re-renders
export const Timer = () => {
  const intervalRef = useRef<number | null>(null);
  const [count, setCount] = useState(0);

  const startTimer = () => {
    intervalRef.current = window.setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTimer(); // Cleanup on unmount
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </div>
  );
};
```

### Previous Value Pattern

```tsx
// ✅ PATTERN: Store previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Usage
const MyComponent = ({ count }) => {
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {prevCount}</p>
    </div>
  );
};
```

---

## useContext

### Creating Context (Project Example)

```tsx
// ✅ PROJECT PATTERN: Auth Context
import { createContext, useContext, useState } from 'react';

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
    // ... login logic
  }, []);

  const logout = useCallback(() => {
    // ... logout logic
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Using Context

```tsx
// ✅ USE: Import custom hook
import { useAuth } from '../contexts/AuthContext';

export const LoginPage = () => {
  const { login, isLoading } = useAuth();

  const handleSubmit = async (credentials: LoginCredentials) => {
    await login(credentials);
  };

  return <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />;
};
```

---

## Custom Hooks

### Basic Custom Hook

```tsx
// ✅ PATTERN: Extract reusable logic
import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Usage
const MyComponent = () => {
  const { width, height } = useWindowSize();

  return <div>Window: {width} x {height}</div>;
};
```

### Project Pattern: useFlowCanvas

```tsx
// ✅ PROJECT PATTERN: Complex state management hook
import { useState, useCallback, useMemo } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';

export interface UseFlowCanvasOptions {
  screens: BuilderScreen[];
  onScreenUpdate: (screenId: string, updates: Partial<BuilderScreen>) => void;
  onScreenSelect: (screenId: string | null) => void;
}

export function useFlowCanvas({
  screens,
  onScreenSelect,
}: UseFlowCanvasOptions) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ScreenNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<NavigationEdgeData>>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Sync nodes with screens
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
          onEdit: () => onScreenSelect(screen.id),
        },
      } as Node<ScreenNodeData>;
    });

    if (JSON.stringify(nodes.map(n => n.data.screen)) !== JSON.stringify(screens)) {
      setNodes(updatedNodes);
    }
  }, [screens, onScreenSelect]);

  const addNode = useCallback(
    (node: Node<ScreenNodeData>) => {
      setNodes(prev => [...prev, node]);
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes(prev => prev.filter(node => node.id !== nodeId));
      setEdges(prev =>
        prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    reactFlowInstance,
    setReactFlowInstance,
    addNode,
    deleteNode,
  };
}
```

### Custom Hook Best Practices

```tsx
// ✅ GOOD: Return object for flexibility
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ... logic

  return { user, loading, error, refetch };
}

// ✅ GOOD: Return array for simple hooks (like useState)
function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

// Usage
const [isOpen, toggleOpen] = useToggle();
```

---

## Hook Rules

### Rule 1: Only Call Hooks at the Top Level

```tsx
// ❌ WRONG: Conditional hook call
function MyComponent({ condition }) {
  if (condition) {
    const [value, setValue] = useState(0); // ERROR!
  }
  // ...
}

// ✅ CORRECT: Hook at top level
function MyComponent({ condition }) {
  const [value, setValue] = useState(0);

  if (condition) {
    // Use the hook value conditionally
  }
  // ...
}
```

### Rule 2: Only Call Hooks from React Functions

```tsx
// ❌ WRONG: Hook in regular function
function calculateTotal() {
  const [total, setTotal] = useState(0); // ERROR!
  return total;
}

// ✅ CORRECT: Hook in component or custom hook
function useTotal() {
  const [total, setTotal] = useState(0);
  return total;
}
```

### Rule 3: Custom Hooks Must Start with "use"

```tsx
// ❌ WRONG: Doesn't start with "use"
function getWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  // ... hooks can't be used here safely
}

// ✅ CORRECT: Starts with "use"
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  // ... hooks can be used here
  return size;
}
```

---

## Quick Reference

### useState
- Use for component-local state
- Lazy initialization for expensive initial values
- Functional updates when new state depends on old state

### useEffect
- Use for side effects (API calls, subscriptions, DOM updates)
- Always include cleanup for subscriptions
- Dependency array: all external values used in effect

### useCallback
- Memoize functions passed to child components
- Use when function is dependency of useEffect/useMemo
- Don't overuse - has overhead

### useMemo
- Memoize expensive calculations
- Memoize objects/arrays used as dependencies
- Don't memoize everything - profile first

### useRef
- Access DOM elements
- Store mutable values that don't trigger re-renders
- Persist values across renders

### useContext
- Access context values
- Always create custom hook for context
- Throw error if used outside provider

### Custom Hooks
- Extract reusable logic
- Compose other hooks
- Start with "use"
- Follow all hook rules
