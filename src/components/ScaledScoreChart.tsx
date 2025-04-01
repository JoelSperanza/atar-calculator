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
  const chartData: ChartDataPoint[] = sortedEntries.map(entry => {
    const lowerScore = entry.subject ? getScaledScore(entry.subject, entry.lowerResult || '0', 0) : 0;
    const currentScore = entry.scaledScore || 0;
    const upperScore = entry.subject ? getScaledScore(entry.subject, entry.upperResult || '0', 0) : 0;

    return {
      subject: entry.subject,
      // Values for stacking (relative heights)
      base: lowerScore,
      middle: currentScore - lowerScore,
      upper: upperScore - currentScore,
      // Actual values for tooltip
      lowerValue: lowerScore,
      middleValue: currentScore,
      upperValue: upperScore
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
                fill="#82ca9d"
                stroke="#000"
                strokeWidth={1}
              />
              <Bar 
                dataKey="upper" 
                stackId="a" 
                fill="#82ca9d" 
                fillOpacity={0.3}
                stroke="#000"
                strokeWidth={1}
              />
            </>
          ) : (
            <Bar 
              dataKey="middleValue" 
              fill="#82ca9d"
              stroke="#000"
              strokeWidth={1}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 