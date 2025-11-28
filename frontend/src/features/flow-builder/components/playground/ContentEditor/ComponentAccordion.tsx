import { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BuilderComponent } from '../../../types/builder.types';
import { ComponentAccordionItem } from './ComponentAccordionItem';

/**
 * Props interface for ComponentAccordion
 */
export interface ComponentAccordionProps {
  /**
   * List of components to display
   */
  components: BuilderComponent[];

  /**
   * ID of the currently expanded component (null if all collapsed)
   */
  expandedComponentId: string | null;

  /**
   * Callback when a component expand state changes
   */
  onExpandComponent: (componentId: string | null) => void;

  /**
   * Callback when a component is updated
   */
  onUpdateComponent: (componentId: string, updates: Partial<BuilderComponent>) => void;

  /**
   * Callback when a component is deleted
   */
  onDeleteComponent: (componentId: string) => void;

  /**
   * Callback when a component is duplicated
   */
  onDuplicateComponent: (componentId: string) => void;

  /**
   * Callback when components are reordered
   */
  onReorderComponents: (newOrder: string[]) => void;

  /**
   * Function to get preview text for a component
   */
  getPreviewText: (component: BuilderComponent) => string;
}

/**
 * ComponentAccordion - Container for draggable, expandable component items
 *
 * Features:
 * - Drag-to-reorder with @dnd-kit
 * - Expand/collapse animation
 * - Renders ComponentAccordionItem list
 *
 * @example
 * ```tsx
 * <ComponentAccordion
 *   components={components}
 *   expandedComponentId={expandedId}
 *   onExpandComponent={setExpandedId}
 *   onUpdateComponent={handleUpdate}
 *   onDeleteComponent={handleDelete}
 *   onDuplicateComponent={handleDuplicate}
 *   onReorderComponents={handleReorder}
 *   getPreviewText={(c) => c.config.text || c.config.label || ''}
 * />
 * ```
 */
export function ComponentAccordion({
  components,
  expandedComponentId,
  onExpandComponent,
  onUpdateComponent,
  onDeleteComponent,
  onDuplicateComponent,
  onReorderComponents,
  getPreviewText,
}: ComponentAccordionProps) {
  // Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Extract component IDs for DndContext
  const componentIds = useMemo(() => components.map((c) => c.id), [components]);

  /**
   * Handle drag end event - reorder components
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = components.findIndex((c) => c.id === active.id);
      const newIndex = components.findIndex((c) => c.id === over.id);

      const reorderedComponents = arrayMove(components, oldIndex, newIndex);
      const newOrder = reorderedComponents.map((c) => c.id);
      onReorderComponents(newOrder);
    }
  };

  /**
   * Handle toggle expand/collapse
   */
  const handleToggle = (componentId: string) => {
    if (expandedComponentId === componentId) {
      // Collapse if already expanded
      onExpandComponent(null);
    } else {
      // Expand this component
      onExpandComponent(componentId);
    }
  };

  // Empty state
  if (components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <span className="material-symbols-outlined text-4xl text-zinc-600 mb-3">
          widgets
        </span>
        <p className="text-sm text-zinc-400 mb-1">No components yet</p>
        <p className="text-xs text-zinc-500">Add content to get started</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={componentIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {components.map((component) => (
            <ComponentAccordionItem
              key={component.id}
              component={component}
              isExpanded={expandedComponentId === component.id}
              previewText={getPreviewText(component)}
              onToggle={() => handleToggle(component.id)}
              onUpdate={(updates) => onUpdateComponent(component.id, updates)}
              onDelete={() => onDeleteComponent(component.id)}
              onDuplicate={() => onDuplicateComponent(component.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
