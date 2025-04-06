import { useState } from 'react'
import { SingleStudentForm } from './components/SingleStudentForm'
import { ScalingGraphs } from './components/ScalingGraphs'
import { EquivalentCalculator } from './components/EquivalentCalculator'
import './App.css'

type Mode = 'single' | 'cohort' | 'scaling' | 'equivalent' | null;

function App() {
  const [selectedMode, setSelectedMode] = useState<Mode>(null)

  return (
    <div className="app-container">
      <h1>ATAR Predictor</h1>
      {!selectedMode ? (
        <div className="button-container">
          <button 
            className="mode-button"
            onClick={() => setSelectedMode('single')}
          >
            Single Student ATAR
          </button>
          <button 
            className="mode-button"
            onClick={() => setSelectedMode('cohort')}
          >
            Cohort ATAR
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
            Equivalent Calculator
          </button>
        </div>
      ) : (
        <div className="mode-content">
          <div className="mode-header">
            <button 
              className="back-button"
              onClick={() => setSelectedMode(null)}
            >
              ← Back
            </button>
            <h2>
              {selectedMode === 'single' ? 'Single Student ATAR' :
               selectedMode === 'cohort' ? 'Cohort ATAR' :
               selectedMode === 'scaling' ? 'Scaling Graphs' :
               'Equivalent Calculator'}
            </h2>
          </div>
          <div className="mode-body">
            {selectedMode === 'single' ? (
              <SingleStudentForm />
            ) : selectedMode === 'cohort' ? (
              <div>Cohort prediction coming soon...</div>
            ) : selectedMode === 'scaling' ? (
              <ScalingGraphs />
            ) : (
              <EquivalentCalculator />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App 