import React, { useState } from 'react';
import './FormHeader.css';

interface FormHeaderProps {
  loadingState: {
    isLoading: boolean;
    error: string | null;
  };
  rangeMode: boolean;
  setRangeMode: (mode: boolean) => void;
  onQuickRange?: (range: number) => void;
}

export function FormHeader({
  loadingState,
  rangeMode,
  setRangeMode,
  onQuickRange
}: FormHeaderProps) {
  const [quickRangeValue, setQuickRangeValue] = useState<string>('');

  const handleQuickRange = () => {
    const range = parseInt(quickRangeValue);
    console.log('FormHeader quick range value:', {
      rawValue: quickRangeValue,
      parsedRange: range,
      type: typeof range
    });
    if (!isNaN(range) && range >= 0 && range <= 10) {
      onQuickRange?.(range);
      setQuickRangeValue('');
    }
  };

  if (loadingState.isLoading) {
    return <div className="loading-message">Loading subject data...</div>;
  }

  if (loadingState.error) {
    return <div className="error-message">{loadingState.error}</div>;
  }

  return (
    <div className="form-header">
      <div className="form-controls">
        <label className="range-mode-label">
          Range Mode:
          <input
            type="checkbox"
            checked={rangeMode}
            onChange={(e) => setRangeMode(e.target.checked)}
            className="range-mode-toggle"
          />
        </label>
        <div className="quick-range-controls">
          <input
            type="number"
            min="0"
            max="10"
            value={quickRangeValue}
            onChange={(e) => setQuickRangeValue(e.target.value)}
            placeholder="Range ±"
            className="quick-range-input"
          />
          <button 
            onClick={handleQuickRange}
            className="quick-range-button"
            disabled={!quickRangeValue || parseInt(quickRangeValue) < 0 || parseInt(quickRangeValue) > 10}
          >
            Quick Range
          </button>
        </div>
      </div>
    </div>
  );
} 