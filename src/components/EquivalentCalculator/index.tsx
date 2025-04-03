import { useState, useEffect } from 'react';
import './EquivalentCalculator.css';

interface SubjectData {
  [subject: string]: number[];
}

export function EquivalentCalculator() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [score, setScore] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [comparisonSubjects, setComparisonSubjects] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(true);
  const [subjectData, setSubjectData] = useState<SubjectData>({});
  const [equivalentScores, setEquivalentScores] = useState<(number | string | null)[]>([null, null, null, null, null, null]);
  const [sourceScaledScore, setSourceScaledScore] = useState<number | null>(null);

  useEffect(() => {
    // Load subjects from equivalent score data
    const loadSubjects = async () => {
      try {
        const response = await fetch('/data/Equivalent_score_calculator_data.csv');
        const text = await response.text();
        const lines = text.split('\n');
        
        // Get header - these are the scores (0-100)
        const scoreValues = lines[0].split(',').slice(1).map(Number);
        
        // Process each subject's data
        const data: SubjectData = {};
        const subjectNames: string[] = [];
        
        lines.slice(1).forEach(line => {
          const [subject, ...values] = line.split(',');
          if (subject.trim()) {
            subjectNames.push(subject);
            data[subject] = values.map(Number);
          }
        });
        
        setSubjects(subjectNames);
        setSubjectData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load subjects:', error);
        setIsLoading(false);
      }
    };

    loadSubjects();
  }, []);

  // Calculate equivalent scores whenever inputs change
  useEffect(() => {
    if (!score || !selectedSubject || !subjectData[selectedSubject]) {
      setEquivalentScores([null, null, null, null, null, null]);
      setSourceScaledScore(null);
      return;
    }

    const sourceScore = Math.round(Number(score));
    
    // Get the scaled score for the source subject at the source score
    const scaledScore = interpolateScore(sourceScore, subjectData[selectedSubject]);
    setSourceScaledScore(scaledScore);

    // Calculate equivalent scores for each comparison subject
    const newEquivalentScores = comparisonSubjects.map(compSubject => {
      if (!compSubject || !subjectData[compSubject]) return null;
      
      // Find the equivalent score in the comparison subject
      return findNearestWholeScore(scaledScore, subjectData[compSubject]);
    });

    setEquivalentScores(newEquivalentScores);
  }, [score, selectedSubject, comparisonSubjects, subjectData]);

  // Helper function to interpolate between scores
  const interpolateScore = (score: number, scaledScores: number[]): number => {
    // Handle edge cases
    if (score <= 0) return scaledScores[100];
    if (score >= 100) return scaledScores[0];

    // Find the indices for interpolation
    const upperIndex = Math.ceil(100 - score);
    const lowerIndex = Math.floor(100 - score);

    // If we're exactly on a value, return it
    if (upperIndex === lowerIndex) return scaledScores[upperIndex];

    // Interpolate between the two closest values
    const upperScore = scaledScores[upperIndex];
    const lowerScore = scaledScores[lowerIndex];
    const fraction = score - Math.floor(score);

    return lowerScore + (upperScore - lowerScore) * (1 - fraction);
  };

  // Helper function to find nearest whole score
  const findNearestWholeScore = (targetScaledScore: number, scaledScores: number[]): string | number => {
    // Check if the target scaled score is higher than what's achievable
    if (targetScaledScore > scaledScores[0]) {
      return 'Not\nPossible';
    }

    // Find where our target scaled score fits in the array
    for (let i = 0; i < scaledScores.length - 1; i++) {
      const currentScaled = scaledScores[i];
      const nextScaled = scaledScores[i + 1];
      
      // If we're between two values, interpolate
      if (targetScaledScore <= currentScaled && targetScaledScore >= nextScaled) {
        const score = 100 - i;
        // Calculate the fraction between the two scores
        const fraction = (currentScaled - targetScaledScore) / (currentScaled - nextScaled);
        return score - fraction;
      }
    }

    // If we get here, the score must be at or below the lowest scaled score
    return 0;
  };

  // Helper function for consistent score formatting
  const formatScore = (score: number | string | null): string => {
    if (score === null) return '--';
    if (typeof score === 'string') return score;
    return score.toFixed(1);
  };

  // Helper function to get scaled score display
  const getScaledScoreDisplay = (subject: string, equivalentScore: number | string | null): string => {
    if (!subject) return '';
    if (typeof equivalentScore === 'number') {
      const scaledScore = interpolateScore(equivalentScore, subjectData[subject]);
      return `(scaled: ${scaledScore.toFixed(2)})`;
    }
    if (equivalentScore === 'Not\nPossible') {
      return `(max scaled: ${subjectData[subject][0].toFixed(2)})`;
    }
    return '';
  };

  // Helper function to get score classes
  const getScoreClasses = (equivalentScore: number | string | null, sourceScore: number): {
    scoreClass: string;
    subjectClass: string;
  } => {
    if (typeof equivalentScore !== 'number' || isNaN(sourceScore)) {
      return { scoreClass: '', subjectClass: '' };
    }

    if (equivalentScore < sourceScore) {
      return { scoreClass: 'better-score', subjectClass: 'better-score-subject' };
    }
    if (equivalentScore > sourceScore) {
      return { scoreClass: 'worse-score', subjectClass: 'worse-score-subject' };
    }
    return { scoreClass: '', subjectClass: '' };
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow integers between 0 and 100
    const intValue = parseInt(value);
    if (value === '' || (!isNaN(intValue) && intValue >= 0 && intValue <= 100)) {
      setScore(value);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleComparisonSubjectChange = (index: number) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newComparisonSubjects = [...comparisonSubjects];
    newComparisonSubjects[index] = e.target.value;
    setComparisonSubjects(newComparisonSubjects);
  };

  if (isLoading) {
    return <div>Loading subjects...</div>;
  }

  return (
    <div className="equivalent-calculator">
      <h2>Equivalent Score Calculator</h2>
      <div className="calculator-inputs">
        <div className="input-group">
          <span>A score of</span>
          <input
            type="number"
            min="0"
            max="100"
            value={score}
            onChange={handleScoreChange}
            placeholder="0-100"
            className="score-input"
          />
          <span>in</span>
          <select
            value={selectedSubject}
            onChange={handleSubjectChange}
            className="subject-select"
          >
            <option value="">Select a subject</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          {sourceScaledScore !== null && score && selectedSubject && (
            <span className="scaled-score">
              (scaled: {sourceScaledScore.toFixed(2)})
            </span>
          )}
        </div>
      </div>
      <div className="calculator-results">
        <p>is equivalent to:</p>
        <div className="button-group">
          <button 
            onClick={() => {
              const availableSubjects = subjects.filter(s => s !== selectedSubject);
              setComparisonSubjects(
                [...availableSubjects]
                  .sort(() => Math.random() - 0.5)
                  .slice(0, 6)
              );
            }}
            className="random-button"
            disabled={!score || !selectedSubject}
          >
            Random Subjects
          </button>
          <button 
            onClick={() => setComparisonSubjects(['', '', '', '', '', ''])}
            className="clear-button"
            disabled={comparisonSubjects.every(s => s === '')}
          >
            Clear Comparisons
          </button>
        </div>
        {comparisonSubjects.map((subject, index) => {
          const sourceScoreNum = Number(score);
          const equivalentScore = equivalentScores[index];
          const { scoreClass, subjectClass } = getScoreClasses(equivalentScore, sourceScoreNum);
          const scaledScoreDisplay = subject && equivalentScore !== null ? 
            getScaledScoreDisplay(subject, equivalentScore) : '';

          return (
            <div key={index} className="comparison-group">
              <div className="comparison-inputs">
                <span>a score of</span>
                <div className={`result-box ${scoreClass} ${typeof equivalentScore === 'string' ? 'impossible-score' : ''}`}>
                  {formatScore(equivalentScore)}
                </div>
                <span>in</span>
                <select
                  value={subject}
                  onChange={handleComparisonSubjectChange(index)}
                  className={`subject-select ${subjectClass}`}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subj => (
                    <option 
                      key={subj} 
                      value={subj}
                      disabled={subj === selectedSubject || 
                               (comparisonSubjects.includes(subj) && subj !== subject)}
                    >
                      {subj}
                    </option>
                  ))}
                </select>
                {scaledScoreDisplay && (
                  <span className="scaled-score">
                    {scaledScoreDisplay}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 