# React Fundamentals Reference

> **Project Context**: WhatsApp Builder uses React 19.2.0 with TypeScript, functional components only

## Table of Contents
1. [Component Basics](#component-basics)
2. [JSX Patterns](#jsx-patterns)
3. [Props and Types](#props-and-types)
4. [Conditional Rendering](#conditional-rendering)
5. [Lists and Keys](#lists-and-keys)
6. [Event Handling](#event-handling)
7. [Children Props](#children-props)

---

## Component Basics

### Functional Component Structure

```tsx
// ✅ GOOD: Modern functional component with TypeScript
import React from 'react';

interface MyComponentProps {
  title: string;
  count: number;
  isActive?: boolean; // Optional prop
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  count,
  isActive = false  // Default value
}) => {
  return (
    <div className="my-component">
      <h1>{title}</h1>
      <p>Count: {count}</p>
      {isActive && <span>Active</span>}
    </div>
  );
};
```

### Named vs Default Exports

```tsx
// ✅ PREFERRED: Named exports (used in WhatsApp Builder)
export const BuilderPage: React.FC<BuilderPageProps> = ({ ... }) => { ... };
export const ChatWindow: React.FC<ChatWindowProps> = ({ ... }) => { ... };

// ❌ AVOID: Default exports (harder to refactor)
export default function BuilderPage() { ... }
```

**Why Named Exports?**
- Consistent naming across imports
- Better IDE autocomplete
- Easier refactoring
- Follows project convention

---

## JSX Patterns

### Fragment Usage

```tsx
// ✅ GOOD: Short syntax for fragments
const MyComponent = () => {
  return (
    <>
      <Header />
      <Content />
      <Footer />
    </>
  );
};

// ❌ AVOID: Unnecessary wrapper divs
const BadComponent = () => {
  return (
    <div> {/* Unnecessary wrapper */}
      <Header />
      <Content />
    </div>
  );
};
```

### Self-Closing Tags

```tsx
// ✅ GOOD: Self-closing for components without children
<Input />
<Image src={url} alt="description" />
<MessageBubble message={msg} businessUserId={id} />

// ❌ BAD: Unnecessary closing tag
<Input></Input>
```

### Boolean Props

```tsx
// ✅ GOOD: Shorthand for true
<Button disabled loading />

// ⚠️ EXPLICIT: When needed for clarity
<Checkbox checked={isChecked} required={isRequired} />
```

---

## Props and Types

### Interface Definition Pattern

```tsx
// ✅ PROJECT PATTERN: Props interface with clear naming
interface DraggableComponentProps {
  component: ComponentDefinition;
  onAddClick?: (componentType: Component['type']) => void;
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  onAddClick,
}) => {
  // Component logic
};
```

### Optional vs Required Props

```tsx
interface ChatWindowProps {
  // Required props
  conversation: Conversation;
  onSendMessage: (content: any, type?: "text" | "image") => void;

  // Optional props with ?
  className?: string;
  onClose?: () => void;

  // Optional with default value (handled in destructuring)
  maxMessages?: number;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onSendMessage,
  className = "",
  maxMessages = 100,
}) => {
  // ...
};
```

### Union Types for Props

```tsx
interface MessageBubbleProps {
  message: Message;
  // Union type for business user ID
  businessUserId: string | null;
  // Union type for message type
  type: "text" | "image" | "document" | "video";
}
```

### Function Props Types

```tsx
interface ModalProps {
  // Simple callback
  onClose: () => void;

  // Callback with parameter
  onSave: (data: FormData) => void;

  // Async callback
  onSubmit: (values: any) => Promise<void>;

  // Callback with multiple parameters
  onUpdate: (id: string, updates: Partial<User>) => void;
}
```

---

## Conditional Rendering

### Using Logical AND (&&)

```tsx
// ✅ PROJECT PATTERN: Conditional rendering with &&
export const ChatWindow = ({ conversation }) => {
  return (
    <div>
      {/* Only render if inputValue has content */}
      {inputValue.trim() && (
        <button onClick={handleSend}>
          <span className="material-symbols-outlined">send</span>
        </button>
      )}

      {/* Render if array has items */}
      {validationErrors.length > 0 && (
        <ValidationPanel errors={validationErrors} />
      )}
    </div>
  );
};
```

### Ternary Operator

```tsx
// ✅ GOOD: Simple true/false rendering
{isLoading ? (
  <Spinner />
) : (
  <Content data={data} />
)}

// ✅ GOOD: Icon switching based on state
<span className="material-symbols-outlined">
  {testMode ? 'edit' : 'science'}
</span>

// ✅ GOOD: Text variation
{currentFlowId ? 'Update Flow' : 'Save Flow'}
```

### Complex Conditional Logic

```tsx
// ✅ GOOD: Extract to variable for readability
const MyComponent = ({ user, isLoading, error }) => {
  const showContent = !isLoading && !error && user;
  const showError = !isLoading && error;
  const showEmpty = !isLoading && !error && !user;

  return (
    <div>
      {isLoading && <Spinner />}
      {showError && <ErrorMessage error={error} />}
      {showEmpty && <EmptyState />}
      {showContent && <UserProfile user={user} />}
    </div>
  );
};
```

### Early Returns

```tsx
// ✅ PROJECT PATTERN: Early return for special cases
export const ComponentReorderingExample = () => {
  const { selectedScreen } = useFlowBuilder();

  // Early return if no screen selected
  if (!selectedScreen) {
    return <div>Please select a screen first</div>;
  }

  // Main render logic
  return (
    <div>
      <h3>Reorder Components</h3>
      {/* ... */}
    </div>
  );
};
```

---

## Lists and Keys

### Mapping Arrays

```tsx
// ✅ PROJECT PATTERN: Map with proper keys
export const BuilderPage = () => {
  return (
    <div>
      {screens.map(screen => (
        <div
          key={screen.id}  // ✅ Use unique ID
          onClick={() => selectScreen(screen.id)}
        >
          {screen.title}
        </div>
      ))}
    </div>
  );
};
```

### Key Selection Rules

```tsx
// ✅ BEST: Stable unique ID from data
{users.map(user => (
  <UserCard key={user.id} user={user} />
))}

// ⚠️ ACCEPTABLE: Composite key if no ID
{edges.map(edge => (
  <Edge key={`${edge.source}-${edge.target}`} edge={edge} />
))}

// ❌ AVOID: Index as key (causes bugs on reorder)
{items.map((item, index) => (
  <Item key={index} item={item} />
))}
```

### Empty State Handling

```tsx
// ✅ GOOD: Check array length before mapping
{conversation.messages.length > 0 ? (
  conversation.messages.map(msg => (
    <MessageBubble key={msg.id} message={msg} />
  ))
) : (
  <EmptyState message="No messages yet" />
)}

// ✅ ALTERNATIVE: Using logical AND
{conversation.messages.length === 0 && (
  <EmptyState message="No messages yet" />
)}
{(conversation.messages || []).map(msg => (
  <MessageBubble key={msg.id} message={msg} />
))}
```

---

## Event Handling

### Event Handler Patterns

```tsx
interface MyComponentProps {
  onSubmit: (data: FormData) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ onSubmit }) => {
  // ✅ PATTERN 1: Inline arrow function (for simple operations)
  const handleClick = () => {
    console.log('clicked');
  };

  // ✅ PATTERN 2: Event parameter usage
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // ✅ PATTERN 3: preventDefault pattern
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // ✅ PATTERN 4: stopPropagation for nested events
  const handleAddClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent parent click
    addComponent();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Click</button>
    </form>
  );
};
```

### Keyboard Event Handling

```tsx
// ✅ PROJECT PATTERN: Enter key handling
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

<input
  type="text"
  onKeyDown={handleKeyDown}
  placeholder="Type a message"
/>
```

### Event Type Reference

```tsx
// Common event types used in project
type ClickEvent = React.MouseEvent<HTMLButtonElement>;
type ChangeEvent = React.ChangeEvent<HTMLInputElement>;
type FormEvent = React.FormEvent<HTMLFormElement>;
type KeyEvent = React.KeyboardEvent<HTMLInputElement>;
type DragEvent = React.DragEvent<HTMLDivElement>;

// Generic event handler types
type EventHandler<T> = (event: T) => void;
type ClickHandler = EventHandler<React.MouseEvent>;
```

---

## Children Props

### Basic Children

```tsx
interface CardProps {
  children: React.ReactNode;
  title: string;
}

export const Card: React.FC<CardProps> = ({ children, title }) => {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">{children}</div>
    </div>
  );
};

// Usage
<Card title="My Card">
  <p>Any content here</p>
  <Button>Click me</Button>
</Card>
```

### Provider Pattern (Project Example)

```tsx
// ✅ PROJECT PATTERN: Context Provider with children
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage in App
<AuthProvider>
  <App />
</AuthProvider>
```

### Render Props Alternative

```tsx
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode;
}

export function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return <>{children(data, loading, error)}</>;
}

// Usage
<DataFetcher<User> url="/api/user">
  {(user, loading, error) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error.message} />;
    if (user) return <UserProfile user={user} />;
    return null;
  }}
</DataFetcher>
```

---

## Best Practices Summary

1. **Always use TypeScript** - Define props interfaces for all components
2. **Functional components only** - No class components in modern React
3. **Named exports** - Consistent with project convention
4. **Proper key props** - Use unique IDs for list items
5. **Type event handlers** - Use React event types
6. **Conditional rendering** - Use early returns for clarity
7. **Fragment over div** - Avoid unnecessary DOM nodes
8. **Self-closing tags** - For components without children

---

## Common Pitfalls

### ❌ WRONG: Missing key in list
```tsx
{items.map(item => <Item item={item} />)}
```

### ✅ CORRECT: Proper key
```tsx
{items.map(item => <Item key={item.id} item={item} />)}
```

---

### ❌ WRONG: Boolean coercion issue
```tsx
{count && <Message>You have {count} items</Message>}
// If count is 0, this renders "0" instead of nothing
```

### ✅ CORRECT: Explicit boolean
```tsx
{count > 0 && <Message>You have {count} items</Message>}
```

---

### ❌ WRONG: Untyped props
```tsx
export const MyComponent = ({ data, onClick }) => { ... }
```

### ✅ CORRECT: Typed props interface
```tsx
interface MyComponentProps {
  data: Data[];
  onClick: (id: string) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ data, onClick }) => { ... }
```

---

## Quick Reference Checklist

- [ ] Component uses TypeScript with props interface
- [ ] Named export used (not default)
- [ ] Proper React.FC typing
- [ ] All props have types
- [ ] Optional props marked with `?`
- [ ] Event handlers properly typed
- [ ] Lists use unique keys
- [ ] Conditional rendering is readable
- [ ] No unnecessary wrapper divs
- [ ] Children typed as React.ReactNode when used
