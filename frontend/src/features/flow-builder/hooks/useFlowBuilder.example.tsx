/**
 * useFlowBuilder Hook Usage Examples
 *
 * This file demonstrates various usage patterns for the useFlowBuilder hook.
 * These examples are for documentation purposes and testing.
 */

import React from 'react';
import { useFlowBuilder } from './useFlowBuilder';

// ============================================================================
// Example 1: Basic Flow Builder Setup
// ============================================================================

export const BasicFlowBuilderExample: React.FC = () => {
  const {
    flowName,
    flowVersion,
    screens,
    selectedScreenId,
    addScreen,
    selectScreen,
  } = useFlowBuilder({
    initialFlowName: 'My First Flow',
    initialFlowVersion: '7.2',
  });

  const handleAddScreen = () => {
    const newScreen = addScreen({
      title: 'Welcome Screen',
    });
    console.log('Added screen:', newScreen);
  };

  return (
    <div>
      <h1>{flowName} (v{flowVersion})</h1>
      <button onClick={handleAddScreen}>Add Screen</button>

      <div>
        <h2>Screens ({screens.length})</h2>
        {screens.map(screen => (
          <div
            key={screen.id}
            onClick={() => selectScreen(screen.id)}
            style={{
              padding: '10px',
              border: selectedScreenId === screen.id ? '2px solid blue' : '1px solid gray',
              cursor: 'pointer',
            }}
          >
            {screen.title}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Example 2: Screen Management
// ============================================================================

export const ScreenManagementExample: React.FC = () => {
  const {
    screens,
    selectedScreen,
    addScreen,
    updateScreen,
    deleteScreen,
    duplicateScreen,
  } = useFlowBuilder();

  const handleAddScreen = () => {
    addScreen({
      title: `Screen ${screens.length + 1}`,
      terminal: false,
    });
  };

  const handleUpdateScreen = () => {
    if (selectedScreen) {
      updateScreen(selectedScreen.id, {
        title: `${selectedScreen.title} (Updated)`,
      });
    }
  };

  const handleDuplicateScreen = () => {
    if (selectedScreen) {
      duplicateScreen(selectedScreen.id);
    }
  };

  const handleDeleteScreen = () => {
    if (selectedScreen) {
      deleteScreen(selectedScreen.id);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleAddScreen}>Add Screen</button>
        <button onClick={handleUpdateScreen} disabled={!selectedScreen}>
          Update Selected
        </button>
        <button onClick={handleDuplicateScreen} disabled={!selectedScreen}>
          Duplicate Selected
        </button>
        <button onClick={handleDeleteScreen} disabled={!selectedScreen}>
          Delete Selected
        </button>
      </div>

      {selectedScreen && (
        <div>
          <h3>Selected: {selectedScreen.title}</h3>
          <p>Components: {selectedScreen.components.length}</p>
          <p>Terminal: {selectedScreen.terminal ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 3: Component Management
// ============================================================================

export const ComponentManagementExample: React.FC = () => {
  const {
    selectedScreen,
    selectedComponentId,
    addComponent,
    updateComponent,
    deleteComponent,
    duplicateComponent,
    selectComponent,
  } = useFlowBuilder();

  const handleAddTextComponent = () => {
    if (selectedScreen) {
      addComponent(selectedScreen.id, {
        type: 'TextBody',
        config: {
          type: 'TextBody',
          text: 'Hello World',
        },
      });
    }
  };

  const handleAddInputComponent = () => {
    if (selectedScreen) {
      addComponent(selectedScreen.id, {
        type: 'TextInput',
        config: {
          type: 'TextInput',
          label: 'Enter your name',
          name: 'user_name',
          'input-type': 'text',
          required: true,
        },
      });
    }
  };

  const handleUpdateComponent = () => {
    if (selectedScreen && selectedComponentId) {
      updateComponent(selectedScreen.id, selectedComponentId, {
        label: 'Updated Component',
      });
    }
  };

  const handleDuplicateComponent = () => {
    if (selectedScreen && selectedComponentId) {
      duplicateComponent(selectedScreen.id, selectedComponentId);
    }
  };

  const handleDeleteComponent = () => {
    if (selectedScreen && selectedComponentId) {
      deleteComponent(selectedScreen.id, selectedComponentId);
    }
  };

  if (!selectedScreen) {
    return <div>Please select a screen first</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleAddTextComponent}>Add Text</button>
        <button onClick={handleAddInputComponent}>Add Input</button>
        <button onClick={handleUpdateComponent} disabled={!selectedComponentId}>
          Update Selected
        </button>
        <button onClick={handleDuplicateComponent} disabled={!selectedComponentId}>
          Duplicate Selected
        </button>
        <button onClick={handleDeleteComponent} disabled={!selectedComponentId}>
          Delete Selected
        </button>
      </div>

      <div>
        <h3>Components in {selectedScreen.title}</h3>
        {selectedScreen.components.map(component => (
          <div
            key={component.id}
            onClick={() => selectComponent(component.id)}
            style={{
              padding: '8px',
              margin: '4px',
              border: selectedComponentId === component.id ? '2px solid blue' : '1px solid gray',
              cursor: 'pointer',
            }}
          >
            {component.type} {component.label && `- ${component.label}`}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Example 4: Component Reordering
// ============================================================================

export const ComponentReorderingExample: React.FC = () => {
  const {
    selectedScreen,
    reorderComponents,
  } = useFlowBuilder();

  const handleMoveUp = (componentId: string) => {
    if (!selectedScreen) return;

    const components = selectedScreen.components;
    const index = components.findIndex(c => c.id === componentId);

    if (index > 0) {
      const newOrder = [...components.map(c => c.id)];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      reorderComponents(selectedScreen.id, newOrder);
    }
  };

  const handleMoveDown = (componentId: string) => {
    if (!selectedScreen) return;

    const components = selectedScreen.components;
    const index = components.findIndex(c => c.id === componentId);

    if (index < components.length - 1) {
      const newOrder = [...components.map(c => c.id)];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      reorderComponents(selectedScreen.id, newOrder);
    }
  };

  if (!selectedScreen) {
    return <div>Please select a screen first</div>;
  }

  return (
    <div>
      <h3>Reorder Components</h3>
      {selectedScreen.components.map((component, index) => (
        <div
          key={component.id}
          style={{
            padding: '8px',
            margin: '4px',
            border: '1px solid gray',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            {index + 1}. {component.type}
          </span>
          <div>
            <button
              onClick={() => handleMoveUp(component.id)}
              disabled={index === 0}
            >
              ↑
            </button>
            <button
              onClick={() => handleMoveDown(component.id)}
              disabled={index === selectedScreen.components.length - 1}
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Example 5: Complete Flow Builder with All Features
// ============================================================================

export const CompleteFlowBuilderExample: React.FC = () => {
  const builder = useFlowBuilder({
    initialFlowName: 'Complete Example Flow',
    initialFlowVersion: '7.2',
  });

  const {
    flowName,
    flowVersion,
    screens,
    selectedScreen,
    selectedComponentId,
    setFlowName,
    addScreen,
    addComponent,
    selectScreen,
  } = builder;

  // Initialize with a sample screen
  React.useEffect(() => {
    if (screens.length === 0) {
      const screen = addScreen({
        title: 'Welcome',
        terminal: false,
      });

      if (screen) {
        addComponent(screen.id, {
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Welcome to WhatsApp Flow',
          },
        });
      }
    }
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left Panel - Screen List */}
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px' }}>
        <div>
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <small>Version: {flowVersion}</small>
        </div>

        <button
          onClick={() => addScreen({ title: `Screen ${screens.length + 1}` })}
          style={{ width: '100%', marginTop: '10px' }}
        >
          + Add Screen
        </button>

        <div style={{ marginTop: '20px' }}>
          {screens.map(screen => (
            <div
              key={screen.id}
              onClick={() => selectScreen(screen.id)}
              style={{
                padding: '8px',
                margin: '4px 0',
                cursor: 'pointer',
                backgroundColor: selectedScreen?.id === screen.id ? '#e3f2fd' : 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{screen.title}</div>
              <small>{screen.components.length} components</small>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Panel - Component List */}
      <div style={{ flex: 1, padding: '10px' }}>
        {selectedScreen ? (
          <>
            <h2>{selectedScreen.title}</h2>

            <div style={{ marginBottom: '20px' }}>
              <button onClick={() => {
                addComponent(selectedScreen.id, {
                  type: 'TextBody',
                  config: { type: 'TextBody', text: 'New text' },
                });
              }}>
                Add Text
              </button>
              <button onClick={() => {
                addComponent(selectedScreen.id, {
                  type: 'TextInput',
                  config: { type: 'TextInput', label: 'Input', name: 'input', 'input-type': 'text', required: false },
                });
              }}>
                Add Input
              </button>
              <button onClick={() => {
                addComponent(selectedScreen.id, {
                  type: 'Footer',
                  config: { type: 'Footer', label: 'Continue', 'on-click-action': { name: 'complete' } },
                });
              }}>
                Add Footer
              </button>
            </div>

            <div>
              {selectedScreen.components.map((component, index) => (
                <div
                  key={component.id}
                  style={{
                    padding: '12px',
                    margin: '8px 0',
                    border: selectedComponentId === component.id ? '2px solid #2196f3' : '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <strong>{index + 1}.</strong> {component.type}
                    </span>
                    {component.label && <small>{component.label}</small>}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>
            Select a screen to view components
          </div>
        )}
      </div>

      {/* Right Panel - Properties (placeholder) */}
      <div style={{ width: '300px', borderLeft: '1px solid #ccc', padding: '10px' }}>
        <h3>Properties</h3>
        {selectedComponentId ? (
          <p>Component properties panel goes here</p>
        ) : (
          <p style={{ color: '#999' }}>Select a component to edit properties</p>
        )}
      </div>
    </div>
  );
};
