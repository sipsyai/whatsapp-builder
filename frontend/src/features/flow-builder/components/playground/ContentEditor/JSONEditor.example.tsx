/**
 * JSONEditor Component Usage Examples
 *
 * This file demonstrates how to use the JSONEditor component
 * for editing WhatsApp Flow screens in JSON format.
 */

import React, { useState } from 'react';
import { JSONEditor } from './JSONEditor';
import type { BuilderScreen } from '../../../types/builder.types';

/**
 * Example 1: Basic Usage
 *
 * Shows the simplest way to use JSONEditor with a screen
 */
export function BasicJSONEditorExample() {
  const [screen, setScreen] = useState<BuilderScreen>({
    id: 'WELCOME',
    title: 'Welcome Screen',
    terminal: false,
    components: [
      {
        id: 'heading-1',
        type: 'TextHeading',
        config: {
          type: 'TextHeading',
          text: 'Welcome to our Flow!',
        },
        validation: { isValid: true, errors: [], warnings: [] },
      },
      {
        id: 'body-1',
        type: 'TextBody',
        config: {
          type: 'TextBody',
          text: 'This is a sample screen with some components.',
        },
        validation: { isValid: true, errors: [], warnings: [] },
      },
    ],
    validation: { isValid: true, errors: [], warnings: [] },
  });

  const handleUpdateScreen = (updates: Partial<BuilderScreen>) => {
    setScreen(prev => ({ ...prev, ...updates }));
    console.log('Screen updated:', updates);
  };

  return (
    <div className="h-screen p-4 bg-zinc-950">
      <div className="h-full max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-white mb-4">JSON Editor - Basic Example</h1>
        <JSONEditor
          screen={screen}
          onUpdateScreen={handleUpdateScreen}
        />
      </div>
    </div>
  );
}

/**
 * Example 2: Split View (Visual + JSON)
 *
 * Shows JSONEditor alongside a visual preview
 */
export function SplitViewJSONEditorExample() {
  const [screen, setScreen] = useState<BuilderScreen>({
    id: 'FORM',
    title: 'Registration Form',
    terminal: false,
    data: {
      name: '',
      email: '',
    },
    components: [
      {
        id: 'heading-1',
        type: 'TextHeading',
        config: {
          type: 'TextHeading',
          text: 'Register',
        },
        validation: { isValid: true, errors: [], warnings: [] },
      },
      {
        id: 'input-1',
        type: 'TextInput',
        config: {
          type: 'TextInput',
          name: 'name',
          label: 'Full Name',
          required: true,
        },
        validation: { isValid: true, errors: [], warnings: [] },
      },
      {
        id: 'input-2',
        type: 'TextInput',
        config: {
          type: 'TextInput',
          name: 'email',
          label: 'Email',
          'input-type': 'email',
          required: true,
        },
        validation: { isValid: true, errors: [], warnings: [] },
      },
    ],
    validation: { isValid: true, errors: [], warnings: [] },
  });

  const handleUpdateScreen = (updates: Partial<BuilderScreen>) => {
    setScreen(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-screen p-4 bg-zinc-950">
      <div className="h-full grid grid-cols-2 gap-4">
        {/* Visual Preview */}
        <div className="border border-zinc-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Visual Preview</h2>
          <div className="space-y-3">
            <div className="text-xl font-bold text-white">{screen.title}</div>
            {screen.components.map(component => (
              <div
                key={component.id}
                className="p-3 bg-zinc-800 border border-zinc-700 rounded"
              >
                <div className="text-xs text-zinc-400 mb-1">{component.type}</div>
                <div className="text-sm text-white">
                  {JSON.stringify(component.config, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* JSON Editor */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">JSON Editor</h2>
          <JSONEditor
            screen={screen}
            onUpdateScreen={handleUpdateScreen}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: With Custom Styling
 *
 * Shows how to apply custom CSS classes to JSONEditor
 */
export function StyledJSONEditorExample() {
  const [screen, setScreen] = useState<BuilderScreen>({
    id: 'CHECKOUT',
    title: 'Checkout',
    terminal: true,
    components: [
      {
        id: 'heading-1',
        type: 'TextHeading',
        config: {
          type: 'TextHeading',
          text: 'Complete Your Order',
        },
        validation: { isValid: true, errors: [], warnings: [] },
      },
      {
        id: 'footer-1',
        type: 'Footer',
        config: {
          type: 'Footer',
          label: 'Submit Order',
          'on-click-action': {
            name: 'complete',
            payload: {},
          },
        },
        validation: { isValid: true, errors: [], warnings: [] },
      },
    ],
    validation: { isValid: true, errors: [], warnings: [] },
  });

  const handleUpdateScreen = (updates: Partial<BuilderScreen>) => {
    setScreen(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-screen p-4 bg-gradient-to-br from-zinc-900 to-zinc-950">
      <div className="h-full max-w-5xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Custom Styled JSON Editor</h1>
          <p className="text-zinc-400 mt-1">
            Edit your WhatsApp Flow screen with custom styling
          </p>
        </div>
        <JSONEditor
          screen={screen}
          onUpdateScreen={handleUpdateScreen}
          className="shadow-2xl"
        />
      </div>
    </div>
  );
}

/**
 * Example 4: Multiple Screens Tabs
 *
 * Shows JSONEditor switching between multiple screens
 */
export function MultiScreenJSONEditorExample() {
  const [screens, setScreens] = useState<BuilderScreen[]>([
    {
      id: 'SCREEN_1',
      title: 'Screen 1',
      terminal: false,
      components: [
        {
          id: 'heading-1',
          type: 'TextHeading',
          config: { type: 'TextHeading', text: 'First Screen' },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'SCREEN_2',
      title: 'Screen 2',
      terminal: false,
      components: [
        {
          id: 'heading-2',
          type: 'TextHeading',
          config: { type: 'TextHeading', text: 'Second Screen' },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
    },
  ]);

  const [activeIndex, setActiveIndex] = useState(0);

  const handleUpdateScreen = (updates: Partial<BuilderScreen>) => {
    setScreens(prev => prev.map((screen, index) =>
      index === activeIndex ? { ...screen, ...updates } : screen
    ));
  };

  return (
    <div className="h-screen p-4 bg-zinc-950">
      <div className="h-full max-w-5xl mx-auto flex flex-col gap-4">
        {/* Screen Tabs */}
        <div className="flex gap-2">
          {screens.map((screen, index) => (
            <button
              key={screen.id}
              onClick={() => setActiveIndex(index)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeIndex === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
              type="button"
            >
              {screen.title}
            </button>
          ))}
        </div>

        {/* JSON Editor */}
        <div className="flex-1 min-h-0">
          <JSONEditor
            screen={screens[activeIndex]}
            onUpdateScreen={handleUpdateScreen}
          />
        </div>
      </div>
    </div>
  );
}
