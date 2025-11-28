# Playground Mode - Quick Start Guide

## TL;DR

You can add a Simple/Playground mode to the Flow Builder **without any state synchronization** because the architecture is already well-designed:

- **useFlowBuilder** = Source of truth (mode-agnostic)
- **useFlowCanvas** = ReactFlow wrapper (only for Advanced mode)
- **FlowPreview** = Already works without ReactFlow

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FlowBuilderPage                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useFlowBuilder                                      │  │
│  │  ├── screens: BuilderScreen[]  ← SINGLE SOURCE      │  │
│  │  ├── addScreen()                                     │  │
│  │  ├── updateScreen()                                  │  │
│  │  ├── deleteScreen()                                  │  │
│  │  └── addComponent() / updateComponent() / ...       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│              ┌───────────┴───────────┐                      │
│              ↓                       ↓                      │
│  ┌──────────────────┐    ┌──────────────────────┐          │
│  │  SIMPLE MODE     │    │  ADVANCED MODE       │          │
│  ├──────────────────┤    ├──────────────────────┤          │
│  │                  │    │                      │          │
│  │ ScreenListPanel  │    │ useFlowCanvas        │          │
│  │      │           │    │      │               │          │
│  │      ↓           │    │      ↓               │          │
│  │ ScreenFormEditor │    │ ComponentPalette     │          │
│  │      │           │    │      +               │          │
│  │      ↓           │    │ FlowCanvas           │          │
│  │ ComponentList    │    │ (ReactFlow)          │          │
│  │                  │    │      +               │          │
│  │                  │    │ ScreenEditor         │          │
│  └──────────────────┘    └──────────────────────┘          │
│              ↓                       ↓                      │
│              └───────────┬───────────┘                      │
│                          ↓                                  │
│              ┌──────────────────────┐                       │
│              │  FlowPreview         │                       │
│              │  (Shared Component)  │                       │
│              └──────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     User Action                               │
│              (Add/Edit/Delete Screen/Component)               │
└───────────────────────────┬──────────────────────────────────┘
                            ↓
                  ┌─────────────────────┐
                  │  useFlowBuilder     │
                  │  updates            │
                  │  screens[]          │
                  └─────────┬───────────┘
                            ↓
            ┌───────────────┴───────────────┐
            ↓                               ↓
  ┌─────────────────┐            ┌──────────────────┐
  │  Simple Mode    │            │  Advanced Mode   │
  │  re-renders     │            │  useFlowCanvas   │
  │  forms          │            │  syncs nodes[]   │
  └─────────────────┘            └──────────────────┘
            ↓                               ↓
            └───────────────┬───────────────┘
                            ↓
                  ┌─────────────────────┐
                  │  FlowPreview        │
                  │  re-renders         │
                  └─────────────────────┘
```

## Minimal Implementation Example

### 1. Add Mode State

```typescript
// FlowBuilderPage.tsx
const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
```

### 2. Conditional Rendering

```typescript
// FlowBuilderPage.tsx
return (
  <ReactFlowProvider>
    <div className="flex flex-col h-screen">
      <header>
        <ModeToggle mode={mode} onChange={setMode} />
      </header>

      {mode === 'simple' ? (
        <SimpleMode flowBuilder={flowBuilder} />
      ) : (
        <AdvancedMode flowBuilder={flowBuilder} canvas={canvas} />
      )}
    </div>
  </ReactFlowProvider>
);
```

### 3. Simple Mode Component

```typescript
// components/simple-mode/SimpleMode.tsx
export function SimpleMode({ flowBuilder }: { flowBuilder: UseFlowBuilderReturn }) {
  return (
    <div className="flex">
      {/* Left: List of screens */}
      <ScreenList
        screens={flowBuilder.screens}
        onSelect={flowBuilder.selectScreen}
        onAdd={flowBuilder.addScreen}
      />

      {/* Center: Form editor for selected screen */}
      <ScreenEditor
        screen={flowBuilder.selectedScreen}
        onUpdate={(updates) =>
          flowBuilder.updateScreen(flowBuilder.selectedScreenId!, updates)
        }
      />

      {/* Right: Preview (reuse existing component) */}
      <FlowPreview screens={flowBuilder.screens} {...previewProps} />
    </div>
  );
}
```

## Key Points

### No Synchronization Needed
```typescript
// Both modes use THE SAME state reference
const flowBuilder = useFlowBuilder();

// Simple mode uses it directly:
flowBuilder.screens

// Advanced mode uses it via canvas:
useFlowCanvas({ screens: flowBuilder.screens })
```

### Mode Switching
```typescript
// Just change UI - state persists!
setMode('advanced'); // Instantly shows ReactFlow canvas
setMode('simple');   // Instantly shows form editor
// flowBuilder.screens remains unchanged!
```

### Save/Load Works Identically
```typescript
// Same for both modes
const flowJSON = {
  screens: flowBuilder.screens.map(builderScreenToFlowScreen)
};
```

## Implementation Checklist

- [ ] Add mode state to FlowBuilderPage
- [ ] Create ModeToggle component
- [ ] Create SimpleMode wrapper component
- [ ] Create ScreenListPanel component
- [ ] Create ScreenFormEditor component
- [ ] Make useFlowCanvas conditional (performance)
- [ ] Add localStorage for mode preference
- [ ] Test mode switching
- [ ] Test save/load in both modes

## File Structure

```
flow-builder/
├── FlowBuilderPage.tsx              ← Add mode state here
├── components/
│   ├── common/
│   │   └── ModeToggle.tsx           ← NEW
│   ├── simple-mode/                 ← NEW DIRECTORY
│   │   ├── SimpleMode.tsx
│   │   ├── ScreenListPanel.tsx
│   │   └── ScreenFormEditor.tsx
│   ├── canvas/                      ← Existing (Advanced mode)
│   ├── palette/                     ← Existing (Advanced mode)
│   └── preview/                     ← Existing (Shared)
└── hooks/
    └── useFlowBuilder.ts            ← NO CHANGES NEEDED!
```

## Timeline Estimate

- **Day 1**: ModeToggle + SimpleMode shell
- **Day 2**: ScreenListPanel
- **Day 3**: ScreenFormEditor
- **Day 4**: Polish + Testing
- **Day 5**: Documentation + Review

## Questions?

See full analysis in: `/frontend/PLAYGROUND_MODE_ANALYSIS.md`

---

**Remember**: The architecture is already perfect for this! You just need to add new UI components.
