import React from 'react';
import './ResultsDisplay.css';

interface RangedScores {
  lower: number;
  current: number;
  upper: number;
}

interface ResultsDisplayProps {
  teScore: number | null;
  atar: number | null;
  rangeMode?: boolean;
  rangedTEScores?: RangedScores;
  rangedATARs?: RangedScores;
}

function formatRange(scores: RangedScores): string {
  return `(${scores.lower.toFixed(1)} - ${scores.current.toFixed(1)} - ${scores.upper.toFixed(1)})`;
}

function formatATARRange(scores: RangedScores): string {
  return `(${scores.lower.toFixed(2)} - ${scores.current.toFixed(2)} - ${scores.upper.toFixed(2)})`;
}

export function ResultsDisplay({ 
  teScore, 
  atar, 
  rangeMode = false,
  rangedTEScores,
  rangedATARs 
}: ResultsDisplayProps) {
  if (!rangeMode) {
    return (
      <div className="scores-container">
        <div className="te-score-container">
          <span className="te-score-label">TE Score:</span>
          <span className="te-score-value">{teScore?.toFixed(1) ?? 'Not eligible'}</span>
        </div>
        <div className="atar-container">
          <span className="atar-label">ATAR:</span>
          <span className="atar-value">{atar?.toFixed(2) ?? 'Not eligible'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="scores-container">
      <div className="te-score-container">
        <span className="te-score-label">TE Score Range:</span>
        <span className="te-score-value">
          {rangedTEScores ? formatRange(rangedTEScores) : 'Not eligible'}
        </span>
      </div>
      <div className="atar-container">
        <span className="atar-label">ATAR Range:</span>
        <span className="atar-value">
          {rangedATARs ? formatATARRange(rangedATARs) : 'Not eligible'}
        </span>
      </div>
    </div>
  );
} 