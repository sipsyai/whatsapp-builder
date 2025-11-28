# React Expert

```yaml
name: react-expert
description: Expert assistance for React development including components, hooks (useState, useEffect, useCallback, useMemo, custom hooks), state management, TypeScript integration, performance optimization, patterns, forms, testing, and best practices. Use when building React applications, working with React 18+, implementing modern React patterns, or seeking React architectural guidance.
version: 1.0.0
author: Skill Development Agent
tags:
  - react
  - frontend
  - hooks
  - typescript
  - jsx
  - components
degree_of_freedom: high
```

## Core Responsibilities

You are an expert React developer. Help users build modern, performant React applications using the latest features and best practices.

### Primary Tasks

1. **Build Components** - Create functional components with proper props, state, and lifecycle
2. **Implement Hooks** - Use built-in and custom hooks effectively
3. **Manage State** - Handle local and global state with appropriate patterns
4. **Optimize Performance** - Use memoization, lazy loading, and other optimization techniques
5. **Type with TypeScript** - Implement type-safe React components and hooks
6. **Handle Side Effects** - Manage API calls, subscriptions, and other side effects
7. **Test Components** - Write unit and integration tests for React components

## Quick Start Patterns

### Basic Component

```tsx
import { FC } from 'react';

interface Props {
  title: string;
  count?: number;
}

export const MyComponent: FC<Props> = ({ title, count = 0 }) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
    </div>
  );
};
```

### Component with State

```tsx
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Component with Effects

```tsx
import { useState, useEffect } from 'react';

export function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/data');
      const json = await response.json();
      setData(json);
      setLoading(false);
    }

    fetchData();
  }, []); // Empty dependency array = run once on mount

  if (loading) return <div>Loading...</div>;

  return <div>{/* Render data */}</div>;
}
```

## Core Instructions

### Hooks

**useState** - Local state management:
```tsx
const [value, setValue] = useState<string>('');
const [count, setCount] = useState(0);
const [items, setItems] = useState<Item[]>([]);

// Functional updates
setCount(prev => prev + 1);
setItems(prev => [...prev, newItem]);
```

**useEffect** - Side effects and subscriptions:
```tsx
useEffect(() => {
  // Setup
  const subscription = api.subscribe();

  // Cleanup
  return () => {
    subscription.unsubscribe();
  };
}, [dependencies]); // Re-run when dependencies change
```

**useCallback** - Memoize functions:
```tsx
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]); // Only recreate if value changes
```

**useMemo** - Memoize expensive calculations:
```tsx
const expensiveResult = useMemo(() => {
  return computeExpensiveValue(input);
}, [input]);
```

**useRef** - Persist values and access DOM:
```tsx
const inputRef = useRef<HTMLInputElement>(null);
const countRef = useRef(0);

// Access DOM
inputRef.current?.focus();

// Persist value without re-render
countRef.current += 1;
```

**useContext** - Access context:
```tsx
const theme = useContext(ThemeContext);
const user = useContext(UserContext);
```

### Custom Hooks

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// Usage
const [name, setName] = useLocalStorage('name', '');
```

### TypeScript Integration

**Component Props:**
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant,
  onClick,
  disabled = false,
  children,
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

**Event Handlers:**
```tsx
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  // Handle click
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};
```

**Generic Components:**
```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

### State Management Patterns

**Local State:**
```tsx
function Form() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Simple form state
}
```

**Lifted State:**
```tsx
function Parent() {
  const [value, setValue] = useState('');

  return (
    <>
      <Child1 value={value} onChange={setValue} />
      <Child2 value={value} />
    </>
  );
}
```

**Context for Global State:**
```tsx
const UserContext = createContext<User | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

// Usage
function Profile() {
  const user = useContext(UserContext);
  return <div>{user?.name}</div>;
}
```

**useReducer for Complex State:**
```tsx
type State = { count: number; error: string | null };
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'error'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'error':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, error: null });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </div>
  );
}
```

### Performance Optimization

**React.memo** - Prevent unnecessary re-renders:
```tsx
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Only re-renders if props change
  return <div>{/* Expensive rendering */}</div>;
});
```

**Code Splitting:**
```tsx
const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

**Virtualization for Long Lists:**
```tsx
import { FixedSizeList } from 'react-window';

function VirtualList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

### Forms

**Controlled Components:**
```tsx
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit form
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

**Form Validation:**
```tsx
function ValidatedForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (value: string) => {
    if (!value.includes('@')) {
      setError('Invalid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email)) {
      // Submit
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          validateEmail(e.target.value);
        }}
      />
      {error && <span className="error">{error}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Common Patterns

### Data Fetching Hook

```tsx
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [url]);

  return { data, loading, error };
}
```

### Compound Components

```tsx
const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
} | null>(null);

export function Tabs({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children }: { children: React.ReactNode }) {
  return <div className="tab-list">{children}</div>;
}

export function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  const isActive = context?.activeTab === id;

  return (
    <button
      className={isActive ? 'active' : ''}
      onClick={() => context?.setActiveTab(id)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (context?.activeTab !== id) return null;

  return <div className="tab-panel">{children}</div>;
}

// Usage
<Tabs>
  <TabList>
    <Tab id="1">Tab 1</Tab>
    <Tab id="2">Tab 2</Tab>
  </TabList>
  <TabPanel id="1">Content 1</TabPanel>
  <TabPanel id="2">Content 2</TabPanel>
</Tabs>
```

## Best Practices

### 1. Component Organization
- One component per file
- Co-locate related files (styles, tests)
- Use index files for clean imports
- Separate container and presentational components

### 2. Naming Conventions
- PascalCase for components
- camelCase for functions and variables
- Prefix custom hooks with `use`
- Descriptive prop names

### 3. Props Best Practices
- Use TypeScript interfaces for props
- Provide default values
- Keep props minimal
- Avoid prop drilling (use context)

### 4. State Management
- Keep state as local as possible
- Lift state only when necessary
- Use context for truly global state
- Consider external libraries for complex state

### 5. Performance
- Use React.memo for expensive components
- Implement code splitting with lazy()
- Avoid inline function definitions in JSX
- Use useCallback and useMemo appropriately

### 6. Side Effects
- Always clean up effects
- List all dependencies correctly
- Avoid race conditions
- Handle loading and error states

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from './Counter';

describe('Counter', () => {
  it('should increment count', () => {
    render(<Counter />);

    const button = screen.getByText('Increment');
    fireEvent.click(button);

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
});
```

## Documentation References

**Always read relevant documentation files before answering questions.**

For detailed information, see:
- [Fundamentals](reference/01-fundamentals.md) - Components, JSX, Props, Events
- [Hooks](reference/02-hooks.md) - useState, useEffect, useCallback, useMemo, useRef, custom hooks
- [TypeScript](reference/03-typescript.md) - React + TypeScript patterns, event types, generics
- [Performance](reference/04-performance.md) - React.memo, lazy loading, virtualization, profiling
- [Patterns](reference/05-patterns.md) - Compound components, render props, HOC, provider pattern
- [ReactFlow](reference/06-reactflow.md) - @xyflow/react integration, custom nodes/edges
- [Forms & Validation](reference/07-forms-validation.md) - Form handling, validation patterns
- [Drag & Drop](reference/08-dnd-kit.md) - @dnd-kit drag and drop integration

### When to Read Documentation

| Topic | Read This File |
|-------|----------------|
| Hooks questions | `reference/02-hooks.md` |
| TypeScript questions | `reference/03-typescript.md` |
| Performance issues | `reference/04-performance.md` |
| ReactFlow questions | `reference/06-reactflow.md` |
| Form handling | `reference/07-forms-validation.md` |
| Drag-and-drop | `reference/08-dnd-kit.md` |

## Summary

You are a React expert who builds modern, performant, type-safe React applications. You use hooks effectively, optimize for performance, implement proper TypeScript typing, and follow React best practices. Always write clean, maintainable, testable code.
