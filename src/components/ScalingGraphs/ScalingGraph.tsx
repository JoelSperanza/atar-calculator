import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { loadScalingData } from '../../utils/scalingData'

interface ScalingGraphProps {
  selections: Array<{
    subject: string
    year: string
  }>
}

// Each data point will be a raw score and its corresponding scaled scores
interface DataPoint {
  rawScore: number
  [key: string]: number // For subject-year combinations
}

interface DotProps {
  cx: number;
  cy: number;
  value: number;
  payload: DataPoint;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  coordinate?: { x: number; y: number };
}

export function ScalingGraph({ selections }: ScalingGraphProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (selections.length === 0) {
        setData([])
        setIsLoading(false)
        return
      }

      try {
        const scalingData = await loadScalingData()
        
        // CSV columns are: 0,5,10,...,95,100
        const rawScores = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]
        
        // Create data points for each raw score
        const points = rawScores.map(rawScore => {
          const point: DataPoint = { rawScore }
          
          // Add scaled score for each selected subject-year
          selections.forEach(({ subject, year }) => {
            const row = scalingData.find(r => r.Subject === subject && r.Year === year)
            if (row) {
              const scaledScore = parseFloat(row[rawScore.toString()] || '')
              if (!isNaN(scaledScore)) {
                point[`${subject} (${year})`] = scaledScore
              }
            }
          })
          
          return point
        })

        setData(points)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selections])

  if (isLoading) {
    return <div>Loading graph data...</div>
  }

  if (selections.length === 0) {
    return <div>Select subjects and years to view scaling graphs</div>
  }

  // Fixed set of colors for lines
  const colors = ['#2196F3', '#4CAF50', '#F44336', '#9C27B0', '#FF9800', '#00BCD4', '#795548', '#607D8B', '#E91E63', '#673AB7']

  const CustomTooltip = ({ active, payload, label, coordinate }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0 || !coordinate) return null;

    // Find the closest point(s) to the mouse
    const { x, y } = coordinate;
    
    // Get the chart's container to calculate the scale
    const chartContainer = document.querySelector('.recharts-wrapper');
    if (!chartContainer) return null;
    
    const chartWidth = chartContainer.clientWidth - 40; // Subtract margins
    const chartHeight = chartContainer.clientHeight - 40; // Subtract margins
    
    const closePoints = payload.filter(entry => {
      if (!entry || typeof entry.value !== 'number') return false;

      // Convert the scaled score to y-coordinate
      // Chart is 0-100, with 0 at bottom, 100 at top
      const valuePercentage = entry.value / 100;
      const pointY = chartHeight - (valuePercentage * chartHeight) + 10; // Add top margin
      
      // Calculate vertical distance from mouse to point
      const distanceAbove = pointY - y;  // Positive when mouse is above point
      const distanceBelow = y - pointY;  // Positive when mouse is below point
      
      console.log('Point debug:', {
        mouseY: y,
        pointY,
        value: entry.value,
        valuePercentage,
        chartHeight,
        distanceAbove,
        distanceBelow,
        dataKey: entry.dataKey
      });
      
      // Show points that are within 10 pixels above or below
      return distanceAbove < 10 && distanceAbove > 0 || distanceBelow < 10 && distanceBelow > 0;
    });

    if (closePoints.length === 0) return null;

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {closePoints.map((entry, index) => {
          const value = typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value;
          return (
            <div key={entry.dataKey} style={{ 
              marginTop: index === 0 ? 0 : '8px',
              borderTop: index === 0 ? 'none' : '1px solid #eee',
              paddingTop: index === 0 ? 0 : '8px'
            }}>
              <p style={{ margin: 0, fontWeight: 500, color: entry.color }}>{entry.dataKey}</p>
              <p style={{ margin: '4px 0 0 0' }}>Raw Score: {label}</p>
              <p style={{ margin: '4px 0 0 0' }}>Scaled Score: {value}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 120, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="rawScore"
            type="number"
            domain={[0, 100]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            label={{ value: 'Raw Score', position: 'bottom', offset: 0 }}
          />
          <YAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            label={{ value: 'Scaled Score', angle: -90, position: 'left' }}
          />
          <Tooltip
            cursor={false}
            content={<CustomTooltip />}
          />
          <Legend 
            layout="vertical" 
            align="right" 
            verticalAlign="middle"
            wrapperStyle={{ 
              right: 10,
              width: 'auto',
              maxWidth: '120px'
            }}
          />
          {selections.map((selection, index) => {
            const key = `${selection.subject} (${selection.year})`
            return (
              <Line
                key={key}
                type="linear"
                dataKey={key}
                name={key}
                stroke={colors[index % colors.length]}
                dot={{ r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                strokeWidth={2}
                isAnimationActive={false}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 