import { useState } from 'react'
import { SingleStudentForm } from './components/SingleStudentForm'
import { ScalingGraphs } from './components/ScalingGraphs'
import { EquivalentCalculator } from './components/EquivalentCalculator'
import './App.css'

function App() {
  const [selectedMode, setSelectedMode] = useState<'single' | 'cohort' | 'scaling' | 'equivalent' | null>(null)

  return (
    <div className="app-container">
      <h1>ATAR Predictor</h1>
      {!selectedMode ? (
        <div className="button-container">
          <button 
            className="mode-button"
            onClick={() => setSelectedMode('single')}
          >
            Single Student ATAR Predictions
          </button>
          <button 
            className="mode-button"
            onClick={() => setSelectedMode('cohort')}
          >
            Cohort ATAR Predictions
          </button>
          <button 
            className="mode-button"
            onClick={() => setSelectedMode('scaling')}
          >
            Scaling Graphs
          </button>
          <button 
            className="mode-button"
            onClick={() => setSelectedMode('equivalent')}
          >
            Equivalent Score Calculator
          </button>
        </div>
      ) : (
        <div>
          <button 
            className="back-button"
            onClick={() => setSelectedMode(null)}
          >
            ← Back
          </button>
          {selectedMode === 'single' ? (
            <SingleStudentForm />
          ) : selectedMode === 'cohort' ? (
            <h2>Cohort Mode</h2>
          ) : selectedMode === 'scaling' ? (
            <ScalingGraphs />
          ) : (
            <EquivalentCalculator />
          )}
        </div>
      )}
    </div>
  )
}

export default App 