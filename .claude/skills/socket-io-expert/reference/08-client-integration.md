# Client Integration

Complete guide for integrating Socket.IO client with React and other frontend frameworks.

## React Integration

### Installation

```bash
npm install socket.io-client
```

### Basic Socket Hook

```typescript
// hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(url: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(url);

    socketInstance.on('connect', () => {
      console.log('Connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  return { socket, isConnected };
}
```

### Authenticated Socket Hook

```typescript
// hooks/useAuthSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseAuthSocketOptions {
  url: string;
  autoConnect?: boolean;
}

export function useAuthSocket({ url, autoConnect = true }: UseAuthSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('No authentication token');
      return;
    }

    const socketInstance = io(url, {
      autoConnect,
      auth: {
        token,
      },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    socketInstance.on('authenticated', (data) => {
      setIsAuthenticated(true);
      console.log('Authenticated as:', data.userId);
    });

    socketInstance.on('error', (err) => {
      setError(err.message);
      setIsAuthenticated(false);
    });

    socketInstance.on('connect_error', (err) => {
      setError(`Connection failed: ${err.message}`);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url, autoConnect]);

  return {
    socket,
    isConnected,
    isAuthenticated,
    error,
  };
}
```

### Chat Component Example

```typescript
// components/Chat.tsx
import { useEffect, useState } from 'react';
import { useAuthSocket } from '../hooks/useAuthSocket';

interface Message {
  id: string;
  from: string;
  text: string;
  timestamp: Date;
}

export function Chat() {
  const { socket, isConnected, isAuthenticated } = useAuthSocket({
    url: 'http://localhost:3000',
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [room, setRoom] = useState('general');

  // Listen for messages
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-joined', ({ userId }) => {
      console.log(`${userId} joined the chat`);
    });

    socket.on('user-left', ({ userId }) => {
      console.log(`${userId} left the chat`);
    });

    // Cleanup listeners
    return () => {
      socket.off('new-message');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket]);

  // Join room on mount
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    socket.emit('join-room', room, (response: any) => {
      console.log('Joined room:', response);
    });

    return () => {
      socket.emit('leave-room', room);
    };
  }, [socket, isAuthenticated, room]);

  const sendMessage = () => {
    if (!socket || !inputText.trim()) return;

    socket.emit('send-message', {
      room,
      message: inputText,
    });

    setInputText('');
  };

  if (!isConnected) {
    return <div>Connecting...</div>;
  }

  if (!isAuthenticated) {
    return <div>Authenticating...</div>;
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.from}:</strong> {msg.text}
            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      <div className="status">
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
}
```

### Socket Context Provider

```typescript
// context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  url: string;
  children: React.ReactNode;
}

export function SocketProvider({ url, children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    const socketInstance = io(url, {
      auth: {
        token,
      },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

// Usage in App.tsx
function App() {
  return (
    <SocketProvider url="http://localhost:3000">
      <Chat />
      <Notifications />
    </SocketProvider>
  );
}

// Use in any component
function Notifications() {
  const { socket, isConnected } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (data) => {
      // Show notification
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  return <div>Notifications</div>;
}
```

## Event Handling Patterns

### Basic Event Listeners

```typescript
useEffect(() => {
  if (!socket) return;

  // Listen to event
  socket.on('event-name', (data) => {
    console.log('Received:', data);
  });

  // Cleanup
  return () => {
    socket.off('event-name');
  };
}, [socket]);
```

### Event with Acknowledgment

```typescript
const sendWithCallback = () => {
  if (!socket) return;

  socket.emit('request-data', { id: 123 }, (response: any) => {
    if (response.success) {
      console.log('Data:', response.data);
    } else {
      console.error('Error:', response.error);
    }
  });
};
```

### Multiple Event Listeners

```typescript
useEffect(() => {
  if (!socket) return;

  const handleMessage = (data: Message) => {
    setMessages((prev) => [...prev, data]);
  };

  const handleTyping = (data: { userId: string }) => {
    setTypingUsers((prev) => [...prev, data.userId]);
  };

  const handleStopTyping = (data: { userId: string }) => {
    setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
  };

  socket.on('new-message', handleMessage);
  socket.on('user-typing', handleTyping);
  socket.on('user-stop-typing', handleStopTyping);

  return () => {
    socket.off('new-message', handleMessage);
    socket.off('user-typing', handleTyping);
    socket.off('user-stop-typing', handleStopTyping);
  };
}, [socket]);
```

## Typed Events

### Type-Safe Socket

```typescript
// types/socket.ts
export interface ServerToClientEvents {
  'new-message': (message: Message) => void;
  'user-joined': (data: { userId: string; username: string }) => void;
  'user-left': (data: { userId: string }) => void;
  'notification': (notification: Notification) => void;
}

export interface ClientToServerEvents {
  'send-message': (data: { room: string; message: string }) => void;
  'join-room': (room: string, callback: (response: any) => void) => void;
  'leave-room': (room: string) => void;
}

// hooks/useTypedSocket.ts
import { Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../types/socket';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useTypedSocket(url: string) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);

  useEffect(() => {
    const socketInstance: TypedSocket = io(url);
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  return socket;
}

// Usage with full type safety
function ChatComponent() {
  const socket = useTypedSocket('http://localhost:3000');

  useEffect(() => {
    if (!socket) return;

    // Fully typed event listener
    socket.on('new-message', (message) => {
      // message is typed as Message
      console.log(message.text);
    });

    return () => {
      socket.off('new-message');
    };
  }, [socket]);

  const sendMessage = () => {
    // Fully typed emit
    socket?.emit('send-message', {
      room: 'general',
      message: 'Hello',
    });
  };
}
```

## Connection Management

### Reconnection Logic

```typescript
useEffect(() => {
  if (!socket) return;

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  socket.io.on('reconnect_attempt', () => {
    reconnectAttempts++;
    console.log(`Reconnection attempt ${reconnectAttempts}`);

    if (reconnectAttempts >= maxReconnectAttempts) {
      socket.disconnect();
      setError('Unable to connect after multiple attempts');
    }
  });

  socket.io.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected after ${attemptNumber} attempts`);
    reconnectAttempts = 0;
    setError(null);
  });

  socket.io.on('reconnect_error', (error) => {
    console.error('Reconnection error:', error);
  });

  socket.io.on('reconnect_failed', () => {
    setError('Reconnection failed');
  });
}, [socket]);
```

### Manual Reconnection

```typescript
function ConnectionManager() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    const token = localStorage.getItem('accessToken');
    const newSocket = io('http://localhost:3000', {
      auth: { token },
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    setSocket(newSocket);
  };

  const disconnect = () => {
    socket?.disconnect();
    setSocket(null);
    setIsConnected(false);
  };

  const reconnect = () => {
    disconnect();
    setTimeout(connect, 1000);
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={connect} disabled={isConnected}>
        Connect
      </button>
      <button onClick={disconnect} disabled={!isConnected}>
        Disconnect
      </button>
      <button onClick={reconnect}>Reconnect</button>
    </div>
  );
}
```

## Performance Optimization

### Debounced Events

```typescript
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

function TypingIndicator() {
  const { socket } = useSocketContext();

  // Debounce typing events
  const emitTyping = useCallback(
    debounce(() => {
      socket?.emit('user-typing', { room: 'general' });
    }, 500),
    [socket]
  );

  const handleInputChange = (value: string) => {
    setMessage(value);
    if (value) {
      emitTyping();
    }
  };

  return <input onChange={(e) => handleInputChange(e.target.value)} />;
}
```

### Throttled Updates

```typescript
import throttle from 'lodash/throttle';

function CursorTracking() {
  const { socket } = useSocketContext();

  const emitCursorPosition = useCallback(
    throttle((x: number, y: number) => {
      socket?.emit('cursor-move', { x, y });
    }, 100),
    [socket]
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    emitCursorPosition(e.clientX, e.clientY);
  };

  return <div onMouseMove={handleMouseMove}>Canvas</div>;
}
```

### Cleanup Best Practices

```typescript
function OptimizedComponent() {
  const { socket } = useSocketContext();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Create stable handler references
    const handleUpdate = (newData: any) => {
      setData((prev) => [...prev, newData]);
    };

    // Register listeners
    socket.on('update', handleUpdate);

    // Cleanup function
    return () => {
      socket.off('update', handleUpdate);
    };
  }, [socket]); // Only re-run if socket instance changes

  return <div>{/* Render data */}</div>;
}
```

## Error Handling

### Comprehensive Error Handling

```typescript
function RobustSocketComponent() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const socketInstance = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    // Connection errors
    socketInstance.on('connect_error', (error) => {
      setErrors((prev) => [...prev, `Connection error: ${error.message}`]);
    });

    // Socket errors
    socketInstance.on('error', (error) => {
      setErrors((prev) => [...prev, `Socket error: ${error.message}`]);
    });

    // Server errors
    socketInstance.on('server-error', (data) => {
      setErrors((prev) => [...prev, `Server error: ${data.message}`]);
    });

    // Timeout errors
    socketInstance.io.on('ping_timeout', () => {
      setErrors((prev) => [...prev, 'Connection timeout']);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <div>
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error, i) => (
            <div key={i} className="error">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Testing

### Mocking Socket for Tests

```typescript
// __mocks__/socket.io-client.ts
export const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
};

export const io = jest.fn(() => mockSocket);

// Component.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { mockSocket } from 'socket.io-client';
import { Chat } from './Chat';

describe('Chat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to socket on mount', () => {
    render(<Chat />);

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('new-message', expect.any(Function));
  });

  it('should display received messages', async () => {
    render(<Chat />);

    // Simulate receiving a message
    const messageHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'new-message'
    )[1];

    messageHandler({
      id: '1',
      from: 'User1',
      text: 'Hello',
      timestamp: new Date(),
    });

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('should emit message on send', () => {
    render(<Chat />);

    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(button);

    expect(mockSocket.emit).toHaveBeenCalledWith('send-message', {
      room: 'general',
      message: 'Test message',
    });
  });
});
```

## Best Practices

### 1. Always Clean Up Event Listeners

```typescript
useEffect(() => {
  if (!socket) return;

  socket.on('event', handler);

  // IMPORTANT: Clean up to prevent memory leaks
  return () => {
    socket.off('event', handler);
  };
}, [socket]);
```

### 2. Handle Connection States in UI

```typescript
function StatusIndicator() {
  const { isConnected } = useSocketContext();

  return (
    <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  );
}
```

### 3. Implement Retry Logic

```typescript
const [retryCount, setRetryCount] = useState(0);

useEffect(() => {
  if (!socket) return;

  socket.on('connect_error', () => {
    if (retryCount < 3) {
      setTimeout(() => {
        socket.connect();
        setRetryCount((c) => c + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff
    }
  });

  socket.on('connect', () => {
    setRetryCount(0);
  });
}, [socket, retryCount]);
```

### 4. Use Stable Handler References

```typescript
// Bad: New function on every render
useEffect(() => {
  socket?.on('event', (data) => {
    setState(data);
  });
}, [socket]);

// Good: Stable reference with useCallback
const handleEvent = useCallback((data) => {
  setState(data);
}, []);

useEffect(() => {
  socket?.on('event', handleEvent);
  return () => socket?.off('event', handleEvent);
}, [socket, handleEvent]);
```

### 5. Implement Loading States

```typescript
function Chat() {
  const { socket, isConnected, isAuthenticated } = useAuthSocket({
    url: API_URL,
  });

  if (!socket) return <div>Initializing...</div>;
  if (!isConnected) return <div>Connecting...</div>;
  if (!isAuthenticated) return <div>Authenticating...</div>;

  return <div>{/* Chat UI */}</div>;
}
```
