# Drag and Drop with dnd-kit

> **Project Context**: WhatsApp Builder uses @dnd-kit for component reordering

## Table of Contents
1. [Installation and Setup](#installation-and-setup)
2. [Basic Drag and Drop](#basic-drag-and-drop)
3. [Sortable Lists](#sortable-lists)
4. [Drag Overlay](#drag-overlay)
5. [TypeScript Types](#typescript-types)

---

## Installation and Setup

### Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Basic Imports

```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

---

## Basic Drag and Drop

### Simple Draggable Item

```tsx
import { useDraggable } from '@dnd-kit/core';

interface DraggableProps {
  id: string;
  children: React.ReactNode;
}

export const Draggable: React.FC<DraggableProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};
```

### Simple Droppable Area

```tsx
import { useDroppable } from '@dnd-kit/core';

interface DroppableProps {
  id: string;
  children: React.ReactNode;
}

export const Droppable: React.FC<DroppableProps> = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const style = {
    backgroundColor: isOver ? '#e3f2fd' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
};
```

### DndContext Setup

```tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export const App = () => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      console.log(`Dragged ${active.id} over ${over.id}`);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <Draggable id="draggable-1">Drag me</Draggable>
      <Droppable id="droppable-1">Drop here</Droppable>
    </DndContext>
  );
};
```

---

## Sortable Lists

### Sortable Item Component

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};
```

### Sortable List Container

```tsx
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface Item {
  id: string;
  name: string;
}

export const SortableList = () => {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            <div className="sortable-item">
              <span className="material-symbols-outlined">drag_indicator</span>
              {item.name}
            </div>
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
};
```

### With Sensors (Better Touch Support)

```tsx
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export const SortableList = () => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {/* Sortable items */}
    </DndContext>
  );
};
```

---

## Drag Overlay

### Custom Drag Overlay

```tsx
import { DndContext, DragOverlay } from '@dnd-kit/core';

export const SortableListWithOverlay = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([...]);

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    // Handle reordering
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items}>
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            {item.name}
          </SortableItem>
        ))}
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <div className="drag-overlay">
            {activeItem.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
```

---

## TypeScript Types

### Common Types

```tsx
import type {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';

// Item type
interface SortableItem {
  id: UniqueIdentifier; // string | number
  name: string;
}

// Drag event handlers
const handleDragStart = (event: DragStartEvent) => {
  const { active } = event;
  console.log('Started dragging:', active.id);
};

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over) {
    console.log(`Dropped ${active.id} on ${over.id}`);
  }
};
```

---

## Project Patterns

### Component Reordering (Project Use Case)

```tsx
// ✅ PROJECT PATTERN: Reorder screen components
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ComponentListProps {
  screenId: string;
  components: Component[];
  onReorder: (screenId: string, newOrder: string[]) => void;
}

export const ComponentList: React.FC<ComponentListProps> = ({
  screenId,
  components,
  onReorder,
}) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = components.findIndex((c) => c.id === active.id);
      const newIndex = components.findIndex((c) => c.id === over.id);

      const reorderedComponents = arrayMove(components, oldIndex, newIndex);
      onReorder(screenId, reorderedComponents.map((c) => c.id));
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={components.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {components.map((component, index) => (
          <SortableComponentItem
            key={component.id}
            id={component.id}
            index={index}
            component={component}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};
```

---

## Quick Reference

### Essential Hooks

```tsx
// Draggable
const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

// Droppable
const { isOver, setNodeRef } = useDroppable({ id });

// Sortable (combines both)
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id });
```

### Common Strategies

```tsx
import {
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
```

### Collision Detection

```tsx
import {
  closestCenter,
  closestCorners,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
```
