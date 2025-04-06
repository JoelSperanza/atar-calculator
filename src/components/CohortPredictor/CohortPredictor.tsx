import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import './CohortPredictor.css'

type SubjectTypeMap = {
  [key: string]: string
}

interface GeneralSubject {
  subject: string;
  a: number;
  k: number;
}

interface AppliedSubject {
  subject: string;
  result: string;
  scaledScore: number;
}

interface StudentScores {
  studentName: string;
  subject: string;
  subjectType: string;
  lowerScaled: number;
  scaled: number;
  upperScaled: number;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

interface CohortPredictorProps {
  view: 'results' | 'ranged-results' | 'atars' | 'ranged-atars' | 'summary' | 'upload';
  onDataLoaded: () => void;
}

export function CohortPredictor({ view, onDataLoaded }: CohortPredictorProps) {
  const [data, setData] = useState<any[]>([])
  const [variation, setVariation] = useState<string>('0')
  const [subjectTypes, setSubjectTypes] = useState<SubjectTypeMap>({})
  const [generalSubjects, setGeneralSubjects] = useState<GeneralSubject[]>([])
  const [appliedSubjects, setAppliedSubjects] = useState<AppliedSubject[]>([])
  const [studentScores, setStudentScores] = useState<Record<string, StudentScores[]>>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'Student Name', direction: 'asc' })

  useEffect(() => {
    // Load subject types
    fetch('/data/Subject_type.csv')
      .then(response => response.text())
      .then(csv => {
        const lines = csv.split('\n')
        const types: SubjectTypeMap = {}
        lines.slice(1).forEach(line => {
          const [subject, type] = line.split(',')
          if (subject && type) {
            types[subject.trim()] = type.trim()
          }
        })
        setSubjectTypes(types)
      })

    // Load general subjects
    fetch('/data/general_subjects.csv')
      .then(response => response.text())
      .then(csv => {
        const lines = csv.split('\n')
        const subjects: GeneralSubject[] = []
        lines.slice(1).forEach(line => {
          const [subject, a, k] = line.split(',')
          if (subject && a && k) {
            subjects.push({
              subject: subject.trim(),
              a: parseFloat(a),
              k: parseFloat(k)
            })
          }
        })
        setGeneralSubjects(subjects)
      })

    // Load applied subjects
    fetch('/data/applied_subjects.csv')
      .then(response => response.text())
      .then(csv => {
        const lines = csv.split('\n')
        const subjects: AppliedSubject[] = []
        lines.slice(1).forEach(line => {
          const [subject, result, scaledScore] = line.split(',')
          if (subject && result && scaledScore) {
            subjects.push({
              subject: subject.trim(),
              result: result.trim(),
              scaledScore: parseFloat(scaledScore)
            })
          }
        })
        setAppliedSubjects(subjects)
      })
  }, [])

  // Update student scores when data changes
  useEffect(() => {
    if (data.length > 0) {
      const scores: Record<string, StudentScores[]> = {}
      
      data.forEach(row => {
        const keys = Object.keys(row)
        const studentName = row[keys[0]]
        const subject = row[keys[1]]
        const subjectType = getSubjectType(subject)
        const originalValue = row[keys[2]]
        const result = Number(originalValue)
        const bounds = calculateBounds(result, subjectType, originalValue)
        
        const lowerScaled = getScaledScore(subject, bounds.lower.toString())
        const scaled = getScaledScore(subject, originalValue)
        const upperScaled = getScaledScore(subject, bounds.upper.toString())
        
        if (!scores[studentName]) {
          scores[studentName] = []
        }
        
        scores[studentName].push({
          studentName,
          subject,
          subjectType,
          lowerScaled,
          scaled,
          upperScaled
        })
      })
      
      setStudentScores(scores)
    }
  }, [data, variation])

  const calculateTEScore = (scores: StudentScores[], useLower: boolean = false, useUpper: boolean = false): number | null => {
    // Split into general and applied subjects
    const generalScores = scores
      .filter(score => score.subjectType === 'General')
      .map(score => useLower ? score.lowerScaled : (useUpper ? score.upperScaled : score.scaled))
      .sort((a, b) => b - a)

    const appliedScores = scores
      .filter(score => score.subjectType === 'Applied/VET')
      .map(score => useLower ? score.lowerScaled : (useUpper ? score.upperScaled : score.scaled))
      .sort((a, b) => b - a)

    // Calculate Option A: Sum of top 5 general subjects
    const optionA = generalScores.length >= 5 
      ? generalScores.slice(0, 5).reduce((sum, score) => sum + score, 0)
      : null

    // Calculate Option B: Sum of top 4 general + best applied
    const optionB = (generalScores.length >= 4 && appliedScores.length >= 1)
      ? generalScores.slice(0, 4).reduce((sum, score) => sum + score, 0) + appliedScores[0]
      : null

    // Return the higher valid option, or null if neither is valid
    if (optionA === null && optionB === null) return null
    if (optionA === null) return optionB
    if (optionB === null) return optionA
    return Math.max(optionA, optionB)
  }

  const calculateGeneralScaledScore = (subject: string, rawScore: number): number => {
    const generalSubject = generalSubjects.find(s => s.subject.toLowerCase() === subject.toLowerCase())
    if (!generalSubject) return 0
    
    const { a, k } = generalSubject
    return Number((100 / (1 + Math.exp(-(a * rawScore + k)))).toFixed(2))
  }

  const lookupAppliedScaledScore = (subject: string, result: string): number => {
    const appliedSubject = appliedSubjects.find(s => 
      s.subject.toLowerCase() === subject.toLowerCase() && 
      s.result.toLowerCase() === result.toLowerCase()
    )
    return appliedSubject?.scaledScore || 0
  }

  const getScaledScore = (subject: string, result: string): number => {
    if (!subject || !result) return 0
    
    const subjectType = subjectTypes[subject]
    if (subjectType === 'General') {
      const numericResult = parseFloat(result)
      if (isNaN(numericResult)) return 0
      return calculateGeneralScaledScore(subject, numericResult)
    } else {
      return lookupAppliedScaledScore(subject, result)
    }
  }

  const getSubjectType = (subject: string): string => {
    return subjectTypes[subject] || 'Unknown'
  }

  const calculateBounds = (result: number, subjectType: string, originalValue: string) => {
    if (subjectType === 'Applied/VET') {
      return {
        lower: originalValue,
        upper: originalValue
      }
    }
    
    const variationNum = parseFloat(variation) || 0
    return {
      lower: Math.max(0, result - variationNum),
      upper: Math.min(100, result + variationNum)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: 'array' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(firstSheet)
      setData(data)
      onDataLoaded()
    }
    reader.readAsArrayBuffer(file)
  }

  const calculateATAR = (teScore: number | null): number | null => {
    if (teScore === null) return null;
    
    // Coefficients from TE_to_ATAR.csv
    const a = -7.3159E-14;  // x^6
    const b = 1.01772E-10;  // x^5
    const c = -4.37167E-08; // x^4
    const d = 1.93676E-06;  // x^3
    const e = 0.002716082;  // x^2
    const f = -0.271855355; // x^1
    const g = 11.34274504;  // constant

    // Calculate ATAR using 6th degree polynomial
    const atar = (a * Math.pow(teScore, 6)) +
                (b * Math.pow(teScore, 5)) +
                (c * Math.pow(teScore, 4)) +
                (d * Math.pow(teScore, 3)) +
                (e * Math.pow(teScore, 2)) +
                (f * teScore) +
                g;

    // Ensure ATAR is within valid bounds (30-99.95)
    if (atar < 30) return 30;
    if (atar > 99.95) return 99.95;

    // Round to nearest 0.05
    return Math.round(atar * 20) / 20;
  }

  const handleSort = (key: string) => {
    setSortConfig(current => {
      // If clicking a different column or current direction is desc, set to ascending
      if (current.key !== key || current.direction === 'desc') {
        return { key, direction: 'asc' };
      }
      // If clicking same column and current direction is asc, switch to descending
      return { key, direction: 'desc' };
    });
  }

  const getSortIndicator = (key: string) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }

  const formatScore = (score: number | null) => 
    score === null ? "ATAR Ineligible" : score.toFixed(2);

  const renderTableHeaders = () => {
    if (!data.length) return null;

    switch (view) {
      case 'results':
        return (
          <tr>
            <th onClick={() => handleSort('Student Name')}>Student Name {getSortIndicator('Student Name')}</th>
            <th onClick={() => handleSort('Subject')}>Subject {getSortIndicator('Subject')}</th>
            <th>Subject Type</th>
            <th onClick={() => handleSort('Result')}>Result {getSortIndicator('Result')}</th>
            <th>Scaled</th>
            <th>TE</th>
            <th>ATAR</th>
          </tr>
        );
      case 'atars':
        return (
          <tr>
            <th onClick={() => handleSort('Student Name')}>Student Name {getSortIndicator('Student Name')}</th>
            <th>TE</th>
            <th>ATAR</th>
          </tr>
        );
      case 'ranged-results':
        return (
          <tr>
            <th onClick={() => handleSort('Student Name')}>Student Name {getSortIndicator('Student Name')}</th>
            <th onClick={() => handleSort('Subject')}>Subject {getSortIndicator('Subject')}</th>
            <th>Subject Type</th>
            <th>Result Range</th>
            <th>Scaled Range</th>
            <th>TE Range</th>
            <th>ATAR Range</th>
          </tr>
        );
      case 'ranged-atars':
        return (
          <tr>
            <th onClick={() => handleSort('Student Name')}>Student Name {getSortIndicator('Student Name')}</th>
            <th>TE Range</th>
            <th>ATAR Range</th>
          </tr>
        );
      default:
        return null;
    }
  }

  const renderTableRow = (row: any, i: number) => {
    const keys = Object.keys(row);
    const studentName = row[keys[0]];
    const subject = row[keys[1]];
    const subjectType = getSubjectType(subject);
    const originalValue = row[keys[2]];
    const result = Number(originalValue);
    const bounds = calculateBounds(result, subjectType, originalValue);
    
    // Calculate scaled scores
    const lowerScaled = getScaledScore(subject, bounds.lower.toString());
    const scaled = getScaledScore(subject, originalValue);
    const upperScaled = getScaledScore(subject, bounds.upper.toString());
    
    // Get TE scores for this student
    const studentScoresList = studentScores[studentName] || [];
    const lowerTE = calculateTEScore(studentScoresList, true, false);
    const te = calculateTEScore(studentScoresList, false, false);
    const upperTE = calculateTEScore(studentScoresList, false, true);
    
    // Calculate ATAR scores
    const lowerATAR = calculateATAR(lowerTE);
    const atar = calculateATAR(te);
    const upperATAR = calculateATAR(upperTE);

    // Check if student is ATAR ineligible
    const isIneligible = te === null || atar === null;
    const isRangeIneligible = lowerTE === null || upperTE === null || lowerATAR === null || upperATAR === null;

    switch (view) {
      case 'results':
        return (
          <tr key={i}>
            <td>{studentName}</td>
            <td>{subject}</td>
            <td>{subjectType}</td>
            <td>{originalValue}</td>
            <td>{scaled.toFixed(2)}</td>
            <td>{te?.toFixed(2) ?? 'ATAR Ineligible'}</td>
            <td>{atar?.toFixed(2) ?? 'ATAR Ineligible'}</td>
          </tr>
        );

      case 'atars':
        // Only show each student once
        if (data.findIndex(r => r[keys[0]] === studentName) !== i) return null;
        return (
          <tr key={i}>
            <td>{studentName}</td>
            <td>{te?.toFixed(2) ?? 'ATAR Ineligible'}</td>
            <td>{atar?.toFixed(2) ?? 'ATAR Ineligible'}</td>
          </tr>
        );

      case 'ranged-results':
        return (
          <tr key={i}>
            <td>{studentName}</td>
            <td>{subject}</td>
            <td>{subjectType}</td>
            <td>{`${bounds.lower} - ${bounds.upper}`}</td>
            <td>{`${lowerScaled.toFixed(2)} - ${upperScaled.toFixed(2)}`}</td>
            <td>{isRangeIneligible ? 'ATAR Ineligible' : `${lowerTE.toFixed(2)} - ${upperTE.toFixed(2)}`}</td>
            <td>{isRangeIneligible ? 'ATAR Ineligible' : `${lowerATAR.toFixed(2)} - ${upperATAR.toFixed(2)}`}</td>
          </tr>
        );

      case 'ranged-atars':
        // Only show each student once
        if (data.findIndex(r => r[keys[0]] === studentName) !== i) return null;
        return (
          <tr key={i}>
            <td>{studentName}</td>
            <td>{isRangeIneligible ? 'ATAR Ineligible' : `${lowerTE.toFixed(2)} - ${upperTE.toFixed(2)}`}</td>
            <td>{isRangeIneligible ? 'ATAR Ineligible' : `${lowerATAR.toFixed(2)} - ${upperATAR.toFixed(2)}`}</td>
          </tr>
        );

      default:
        return null;
    }
  }

  const calculateSummaryStats = () => {
    // Get unique students and their ATARs
    const studentAtars = new Map();
    Object.entries(studentScores).forEach(([studentName, scores]) => {
      const te = calculateTEScore(scores, false, false);
      const atar = calculateATAR(te);
      if (atar !== null) {
        studentAtars.set(studentName, atar);
      }
    });

    // Calculate median ATAR
    const atars = Array.from(studentAtars.values()).sort((a, b) => a - b);
    const mid = Math.floor(atars.length / 2);
    const medianAtar = atars.length % 2 === 0
      ? ((atars[mid - 1] + atars[mid]) / 2).toFixed(2)
      : atars[mid].toFixed(2);

    // Calculate distribution
    const distribution = [
      { threshold: 99, count: 0 },
      { threshold: 95, count: 0 },
      { threshold: 90, count: 0 },
      { threshold: 80, count: 0 },
      { threshold: 70, count: 0 },
      { threshold: 60, count: 0 },
    ];

    atars.forEach(atar => {
      for (const entry of distribution) {
        if (atar >= entry.threshold) {
          entry.count++;
        }
      }
    });

    return {
      eligibleCount: atars.length,
      medianAtar,
      distribution: distribution.map(entry => ({
        threshold: entry.threshold,
        count: entry.count,
        percentage: ((entry.count / atars.length) * 100).toFixed(2)
      }))
    };
  };

  const renderSummaryView = () => {
    if (!data.length) return null;
    
    const stats = calculateSummaryStats();
    
    return (
      <div>
        <div className="summary-stats">
          <div className="stat-box">
            <h3>ATAR Eligible Students</h3>
            <div className="stat-value">{stats.eligibleCount}</div>
          </div>
          <div className="stat-box">
            <h3>Median ATAR</h3>
            <div className="stat-value">{stats.medianAtar}</div>
          </div>
        </div>
        
        <div className="atar-distribution">
          <h2>ATAR Distribution</h2>
          <table>
            <thead>
              <tr>
                <th>ATAR greater than</th>
                <th>No. of students</th>
                <th>% of ATAR eligible students</th>
              </tr>
            </thead>
            <tbody>
              {stats.distribution.map(entry => (
                <tr key={entry.threshold}>
                  <td>{entry.threshold}</td>
                  <td>{entry.count}</td>
                  <td>{entry.percentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      {(view === 'ranged-results' || view === 'ranged-atars') && (
        <div>
          <label>
            Variation: 
            <input 
              type="number" 
              min={0} 
              max={10} 
              value={variation} 
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  setVariation('')
                  return
                }
                const num = Number(value)
                if (!isNaN(num)) {
                  setVariation(Math.min(10, Math.max(0, num)).toString())
                }
              }}
            />
          </label>
        </div>
      )}
      {view === 'upload' && (
        <input type="file" accept=".xlsx" onChange={handleFileUpload} />
      )}
      {view === 'summary' ? (
        renderSummaryView()
      ) : (
        data.length > 0 && (
          <table>
            <thead>
              {renderTableHeaders()}
            </thead>
            <tbody>
              {data.map((row, i) => renderTableRow(row, i))}
            </tbody>
          </table>
        )
      )}
    </div>
  )
} 