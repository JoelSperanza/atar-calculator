import React, { useRef, KeyboardEvent } from 'react';
import './SubjectSelector.css';

interface Subject {
  name: string;
  type: string;
  validation: string;
}

interface SubjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (subject: string) => void;
  suggestions: string[];
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
  onSuggestionSelect: (index: number) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SubjectSelector({
  value,
  onChange,
  onSelect,
  suggestions,
  showSuggestions,
  selectedSuggestionIndex,
  onSuggestionSelect,
  onKeyDown,
  disabled = false,
  placeholder = "Enter subject name"
}: SubjectSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="subject-input-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="subject-input"
        placeholder={placeholder}
        disabled={disabled}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
              onClick={() => onSuggestionSelect(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 