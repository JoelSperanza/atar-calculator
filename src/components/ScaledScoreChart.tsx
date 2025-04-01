import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getScaledScore } from '../utils/calculations';
import './ScaledScoreChart.css';

interface SubjectEntry {
  subject: string;
  result: string;
  lowerResult: string;
  upperResult: string;
  originalIndex: number;
  scaledScore?: number;
}

interface ChartDataPoint {
  subject: string;
  start: number;
  middle: number;
  upper: number;
  fullScore: number;
}

interface ScaledScoreChartProps {
  entries: SubjectEntry[];
  rangeMode: boolean;
}

export const ScaledScoreChart: React.FC<ScaledScoreChartProps> = ({ entries, rangeMode }) => {
  // Sort entries by result score (converting to numbers for comparison)
  const sortedEntries = [...entries].sort((a, b) => {
    const aNum = parseFloat(a.result) || 0;
    const bNum = parseFloat(b.result) || 0;
    return bNum - aNum;
  });

  // Transform data for Recharts
  const chartData: ChartDataPoint[] = sortedEntries.map(entry => {
    const currentScore = entry.scaledScore || 0;
    const lowerScore = entry.subject ? getScaledScore(entry.subject, entry.lowerResult || '0', 0) : 0;
    const upperScore = entry.subject ? getScaledScore(entry.subject, entry.upperResult || '0', 0) : 0;

    return {
      subject: entry.subject,
      start: Math.min(lowerScore, currentScore),
      middle: Math.abs(currentScore - lowerScore),
      upper: Math.max(0, upperScore - currentScore),
      fullScore: currentScore // For non-range mode
    };
  });

  return (
    <div className="scaled-score-chart">
      <h3>Scaled Score Range</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            ticks={[0, 25, 50, 75, 100]}
          />
          <YAxis 
            type="category" 
            dataKey="subject" 
            width={150}
            tick={{ fill: '#666' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'start') return ['Lower Score', value.toFixed(1)];
              if (name === 'middle') return ['Middle Range', value.toFixed(1)];
              if (name === 'upper') return ['Upper Range', value.toFixed(1)];
              return ['Scaled Score', value.toFixed(1)];
            }}
          />
          {rangeMode ? (
            <>
              <Bar dataKey="start" fill="#82ca9d" stackId="a" />
              <Bar dataKey="middle" fill="#82ca9d" stackId="a" />
              <Bar dataKey="upper" fill="#82ca9d" fillOpacity={0.3} stackId="a" />
            </>
          ) : (
            <Bar dataKey="fullScore" fill="#82ca9d" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 