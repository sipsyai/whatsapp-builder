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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BuilderComponent } from '../../types';

/**
 * Props interface for ComponentList
 */
interface ComponentListProps {
  components: BuilderComponent[];
  onReorder: (newOrder: BuilderComponent[]) => void;
  onEditComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
}

/**
 * Props for individual sortable component item
 */
interface SortableComponentItemProps {
  component: BuilderComponent;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

/**
 * Get icon name for component type
 */
function getComponentIcon(type: BuilderComponent['type']): string {
  const iconMap: Record<string, string> = {
    // Text components
    TextHeading: 'title',
    TextSubheading: 'subtitles',
    TextBody: 'notes',
    TextCaption: 'description',

    // Input components
    TextInput: 'input',
    TextArea: 'text_fields',

    // Selection components
    CheckboxGroup: 'check_box',
    RadioButtonsGroup: 'radio_button_checked',
    Dropdown: 'arrow_drop_down_circle',
    ChipsSelector: 'label',

    // Date components
    DatePicker: 'calendar_today',
    CalendarPicker: 'calendar_month',

    // Media components
    Image: 'image',
    ImageCarousel: 'view_carousel',

    // Navigation components
    NavigationList: 'list',

    // Interactive components
    Footer: 'touch_app',
    OptIn: 'check_circle',
    EmbeddedLink: 'link',

    // Conditional components
    If: 'alt_route',
    Switch: 'switch_access_shortcut',
  };

  return iconMap[type] || 'widgets';
}

/**
 * Get display label for component
 */
function getComponentLabel(component: BuilderComponent): string {
  if (component.label) return component.label;

  // Try to get label from config
  const config = component.config as any;
  if (config?.label) return config.label;
  if (config?.text) return config.text;
  if (config?.name) return config.name;

  // Fallback to type
  return component.type;
}

/**
 * Sortable component item
 */
function SortableComponentItem({
  component,
  onEdit,
  onDelete,
  onDuplicate,
}: SortableComponentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const icon = getComponentIcon(component.type);
  const label = getComponentLabel(component);
  const hasErrors = component.validation && !component.validation.isValid;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-2 px-3 py-2.5 rounded-lg
        bg-[#193322] border border-white/10
        transition-all duration-200
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : 'hover:border-white/20'}
        ${hasErrors ? 'border-red-500/30 bg-red-900/10' : ''}
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing flex-shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
        aria-label="Drag to reorder"
      >
        <span className="material-symbols-outlined text-base text-zinc-500">
          drag_indicator
        </span>
      </button>

      {/* Component Icon */}
      <span
        className={`
          material-symbols-outlined text-base flex-shrink-0
          ${hasErrors ? 'text-red-400' : 'text-blue-400'}
        `}
      >
        {icon}
      </span>

      {/* Component Label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {label}
          </span>
          {component.visible === false && (
            <span className="material-symbols-outlined text-xs text-zinc-400" title="Hidden">
              visibility_off
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400 truncate">
          {component.type}
        </p>
      </div>

      {/* Validation Error Indicator */}
      {hasErrors && (
        <span
          className="material-symbols-outlined text-sm text-red-400 flex-shrink-0"
          title={`${component.validation?.errors.length} error(s)`}
        >
          error
        </span>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Duplicate Button */}
        <button
          onClick={onDuplicate}
          className="p-1.5 rounded hover:bg-white/5 transition-colors"
          aria-label="Duplicate component"
          title="Duplicate"
        >
          <span className="material-symbols-outlined text-sm text-zinc-400">
            content_copy
          </span>
        </button>

        {/* Edit Button */}
        <button
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-blue-900/30 transition-colors"
          aria-label="Edit component"
          title="Edit"
        >
          <span className="material-symbols-outlined text-sm text-blue-400">
            edit
          </span>
        </button>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-900/30 transition-colors"
          aria-label="Delete component"
          title="Delete"
        >
          <span className="material-symbols-outlined text-sm text-red-400">
            delete
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * ComponentList with drag-and-drop reordering
 */
export function ComponentList({
  components,
  onReorder,
  onEditComponent,
  onDeleteComponent,
  onDuplicateComponent,
}: ComponentListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const componentIds = useMemo(() => components.map((c) => c.id), [components]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = components.findIndex((c) => c.id === active.id);
      const newIndex = components.findIndex((c) => c.id === over.id);

      const newOrder = arrayMove(components, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  if (components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <span className="material-symbols-outlined text-4xl text-zinc-600 mb-3">
          widgets
        </span>
        <p className="text-sm text-zinc-400 mb-1">
          No components yet
        </p>
        <p className="text-xs text-zinc-500">
          Click "Add Component" to get started
        </p>
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
            <SortableComponentItem
              key={component.id}
              component={component}
              onEdit={() => onEditComponent(component.id)}
              onDelete={() => onDeleteComponent(component.id)}
              onDuplicate={() => onDuplicateComponent(component.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
