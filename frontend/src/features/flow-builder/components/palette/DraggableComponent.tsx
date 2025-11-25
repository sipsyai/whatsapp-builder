import React, { useState } from 'react';
import type { Component } from '../../types/flow-json.types';

interface ComponentDefinition {
  type: Component['type'];
  name: string;
  icon: string;
  description: string;
  category: string;
}

interface DraggableComponentProps {
  component: ComponentDefinition;
  onAddClick?: (componentType: Component['type']) => void;
}

/**
 * Draggable Component Item
 *
 * Represents a single component in the palette that can be:
 * 1. Dragged onto the canvas
 * 2. Clicked to add via the + button
 * 3. Hovered to see tooltip with description
 */
export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  onAddClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  /**
   * Handle drag start - set the component type in the dataTransfer
   */
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/whatsapp-flow-component', component.type);
    event.dataTransfer.effectAllowed = 'copy';

    // Optional: Set a custom drag image
    if (event.currentTarget) {
      event.dataTransfer.setDragImage(event.currentTarget, 20, 20);
    }
  };

  /**
   * Handle add button click
   */
  const handleAddClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onAddClick) {
      onAddClick(component.type);
    }
  };

  /**
   * Get icon color based on category
   */
  const getIconColor = () => {
    switch (component.category) {
      case 'text':
        return 'text-blue-500';
      case 'input':
        return 'text-green-500';
      case 'selection':
        return 'text-purple-500';
      case 'date':
        return 'text-orange-500';
      case 'media':
        return 'text-pink-500';
      case 'navigation':
        return 'text-indigo-500';
      case 'control':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="relative">
      {/* Main Component Card */}
      <div className="flex items-center gap-2 group">
        {/* Draggable Component */}
        <div
          draggable
          onDragStart={handleDragStart}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex-1 flex items-center gap-3 p-2.5 bg-white dark:bg-[#23482f] rounded-lg cursor-grab active:cursor-grabbing border dark:border-transparent shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-[#1a3523] transition-all"
        >
          <span className={`material-symbols-outlined ${getIconColor()} text-xl flex-shrink-0`}>
            {component.icon}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
              {component.name}
            </span>
          </div>
          <span className="material-symbols-outlined text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            drag_indicator
          </span>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddClick}
          className="flex-shrink-0 p-2.5 bg-white dark:bg-[#23482f] rounded-lg border dark:border-transparent shadow-sm hover:bg-primary hover:text-[#112217] dark:hover:bg-primary text-primary transition-all"
          title={`Add ${component.name}`}
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-0 top-full mt-2 z-50 w-full max-w-xs">
          <div className="bg-gray-900 dark:bg-[#112217] text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700">
            <p className="font-semibold mb-1">{component.name}</p>
            <p className="text-gray-300">{component.description}</p>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <span className="text-gray-400">Type: </span>
              <code className="text-primary bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                {component.type}
              </code>
            </div>
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute left-4 -top-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-gray-900 dark:border-b-[#112217]" />
        </div>
      )}
    </div>
  );
};
