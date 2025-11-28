import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { BuilderScreen } from '../../../types/builder.types';

export interface JSONEditorProps {
  screen: BuilderScreen;
  onUpdateScreen: (updates: Partial<BuilderScreen>) => void;
  className?: string;
}

/**
 * JSONEditor - Monaco Editor-based JSON editing for WhatsApp Flow screens
 *
 * Features:
 * - Two-way sync between screen and JSON
 * - JSON validation with error display
 * - Format and copy utilities
 * - Debounced updates to prevent performance issues
 */
export const JSONEditor: React.FC<JSONEditorProps> = ({
  screen,
  onUpdateScreen,
  className = '',
}) => {
  const [jsonValue, setJsonValue] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseErrorLine, setParseErrorLine] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Screen to JSON conversion
  const screenToJSON = useCallback((screen: BuilderScreen): object => ({
    id: screen.id,
    title: screen.title,
    terminal: screen.terminal,
    data: screen.data || {},
    layout: {
      type: 'SingleColumnLayout',
      children: screen.components.map(c => ({
        type: c.type,
        ...c.config,
      })),
    },
  }), []);

  // JSON to Screen conversion
  const jsonToScreen = useCallback((json: any, originalScreen: BuilderScreen): Partial<BuilderScreen> => {
    try {
      return {
        title: json.title || originalScreen.title,
        terminal: json.terminal ?? originalScreen.terminal,
        data: json.data || {},
        components: (json.layout?.children || []).map((child: any, index: number) => ({
          id: originalScreen.components[index]?.id || `component-${Date.now()}-${index}`,
          type: child.type,
          config: { ...child },
          validation: { isValid: true, errors: [], warnings: [] },
        })),
      };
    } catch (error) {
      console.error('Failed to convert JSON to screen:', error);
      return {};
    }
  }, []);

  // Initialize JSON from screen
  useEffect(() => {
    const json = screenToJSON(screen);
    const formatted = JSON.stringify(json, null, 2);
    setJsonValue(formatted);
    setParseError(null);
    setParseErrorLine(null);
  }, [screen.id]); // Only update when screen ID changes

  // Handle JSON editor changes (debounced)
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;

    setJsonValue(value);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer (500ms)
    debounceTimerRef.current = setTimeout(() => {
      try {
        const parsed = JSON.parse(value);
        const updates = jsonToScreen(parsed, screen);

        // Clear parse error
        setParseError(null);
        setParseErrorLine(null);

        // Update screen
        onUpdateScreen(updates);
      } catch (error) {
        // Handle parse error
        if (error instanceof SyntaxError) {
          setParseError(error.message);

          // Extract line number from error message
          const lineMatch = error.message.match(/line (\d+)/i);
          if (lineMatch) {
            setParseErrorLine(parseInt(lineMatch[1], 10));
          } else {
            setParseErrorLine(null);
          }
        } else {
          setParseError('Unknown error parsing JSON');
          setParseErrorLine(null);
        }
      }
    }, 500);
  }, [screen, jsonToScreen, onUpdateScreen]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Format JSON
  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonValue(formatted);
      setParseError(null);
      setParseErrorLine(null);
    } catch (error) {
      // Keep current value if invalid
      console.error('Cannot format invalid JSON:', error);
    }
  }, [jsonValue]);

  // Copy JSON to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonValue);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [jsonValue]);

  // Monaco Editor options
  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on' as const,
    formatOnPaste: true,
    formatOnType: true,
  }), []);

  return (
    <div className={`flex flex-col h-full border border-zinc-700 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-zinc-400">code</span>
          <span className="text-sm font-medium text-white">JSON Editor</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Format Button */}
          <button
            onClick={handleFormat}
            disabled={parseError !== null}
            className="px-2.5 py-1 text-xs font-medium rounded bg-zinc-700 text-white
                     hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center gap-1.5"
            title="Format JSON"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">auto_fix</span>
            Format
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-xs font-medium rounded bg-zinc-700 text-white
                     hover:bg-zinc-600 transition-colors flex items-center gap-1.5"
            title="Copy to clipboard"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">
              {isCopied ? 'check' : 'content_copy'}
            </span>
            {isCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={jsonValue}
          onChange={handleEditorChange}
          options={editorOptions}
        />
      </div>

      {/* Error Display */}
      {parseError && (
        <div className="px-3 py-2.5 bg-red-900/20 border-t border-red-800/30">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-red-400 mt-0.5">error</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-red-400">JSON Parse Error</div>
              <div className="text-xs text-red-300 mt-1">
                {parseError}
                {parseErrorLine && (
                  <span className="ml-2 text-red-400 font-medium">
                    Line {parseErrorLine}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Valid Indicator */}
      {!parseError && (
        <div className="px-3 py-1.5 bg-green-900/10 border-t border-green-800/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
            <span className="text-xs text-green-300">Valid JSON</span>
          </div>
        </div>
      )}
    </div>
  );
};
