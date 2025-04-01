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

interface ChartDataPoint {
  subject: string;
  // Values for stacking
  base: number;
  middle: number;
  upper: number;
  // Actual values for tooltip
  lowerValue: number;
  middleValue: number;
  upperValue: number;
}

interface ScaledScoreChartProps {
  entries: SubjectEntry[];
  rangeMode: boolean;
  getScaledScore: (subject: string, result: string, scale: number) => number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="subject">{label}</p>
        <p className="lower">Lower Score: {data.lowerValue.toFixed(1)}</p>
        <p className="middle">Result Score: {data.middleValue.toFixed(1)}</p>
        <p className="upper">Upper Score: {data.upperValue.toFixed(1)}</p>
      </div>
    );
  }
  return null;
};

export const ScaledScoreChart: React.FC<ScaledScoreChartProps> = ({ entries, rangeMode, getScaledScore }) => {
  // Sort entries by scaled score instead of result
  const sortedEntries = [...entries].sort((a, b) => {
    const aScore = a.scaledScore || 0;
    const bScore = b.scaledScore || 0;
    return bScore - aScore;
  });

  // Transform data for Recharts
  const lowestScore = Math.min(...entries.filter(e => e.subject).map(e => {
    const score = e.scaledScore || 0;
    const lowerScore = e.subject ? getScaledScore(e.subject, e.lowerResult || '0', 0) : 0;
    return Math.min(score, lowerScore);
  }));
  const xAxisMin = Math.max(0, Math.floor((lowestScore - 10) / 10) * 10);  // Round down to nearest 10

  // Transform data for Recharts
  const chartData: ChartDataPoint[] = sortedEntries.map(entry => {
    const lowerScore = entry.subject ? getScaledScore(entry.subject, entry.lowerResult || '0', 0) : 0;
    const currentScore = entry.scaledScore || 0;
    const upperScore = entry.subject ? getScaledScore(entry.subject, entry.upperResult || '0', 0) : 0;

    // If all values are equal, add tiny offsets to create visual width
    const adjustedLowerScore = (lowerScore === currentScore && currentScore === upperScore) ? lowerScore - 0.1 : lowerScore;
    const adjustedUpperScore = (lowerScore === currentScore && currentScore === upperScore) ? upperScore + 0.1 : upperScore;

    // Shift all values relative to xAxisMin
    return {
      subject: entry.subject,
      // Values for stacking (relative heights)
      base: adjustedLowerScore - xAxisMin,
      middle: currentScore - adjustedLowerScore,
      upper: adjustedUpperScore - currentScore,
      // Actual values for tooltip
      lowerValue: lowerScore,
      middleValue: currentScore,
      upperValue: upperScore
    };
  });
  
  // Generate ticks from 0 to (100 - xAxisMin)
  const xAxisTicks = Array.from(
    { length: Math.ceil((100 - xAxisMin) / 10) + 1 },
    (_, i) => i * 10
  ).filter(tick => tick <= (100 - xAxisMin));

  return (
    <div className="scaled-score-chart">
      <h3>Scaled Score Range</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          barSize={50}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
          <XAxis 
            type="number" 
            domain={[0, 100 - xAxisMin]}
            ticks={xAxisTicks}
            tickFormatter={(value) => `${value + xAxisMin}`}
          />
          <YAxis 
            type="category" 
            dataKey="subject" 
            width={120}
            tick={{ fill: '#666' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {rangeMode ? (
            <>
              <Bar 
                dataKey="base" 
                stackId="a" 
                fill="transparent" 
                stroke="transparent"
              />
              <Bar 
                dataKey="middle" 
                stackId="a" 
                fill="#3584e4" 
                stroke="#000"
                strokeWidth={2}
              />
              <Bar 
                dataKey="upper" 
                stackId="a" 
                fill="#3584e4" 
                stroke="#000"
                strokeWidth={2}
              />
            </>
          ) : (
            <Bar 
              dataKey="middleValue" 
              fill="#3584e4"
              stroke="#000"
              strokeWidth={2}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 