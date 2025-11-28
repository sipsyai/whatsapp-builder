# React + TypeScript Patterns

> **Project Context**: WhatsApp Builder uses strict TypeScript with comprehensive type definitions

## Table of Contents
1. [Component Props Types](#component-props-types)
2. [Event Handler Types](#event-handler-types)
3. [Generic Components](#generic-components)
4. [Ref Types](#ref-types)
5. [Children Types](#children-types)
6. [Custom Hook Types](#custom-hook-types)
7. [Union and Discriminated Union Types](#union-and-discriminated-union-types)
8. [Type Guards](#type-guards)

---

## Component Props Types

### Basic Props Interface

```tsx
// ✅ PROJECT PATTERN: Props interface with clear typing
interface MessageBubbleProps {
  message: Message;
  businessUserId: string;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  businessUserId,
  className = "",
}) => {
  return <div className={className}>{message.content}</div>;
};
```

### Optional vs Required Props

```tsx
interface UserCardProps {
  // Required props (no ?)
  user: User;
  onSelect: (userId: string) => void;

  // Optional props (with ?)
  showAvatar?: boolean;
  className?: string;

  // Optional with explicit undefined union
  badge?: string | undefined;

  // Required but can be null
  lastSeen: Date | null;
}
```

### Complex Prop Types

```tsx
// ✅ PROJECT PATTERN: Complex component configuration
interface DraggableComponentProps {
  component: ComponentDefinition;
  onAddClick?: (componentType: Component['type']) => void;
}

interface ComponentDefinition {
  type: Component['type'];  // Union type from Component
  name: string;
  icon: string;
  description: string;
  category: 'text' | 'input' | 'selection' | 'date' | 'media';
}
```

### Extending HTML Attributes

```tsx
// ✅ PATTERN: Extend native HTML props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading,
  children,
  disabled,
  ...rest  // Spread remaining HTML button props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`btn btn-${variant}`}
      {...rest}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

// Usage: All button props are available
<Button onClick={handleClick} type="submit" variant="primary">
  Submit
</Button>
```

### Omit and Pick Utility Types

```tsx
// ✅ PATTERN: Reuse types with Omit/Pick
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Omit sensitive fields
type PublicUser = Omit<User, 'password'>;

// Pick only needed fields
type UserPreview = Pick<User, 'id' | 'name'>;

// Props using derived types
interface UserProfileProps {
  user: PublicUser;
  onUpdate: (updates: Partial<User>) => void;
}
```

---

## Event Handler Types

### Common Event Types

```tsx
// ✅ PROJECT PATTERNS: Event handler types
export const MyComponent = () => {
  // Click events
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Button clicked');
  };

  // Input change events
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Form logic
  };

  // Keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Drag events (PROJECT EXAMPLE)
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow', 'message');
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} onKeyDown={handleKeyDown} />
      <button onClick={handleClick}>Submit</button>
      <div draggable onDragStart={handleDragStart}>Drag me</div>
    </form>
  );
};
```

### Generic Event Handler Type

```tsx
// ✅ PATTERN: Reusable event handler types
type EventHandler<T = HTMLElement, E = React.MouseEvent> = (event: E & { currentTarget: T }) => void;

// Usage
const handleButtonClick: EventHandler<HTMLButtonElement> = (e) => {
  e.currentTarget.disabled = true;
};

const handleDivClick: EventHandler<HTMLDivElement> = (e) => {
  e.currentTarget.style.backgroundColor = 'red';
};
```

### Callback Props Types

```tsx
// ✅ PROJECT PATTERN: Callback prop types
interface ModalProps {
  // Simple callback
  onClose: () => void;

  // Callback with parameters
  onSave: (data: FormData) => void;

  // Async callback
  onSubmit: (values: any) => Promise<void>;

  // Optional callback
  onChange?: (value: string) => void;

  // Callback with multiple parameters
  onUpdate: (id: string, updates: Partial<BuilderScreen>) => void;
}

// Usage in component
export const Modal: React.FC<ModalProps> = ({ onClose, onSave }) => {
  const handleSave = async () => {
    const data = collectFormData();
    await onSave(data);
    onClose();
  };

  return (
    <div>
      <button onClick={onClose}>Cancel</button>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

---

## Generic Components

### Basic Generic Component

```tsx
// ✅ PATTERN: Generic list component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Usage with type inference
<List
  items={users}  // TypeScript infers T = User
  renderItem={user => <UserCard user={user} />}
  keyExtractor={user => user.id}
/>
```

### Generic with Constraints

```tsx
// ✅ PATTERN: Generic with constraints
interface HasId {
  id: string;
}

interface DataTableProps<T extends HasId> {
  data: T[];
  columns: Column<T>[];
  onRowClick: (item: T) => void;
}

export function DataTable<T extends HasId>({
  data,
  columns,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <table>
      <tbody>
        {data.map(item => (
          <tr key={item.id} onClick={() => onRowClick(item)}>
            {columns.map(col => (
              <td key={col.key}>{col.render(item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Project Example: Type-Safe Hook

```tsx
// ✅ PROJECT PATTERN: Generic return type
export interface UseFlowCanvasReturn<T extends ScreenNodeData> {
  nodes: Node<T>[];
  edges: Edge<NavigationEdgeData>[];
  onNodesChange: OnNodesChange<Node<T>>;
  onEdgesChange: OnEdgesChange<Edge<NavigationEdgeData>>;
  addNode: (node: Node<T>) => void;
  updateNode: (nodeId: string, updates: Partial<Node<T>>) => void;
  deleteNode: (nodeId: string) => void;
}

export function useFlowCanvas<T extends ScreenNodeData>({
  screens,
  onScreenSelect,
}: UseFlowCanvasOptions): UseFlowCanvasReturn<T> {
  // Implementation
}
```

---

## Ref Types

### useRef with DOM Elements

```tsx
import { useRef, useEffect } from 'react';

export const AutoFocusInput = () => {
  // ✅ CORRECT: Proper ref typing for DOM element
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // TypeScript knows inputRef.current is HTMLInputElement | null
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <input ref={inputRef} />
      <div ref={divRef} />
      <button ref={buttonRef} />
    </>
  );
};
```

### useRef with Mutable Values

```tsx
// ✅ PATTERN: Mutable value refs
export const Timer = () => {
  // Type explicitly for non-null initial value
  const countRef = useRef<number>(0);

  // Type for nullable values
  const intervalRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const startTimer = () => {
    intervalRef.current = window.setInterval(() => {
      countRef.current += 1;
    }, 1000);
  };

  return <button onClick={startTimer}>Start</button>;
};
```

### Forward Ref Types

```tsx
// ✅ PATTERN: Forward ref component typing
import { forwardRef } from 'react';

interface InputProps {
  label: string;
  placeholder?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, placeholder }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} placeholder={placeholder} />
      </div>
    );
  }
);

// Usage
const MyComponent = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  return <Input ref={inputRef} label="Name" />;
};
```

---

## Children Types

### Basic Children

```tsx
// ✅ PATTERN: Children as ReactNode
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
```

### Typed Children (Render Props)

```tsx
// ✅ PATTERN: Children as function
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean) => React.ReactNode;
}

export function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [url]);

  return <>{children(data, loading)}</>;
}

// Usage
<DataFetcher<User> url="/api/user">
  {(user, loading) => {
    if (loading) return <Spinner />;
    if (!user) return null;
    return <UserProfile user={user} />;
  }}
</DataFetcher>
```

### Restricting Children Types

```tsx
// ✅ PATTERN: Only accept specific children
import { ReactElement } from 'react';

interface TabsProps {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
}

interface TabProps {
  label: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ children }) => {
  return <div className="tabs">{children}</div>;
};

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <div className="tab">{children}</div>;
};

// Usage
<Tabs>
  <Tab label="Tab 1">Content 1</Tab>
  <Tab label="Tab 2">Content 2</Tab>
  {/* <div>Other</div> */} {/* TypeScript error! */}
</Tabs>
```

---

## Custom Hook Types

### Basic Hook Return Type

```tsx
// ✅ PATTERN: Explicit return type
interface UseToggleReturn {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
}

export function useToggle(initialValue = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}
```

### Tuple Return Type

```tsx
// ✅ PATTERN: Tuple return (like useState)
export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);

  return [value, toggle];
}

// Usage
const [isOpen, toggleOpen] = useToggle();
```

### Generic Hook

```tsx
// ✅ PATTERN: Generic custom hook
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  return [storedValue, setValue];
}

// Usage with type inference
const [user, setUser] = useLocalStorage<User>('user', null);
const [count, setCount] = useLocalStorage<number>('count', 0);
```

---

## Union and Discriminated Union Types

### Simple Union Types

```tsx
// ✅ PROJECT PATTERN: Union for variants
type ButtonVariant = 'primary' | 'secondary' | 'danger';
type MessageType = 'text' | 'image' | 'document' | 'video';
type NodeType = 'start' | 'message' | 'question' | 'condition' | 'whatsapp_flow' | 'rest_api';

interface ButtonProps {
  variant: ButtonVariant;
  onClick: () => void;
}
```

### Discriminated Unions (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Discriminated union for actions
export interface NavigateAction {
  name: 'navigate';
  next: {
    type: 'screen';
    name: string;
  };
  payload?: Record<string, unknown>;
}

export interface CompleteAction {
  name: 'complete';
  payload?: Record<string, unknown>;
}

export interface DataExchangeAction {
  name: 'data_exchange';
  payload?: Record<string, unknown>;
}

export interface UpdateDataAction {
  name: 'update_data';
  payload: Record<string, unknown>;
}

export type Action =
  | NavigateAction
  | CompleteAction
  | DataExchangeAction
  | UpdateDataAction;

// TypeScript narrows the type based on 'name'
function handleAction(action: Action) {
  switch (action.name) {
    case 'navigate':
      // TypeScript knows: action is NavigateAction
      console.log(action.next.name);
      break;
    case 'complete':
      // TypeScript knows: action is CompleteAction
      console.log(action.payload);
      break;
    case 'data_exchange':
      // TypeScript knows: action is DataExchangeAction
      break;
    case 'update_data':
      // TypeScript knows: action is UpdateDataAction
      // action.payload is required (not optional)
      break;
  }
}
```

### Component Union Type (Project Example)

```tsx
// ✅ PROJECT PATTERN: Union of all component types
export type Component =
  | TextHeading
  | TextSubheading
  | TextBody
  | TextInput
  | TextArea
  | CheckboxGroup
  | RadioButtonsGroup
  | Dropdown
  | DatePicker
  | Footer
  | OptIn
  | Image;

// Each component has a 'type' discriminator
interface TextHeading {
  type: 'TextHeading';
  text: string;
  visible?: boolean;
}

interface TextInput {
  type: 'TextInput';
  label: string;
  name: string;
  required?: boolean;
}

// Type-safe component rendering
function renderComponent(component: Component) {
  switch (component.type) {
    case 'TextHeading':
      return <h1>{component.text}</h1>;
    case 'TextInput':
      return <input name={component.name} required={component.required} />;
    // ... other cases
  }
}
```

---

## Type Guards

### Built-in Type Guards

```tsx
// ✅ typeof guard
function processValue(value: string | number) {
  if (typeof value === 'string') {
    // TypeScript knows: value is string
    return value.toUpperCase();
  } else {
    // TypeScript knows: value is number
    return value.toFixed(2);
  }
}

// ✅ instanceof guard
function handleError(error: Error | string) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
}

// ✅ Array.isArray guard
function process(value: string | string[]) {
  if (Array.isArray(value)) {
    // TypeScript knows: value is string[]
    return value.join(', ');
  } else {
    // TypeScript knows: value is string
    return value;
  }
}
```

### Custom Type Guards (Project Pattern)

```tsx
// ✅ PROJECT PATTERN: Type guard functions
export function isTextComponent(
  component: Component
): component is TextHeading | TextSubheading | TextBody | TextCaption {
  return ['TextHeading', 'TextSubheading', 'TextBody', 'TextCaption'].includes(
    component.type
  );
}

export function isInputComponent(
  component: Component
): component is TextInput | TextArea {
  return ['TextInput', 'TextArea'].includes(component.type);
}

export function isNavigateAction(action: Action): action is NavigateAction {
  return action.name === 'navigate';
}

// Usage
function processComponent(component: Component) {
  if (isTextComponent(component)) {
    // TypeScript knows: component has 'text' property
    console.log(component.text);
  }

  if (isInputComponent(component)) {
    // TypeScript knows: component has 'name' and 'label'
    console.log(component.name, component.label);
  }
}

function processAction(action: Action) {
  if (isNavigateAction(action)) {
    // TypeScript knows: action has 'next' property
    console.log(action.next.name);
  }
}
```

### Nullish Type Guards

```tsx
// ✅ PATTERN: Null/undefined checks
function getUserName(user: User | null | undefined): string {
  // Method 1: Explicit check
  if (user === null || user === undefined) {
    return 'Guest';
  }
  return user.name;

  // Method 2: Truthiness check
  if (!user) {
    return 'Guest';
  }
  return user.name;

  // Method 3: Optional chaining with nullish coalescing
  return user?.name ?? 'Guest';
}
```

---

## Advanced Patterns

### Const Assertions

```tsx
// ✅ PATTERN: Const assertions for literals
const COLORS = {
  primary: '#25D366',
  secondary: '#075E54',
  background: '#0a160e',
} as const;

type Color = typeof COLORS[keyof typeof COLORS];
// Color = '#25D366' | '#075E54' | '#0a160e'

const NODE_TYPES = ['start', 'message', 'question', 'condition'] as const;
type NodeType = typeof NODE_TYPES[number];
// NodeType = 'start' | 'message' | 'question' | 'condition'
```

### Type Extraction

```tsx
// ✅ PATTERN: Extract types from complex structures
type User = {
  id: string;
  profile: {
    name: string;
    email: string;
    settings: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
};

// Extract nested type
type UserProfile = User['profile'];
type UserSettings = User['profile']['settings'];
type Theme = User['profile']['settings']['theme'];

// Extract function return type
function getUser() {
  return { id: '1', name: 'John' };
}
type GetUserReturn = ReturnType<typeof getUser>;

// Extract function parameters
function updateUser(id: string, updates: Partial<User>) {}
type UpdateUserParams = Parameters<typeof updateUser>;
```

---

## Quick Reference

### Component Props
```tsx
interface Props {
  required: string;
  optional?: number;
  callback: (value: string) => void;
  children: React.ReactNode;
}
```

### Event Handlers
```tsx
onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
onSubmit: (e: React.FormEvent) => void
```

### Refs
```tsx
const ref = useRef<HTMLDivElement>(null);
const valueRef = useRef<number>(0);
```

### Generic Component
```tsx
function List<T>({ items }: { items: T[] }) { ... }
```

### Type Guards
```tsx
function isUser(value: any): value is User {
  return 'id' in value && 'name' in value;
}
```
