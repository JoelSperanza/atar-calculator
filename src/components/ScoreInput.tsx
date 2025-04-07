import React, { KeyboardEvent } from 'react';
import './ScoreInput.css';
import { ValidationHint } from './ValidationHint';
import { Subject } from '../interfaces/types';

interface ScoreInputProps {
  subject: Subject;
  result: string;
  onResultChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  validationType: string;
  showValidationHint: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  isRangeMode?: boolean;
  lowerResult?: string;
  upperResult?: string;
  onLowerResultChange?: (value: string) => void;
  onUpperResultChange?: (value: string) => void;
  lowerInputRef?: React.RefObject<HTMLInputElement>;
  upperInputRef?: React.RefObject<HTMLInputElement>;
  onIncrement?: (field: 'result' | 'lowerResult' | 'upperResult') => void;
  onDecrement?: (field: 'result' | 'lowerResult' | 'upperResult') => void;
  scaledScore?: number;
}

export function ScoreInput({
  subject,
  result,
  onResultChange,
  onKeyDown,
  validationType,
  showValidationHint,
  inputRef,
  isRangeMode = false,
  lowerResult = '',
  upperResult = '',
  onLowerResultChange,
  onUpperResultChange,
  lowerInputRef,
  upperInputRef,
  onIncrement,
  onDecrement,
  scaledScore
}: ScoreInputProps) {
  const renderInputWithControls = (
    value: string,
    onChange: (value: string) => void,
    ref?: React.RefObject<HTMLInputElement>,
    field: 'result' | 'lowerResult' | 'upperResult' = 'result'
  ) => (
    <div className="result-input-container">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        ref={ref}
        className="score-input"
        disabled={!subject.name}
      />
      <div className="button-stack">
        <button 
          className="value-adjuster"
          onClick={() => onIncrement?.(field)}
          disabled={!subject.name}
        >
          ▲
        </button>
        <button 
          className="value-adjuster"
          onClick={() => onDecrement?.(field)}
          disabled={!subject.name}
        >
          ▼
        </button>
      </div>
    </div>
  );

  return (
    <div className="score-input-container">
      {!isRangeMode ? (
        <>
          {renderInputWithControls(result, onResultChange, inputRef, 'result')}
          {showValidationHint && (
            <ValidationHint validationType={validationType} />
          )}
        </>
      ) : (
        <div className="range-inputs">
          {renderInputWithControls(lowerResult, onLowerResultChange!, lowerInputRef, 'lowerResult')}
          <span className="range-separator">-</span>
          {renderInputWithControls(result, onResultChange, inputRef, 'result')}
          <span className="range-separator">-</span>
          {renderInputWithControls(upperResult, onUpperResultChange!, upperInputRef, 'upperResult')}
          {showValidationHint && (
            <ValidationHint validationType={validationType} />
          )}
        </div>
      )}
      {scaledScore !== undefined && (
        <div className="scaled-score">
          {scaledScore.toFixed(2)}
        </div>
      )}
    </div>
  );
} 