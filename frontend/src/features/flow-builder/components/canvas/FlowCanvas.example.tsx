/**
 * FlowCanvas Usage Example
 *
 * This example demonstrates how to use the FlowCanvas component
 * in a WhatsApp Flow Builder page.
 */

import React, { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import { FlowCanvas } from './FlowCanvas';
import { createEmptyScreen } from '../../types';
import type { ScreenNodeData, NavigationEdgeData, BuilderScreen } from '../../types';

export const FlowCanvasExample: React.FC = () => {
  // Initialize with a start screen
  const initialNodes: Node<ScreenNodeData>[] = [
    {
      id: 'start-screen',
      type: 'screen',
      position: { x: 250, y: 100 },
      data: {
        screen: {
          ...createEmptyScreen('start-screen'),
          title: 'Welcome Screen',
          components: [],
        },
        isTerminal: false,
        hasFooter: false,
        componentCount: 0,
        label: 'Welcome Screen',
        description: 'Initial screen for the flow',
      },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<NavigationEdgeData>>([]);

  // Handle node click - open properties panel
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node<ScreenNodeData>) => {
    console.log('Node clicked:', node);
    // Here you would typically:
    // 1. Set selected screen in state
    // 2. Open properties panel
    // 3. Load screen configuration
  }, []);

  // Handle edge click - edit navigation action
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge<NavigationEdgeData>) => {
    console.log('Edge clicked:', edge);
    // Here you would typically:
    // 1. Set selected edge in state
    // 2. Open edge editor modal
    // 3. Allow editing of action properties
  }, []);

  // Handle drop - add new screen to canvas
  const handleDrop = useCallback(
    (screen: BuilderScreen, position: { x: number; y: number }) => {
      console.log('Screen dropped:', screen, 'at', position);

      // Create a new node for the dropped screen
      const newNode: Node<ScreenNodeData> = {
        id: screen.id,
        type: 'screen',
        position,
        data: {
          screen,
          isTerminal: screen.terminal,
          hasFooter: screen.components.some((c) => c.type === 'Footer'),
          componentCount: screen.components.length,
          label: screen.title || screen.id,
          description: screen.title ? undefined : 'Untitled screen',
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-[#23482f] px-6 py-3 bg-background-light dark:bg-background-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            WhatsApp Flow Builder
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {nodes.length} screen{nodes.length !== 1 ? 's' : ''}, {edges.length} connection
            {edges.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Add a new screen
              const newScreen = createEmptyScreen(`screen-${nodes.length}`);
              handleDrop(newScreen, { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 });
            }}
            className="px-4 py-2 bg-primary text-[#112217] rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Add Screen
          </button>
          <button
            onClick={() => {
              console.log('Current Flow:', { nodes, edges });
            }}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-lg text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Log Flow
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
};

// To test drag & drop, you can add a sidebar with draggable screen templates:
export const FlowBuilderWithSidebar: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleDrop = useCallback(
    (screen: BuilderScreen, position: { x: number; y: number }) => {
      const newNode: Node<ScreenNodeData> = {
        id: screen.id,
        type: 'screen',
        position,
        data: {
          screen,
          isTerminal: screen.terminal,
          hasFooter: screen.components.some((c) => c.type === 'Footer'),
          componentCount: screen.components.length,
          label: screen.title || screen.id,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // Draggable screen template
  const onDragStart = (event: React.DragEvent, screenTemplate: BuilderScreen) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(screenTemplate));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-screen w-full flex">
      {/* Sidebar with draggable templates */}
      <aside className="w-64 bg-white dark:bg-[#193322] border-r border-zinc-200 dark:border-white/10 p-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">
          Screen Templates
        </h3>
        <div className="space-y-2">
          <div
            draggable
            onDragStart={(e) =>
              onDragStart(e, {
                ...createEmptyScreen(`screen-${Date.now()}`),
                title: 'Form Screen',
              })
            }
            className="p-3 bg-zinc-50 dark:bg-[#112217] rounded-lg cursor-grab active:cursor-grabbing border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-[#1a3523]"
          >
            <div className="font-medium text-sm text-zinc-900 dark:text-white">Form Screen</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Screen with form inputs
            </div>
          </div>
          <div
            draggable
            onDragStart={(e) =>
              onDragStart(e, {
                ...createEmptyScreen(`screen-${Date.now()}`),
                title: 'Confirmation',
                terminal: true,
              })
            }
            className="p-3 bg-zinc-50 dark:bg-[#112217] rounded-lg cursor-grab active:cursor-grabbing border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-[#1a3523]"
          >
            <div className="font-medium text-sm text-zinc-900 dark:text-white">
              Terminal Screen
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Final screen (no navigation)
            </div>
          </div>
        </div>
      </aside>

      {/* Canvas */}
      <div className="flex-1">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
};
