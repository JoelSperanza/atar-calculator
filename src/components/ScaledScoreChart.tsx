import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ScaledScoreChart.css';

interface SubjectEntry {
  subject: string;
  result: string;
  lowerResult: string;
  upperResult: string;
  originalIndex: number;
  scaledScore?: number;
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
  const chartData = sortedEntries.map(entry => ({
    subject: entry.subject,
    scaledScore: entry.scaledScore || 0,
    // Only include range data if in range mode
    ...(rangeMode && {
      lowerScaledScore: entry.scaledScore, // This will be updated with actual lower scaled score
      upperScaledScore: entry.scaledScore, // This will be updated with actual upper scaled score
    })
  }));

  return (
    <div className="scaled-score-chart">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="subject" />
          <Tooltip />
          <Bar dataKey="scaledScore" fill="#82ca9d" />
          {rangeMode && (
            <>
              <Bar dataKey="lowerScaledScore" fill="#82ca9d" fillOpacity={0.3} />
              <Bar dataKey="upperScaledScore" fill="#82ca9d" fillOpacity={0.3} />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 