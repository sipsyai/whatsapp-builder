/**
 * ScreenNode Usage Examples
 *
 * This file demonstrates how to use the ScreenNode component
 * in a ReactFlow canvas.
 */

import { ReactFlow, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ScreenNode, ScreenNodeData } from './ScreenNode';

// Register custom node types
const nodeTypes = {
  screenNode: ScreenNode,
};

/**
 * Example 1: Normal Screen with Components
 */
const normalScreenNode: Node<ScreenNodeData> = {
  id: 'WELCOME',
  type: 'screenNode',
  position: { x: 100, y: 100 },
  data: {
    id: 'WELCOME',
    title: 'Welcome Screen',
    terminal: false,
    components: [
      { type: 'TextHeading', label: 'Welcome to our store!' },
      { type: 'TextBody', label: 'Browse our products below' },
      { type: 'Image', label: 'Store banner' },
      { type: 'Footer', label: 'Continue' },
    ],
    outputHandles: [
      { id: 'continue', label: 'Continue' },
    ],
    onConfig: () => console.log('Configure WELCOME screen'),
    onDelete: () => console.log('Delete WELCOME screen'),
  },
};

/**
 * Example 2: Terminal Screen
 */
const terminalScreenNode: Node<ScreenNodeData> = {
  id: 'THANK_YOU',
  type: 'screenNode',
  position: { x: 500, y: 100 },
  data: {
    id: 'THANK_YOU',
    title: 'Thank You',
    terminal: true,
    components: [
      { type: 'TextHeading', label: 'Thank you!' },
      { type: 'TextBody', label: 'Your order has been confirmed' },
      { type: 'TextCaption', label: 'Order #12345' },
    ],
    outputHandles: [],
    onConfig: () => console.log('Configure THANK_YOU screen'),
    onDelete: () => console.log('Delete THANK_YOU screen'),
  },
};

/**
 * Example 3: Screen with Multiple Navigation Actions
 */
const multipleActionsNode: Node<ScreenNodeData> = {
  id: 'PRODUCT_CATEGORY',
  type: 'screenNode',
  position: { x: 100, y: 400 },
  data: {
    id: 'PRODUCT_CATEGORY',
    title: 'Select Product Category',
    terminal: false,
    components: [
      { type: 'TextHeading', label: 'Choose a category' },
      { type: 'NavigationList', label: 'Category list' },
      { type: 'Footer', label: 'View Electronics' },
      { type: 'Footer', label: 'View Clothing' },
      { type: 'Footer', label: 'View Home & Garden' },
    ],
    outputHandles: [
      { id: 'electronics', label: 'View Electronics' },
      { id: 'clothing', label: 'View Clothing' },
      { id: 'home', label: 'View Home & Garden' },
    ],
    onConfig: () => console.log('Configure PRODUCT_CATEGORY screen'),
    onDelete: () => console.log('Delete PRODUCT_CATEGORY screen'),
  },
};

/**
 * Example 4: Screen with Many Components (shows preview limit)
 */
const manyComponentsNode: Node<ScreenNodeData> = {
  id: 'CHECKOUT',
  type: 'screenNode',
  position: { x: 500, y: 400 },
  data: {
    id: 'CHECKOUT',
    title: 'Checkout Form',
    terminal: false,
    components: [
      { type: 'TextHeading', label: 'Complete your order' },
      { type: 'TextInput', label: 'Full Name' },
      { type: 'TextInput', label: 'Email' },
      { type: 'TextInput', label: 'Phone' },
      { type: 'TextArea', label: 'Shipping Address' },
      { type: 'Dropdown', label: 'Payment Method' },
      { type: 'OptIn', label: 'Subscribe to newsletter' },
      { type: 'Footer', label: 'Complete Order' },
    ],
    outputHandles: [
      { id: 'submit', label: 'Complete Order' },
    ],
    onConfig: () => console.log('Configure CHECKOUT screen'),
    onDelete: () => console.log('Delete CHECKOUT screen'),
  },
};

/**
 * Example 5: Complete Flow with Edges
 */
export function ScreenNodeExample() {
  const nodes = [
    normalScreenNode,
    terminalScreenNode,
    multipleActionsNode,
    manyComponentsNode,
  ];

  const edges = [
    {
      id: 'e1',
      source: 'WELCOME',
      target: 'PRODUCT_CATEGORY',
      sourceHandle: 'continue',
    },
    {
      id: 'e2',
      source: 'PRODUCT_CATEGORY',
      target: 'CHECKOUT',
      sourceHandle: 'electronics',
    },
    {
      id: 'e3',
      source: 'CHECKOUT',
      target: 'THANK_YOU',
      sourceHandle: 'submit',
    },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      />
    </div>
  );
}

/**
 * Helper Function: Extract Output Handles from Screen Data
 *
 * This function shows how to extract navigate actions from a screen's
 * components (specifically Footer components) to create output handles.
 */
export function extractOutputHandles(screen: {
  components: Array<{
    type: string;
    config?: {
      'on-click-action'?: {
        name: string;
        next?: { name: string };
      };
      label?: string;
    };
  }>;
}): Array<{ id: string; label: string }> {
  const handles: Array<{ id: string; label: string }> = [];

  screen.components.forEach((component, index) => {
    if (component.type === 'Footer') {
      const action = component.config?.['on-click-action'];
      if (action?.name === 'navigate' && action.next?.name) {
        handles.push({
          id: `footer-${index}`,
          label: component.config?.label || `Navigate to ${action.next.name}`,
        });
      }
    }
  });

  return handles;
}

/**
 * Helper Function: Convert Builder Screen to ScreenNodeData
 *
 * Shows how to transform a BuilderScreen into ScreenNodeData
 * for use with the ScreenNode component.
 */
export function builderScreenToNodeData(screen: {
  id: string;
  title?: string;
  terminal?: boolean;
  components: Array<{
    id: string;
    type: string;
    label?: string;
    config?: any;
  }>;
}): ScreenNodeData {
  // Extract component previews
  const components = screen.components.map(c => ({
    type: c.type,
    label: c.label || c.config?.label,
  }));

  // Extract output handles from Footer components with navigate actions
  const outputHandles: Array<{ id: string; label: string }> = [];
  screen.components.forEach(component => {
    if (component.type === 'Footer') {
      const action = component.config?.['on-click-action'];
      if (action?.name === 'navigate' && action.next?.name) {
        outputHandles.push({
          id: component.id,
          label: component.config?.label || `Go to ${action.next.name}`,
        });
      }
    }
  });

  return {
    id: screen.id,
    title: screen.title || screen.id,
    terminal: screen.terminal,
    components,
    outputHandles,
  };
}
