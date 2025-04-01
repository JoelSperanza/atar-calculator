import React from 'react';
import './ResultsDisplay.css';

interface ResultsDisplayProps {
  teScore: number | null;
  atar: number | null;
}

export function ResultsDisplay({ teScore, atar }: ResultsDisplayProps) {
  return (
    <div className="scores-container">
      <div className="te-score-container">
        <span className="te-score-label">TE Score:</span>
        <span className="te-score-value">{teScore?.toFixed(2) ?? 'Not eligible'}</span>
      </div>
      <div className="atar-container">
        <span className="atar-label">ATAR:</span>
        <span className="atar-value">{atar?.toFixed(2) ?? 'Not eligible'}</span>
      </div>
    </div>
  );
} 