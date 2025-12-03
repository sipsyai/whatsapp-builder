import React, { useState, useRef } from 'react';
import { VariablePicker } from './VariablePicker';
import type { VariableInputProps, VariableInfo } from './types';

export const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  currentNodeId,
  multiline = false,
  rows = 3
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<'above' | 'below'>('below');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleVariableSelect = (variable: VariableInfo) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || value.length;
      const end = input.selectionEnd || value.length;
      const newValue = value.slice(0, start) + `{{${variable.name}}}` + value.slice(end);
      onChange(newValue);

      // Move cursor after inserted variable
      setTimeout(() => {
        const newPos = start + variable.name.length + 4;
        input.setSelectionRange(newPos, newPos);
        input.focus();
      }, 0);
    } else {
      onChange(value + `{{${variable.name}}}`);
    }
    setShowPicker(false);
  };

  const openPicker = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPickerPosition(spaceBelow < 400 ? 'above' : 'below');
    }
    setShowPicker(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const variableText = e.dataTransfer.getData('text/plain');
    if (variableText && variableText.startsWith('{{')) {
      const input = inputRef.current;
      if (input) {
        const start = input.selectionStart || value.length;
        const newValue = value.slice(0, start) + variableText + value.slice(start);
        onChange(newValue);
      } else {
        onChange(value + variableText);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Check if value contains {{variable}} pattern
  const hasVariables = /\{\{.+?\}\}/.test(value);

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <InputComponent
          ref={inputRef as any}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          placeholder={placeholder}
          disabled={disabled}
          rows={multiline ? rows : undefined}
          className={`w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg
                     text-white placeholder-white/40 focus:outline-none focus:ring-2
                     focus:ring-primary/50 focus:border-primary font-mono text-sm
                     ${multiline ? 'resize-y min-h-[80px]' : ''}
                     ${hasVariables ? 'pr-16' : 'pr-10'}
                     ${className}`}
        />

        {/* Variable indicator badge */}
        {hasVariables && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
            VAR
          </span>
        )}

        {/* Variable picker button */}
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
          title="Insert variable"
        >
          <span className="material-symbols-outlined text-primary text-lg">
            data_object
          </span>
        </button>
      </div>

      {/* Variable Picker */}
      {showPicker && (
        <div
          className={`absolute left-0 right-0 ${pickerPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          style={{ zIndex: 100 }}
        >
          <VariablePicker
            onSelect={handleVariableSelect}
            onClose={() => setShowPicker(false)}
            currentNodeId={currentNodeId}
          />
        </div>
      )}
    </div>
  );
};
