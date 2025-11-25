import { useCallback } from 'react';
import type { BuilderScreen, BuilderComponent } from '../../types';
import { getRendererForComponent } from './renderers';

/**
 * Props interface for ScreenPreview
 */
interface ScreenPreviewProps {
  screen: BuilderScreen;
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  onNavigate?: (screenId: string, payload?: any) => void;
  onComplete?: (payload: any) => void;
}

/**
 * ScreenPreview - Renders a single screen preview with all its components
 *
 * Renders WhatsApp Flow components with proper styling and interactivity
 */
export function ScreenPreview({
  screen,
  formData,
  onFormDataChange,
  onNavigate,
  onComplete,
}: ScreenPreviewProps) {
  // Separate footer from body components
  const footerComponent = screen.components.find((c) => c.type === 'Footer');
  const bodyComponents = screen.components.filter((c) => c.type !== 'Footer');

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#0d1912]">
      {/* Screen Header */}
      <div className="flex-shrink-0 bg-[#00a884] dark:bg-[#00a884] text-white">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Back Button */}
          <button
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Back"
          >
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>

          {/* Title */}
          <div className="flex-1">
            <h1 className="text-lg font-medium">{screen.title || 'Flow'}</h1>
          </div>

          {/* Menu Button */}
          <button
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Screen Body - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {bodyComponents.map((component) => (
            <ComponentRenderer
              key={component.id}
              component={component}
              formData={formData}
              onFormDataChange={onFormDataChange}
              onNavigate={onNavigate}
              onComplete={onComplete}
            />
          ))}
        </div>
      </div>

      {/* Screen Footer - Fixed at Bottom */}
      {footerComponent && (
        <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#112217]">
          <ComponentRenderer
            component={footerComponent}
            formData={formData}
            onFormDataChange={onFormDataChange}
            onNavigate={onNavigate}
            onComplete={onComplete}
          />
        </div>
      )}
    </div>
  );
}

/**
 * ComponentRenderer - Renders individual component based on type
 * Uses the new modular renderer components from ./renderers
 */
function ComponentRenderer({
  component,
  formData,
  onFormDataChange,
  onNavigate,
  onComplete,
}: {
  component: BuilderComponent;
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  onNavigate?: (screenId: string, payload?: any) => void;
  onComplete?: (payload: any) => void;
}) {
  const config = component.config;

  // Handle visibility
  const visible = component.visible !== undefined ? component.visible : true;
  if (!visible) return null;

  // Get the appropriate renderer component
  const RendererComponent = getRendererForComponent(component.type);

  if (!RendererComponent) {
    // Fallback for components without renderers
    return (
      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
        {component.type} (Preview not implemented)
      </div>
    );
  }

  // Handle action callback for action components (Footer, OptIn, EmbeddedLink)
  const handleAction = useCallback(
    (actionName: string, payload?: any) => {
      switch (actionName) {
        case 'navigate':
          if (onNavigate && payload?.next?.name) {
            onNavigate(payload.next.name, payload.payload);
          }
          break;
        case 'complete':
          if (onComplete) {
            onComplete(payload || {});
          }
          break;
        case 'data_exchange':
          // Handle data exchange action
          console.log('Data exchange action:', payload);
          break;
        case 'update_data':
          // Update form data with payload
          if (payload && typeof payload === 'object') {
            Object.entries(payload).forEach(([key, value]) => {
              onFormDataChange(key, value);
            });
          }
          break;
        case 'open_url':
          // Open URL in new tab
          if (payload?.url) {
            window.open(payload.url, '_blank', 'noopener,noreferrer');
          }
          break;
        default:
          console.warn('Unknown action:', actionName, payload);
      }
    },
    [onNavigate, onComplete, onFormDataChange]
  );

  // Prepare props based on component type
  const componentName = 'name' in config ? config.name : undefined;
  const rendererProps: any = {
    component: config,
    visible,
  };

  // Add value and onChange for form components
  if (componentName) {
    rendererProps.value = formData[componentName];
    rendererProps.onChange = onFormDataChange;
  }

  // Add onAction for action components
  if (component.type === 'Footer' || component.type === 'OptIn' || component.type === 'EmbeddedLink') {
    rendererProps.onAction = handleAction;
  }

  return <RendererComponent {...rendererProps} />;
}
