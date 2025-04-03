import { useState } from 'react'
import { SingleStudentForm } from './components/SingleStudentForm'
import './App.css'

function App() {
  const [selectedMode, setSelectedMode] = useState<'single' | 'cohort' | 'scaling' | null>(null)

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
          ) : (
            <h2>Scaling Graphs</h2>
          )}
        </div>
      )}
    </div>
  )
}

export default App 