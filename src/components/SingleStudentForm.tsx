import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import './SingleStudentForm.css';
import { ValidationHint } from './ValidationHint';
import { ResultsDisplay } from './ResultsDisplay';
import { SubjectSelector } from './SubjectSelector';
import { ScaledScoreChart } from './ScaledScoreChart';
import { Subject, Entry } from '../interfaces/types';
import { calculateTEScore, calculateATAR, getScaledScore } from '../utils/calculations';

export const VALIDATION_TYPES = {
  NUMERIC: "0 - 100",
  LETTER_GRADE: "A - E",
  PASS: "Pass"
} as const;

const VALIDATION_PATTERNS = {
  NUMERIC: "^[0-9]{1,3}$",
  LETTER_GRADE: "^[A-E]$",
  PASS: "^Pass$"
} as const;

const NUMERIC_BOUNDS = {
  MIN: 0,
  MAX: 100
} as const;

// Add letter grade comparison helpers
const LETTER_GRADE_VALUES = {
  'A+': 20,
  'A': 19,
  'A-': 18,
  'B+': 17,
  'B': 16,
  'B-': 15,
  'C+': 14,
  'C': 13,
  'C-': 12,
  'D+': 11,
  'D': 10,
  'D-': 9,
  'E': 0
} as const;

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

interface SubjectEntry {
  subject: string;
  result: string;
  lowerResult: string;
  upperResult: string;
  originalIndex: number;
  scaledScore?: number;
}

interface SubjectWithType {
  scaledScore: number;
  isGeneral: boolean;
}

interface CSVLoaderConfig<T> {
  path: string;
  mapRow: (columns: string[]) => T;
}

const loadCSV = async <T extends unknown>(config: CSVLoaderConfig<T>): Promise<T[]> => {
  try {
    const response = await fetch(config.path);
    if (!response.ok) {
      throw new Error(`Failed to load ${config.path}: ${response.statusText}`);
    }
    const csv = await response.text();
    const lines = csv.split('\n');
    return lines.slice(1).map(line => config.mapRow(line.split(',')));
  } catch (error) {
    console.error(`Error loading ${config.path}:`, error);
    return [];
  }
};

interface SubjectSelectionState {
  currentInput: string;
  showSuggestions: boolean;
  selectedIndex: number;
  activeInputIndex: number | null;
  filteredSubjects: string[];
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Add validation functions
const validateAndClampNumber = (value: string): string => {
  const num = parseInt(value);
  if (isNaN(num)) return '';
  return Math.max(NUMERIC_BOUNDS.MIN, Math.min(NUMERIC_BOUNDS.MAX, num)).toString();
};

const isValidLetterGrade = (value: string): boolean => {
  return value === '' || /^[A-E]$/.test(value);
};

const isValidPassResult = (value: string): boolean => {
  return value === 'Pass' || value === 'Fail';
};

const compareLetterGrades = (grade1: string, grade2: string): number => {
  if (!grade1 || !grade2) return 0;
  const value1 = LETTER_GRADE_VALUES[grade1 as keyof typeof LETTER_GRADE_VALUES] || 0;
  const value2 = LETTER_GRADE_VALUES[grade2 as keyof typeof LETTER_GRADE_VALUES] || 0;
  return value2 - value1;
};

export function SingleStudentForm() {
  // Data states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [generalSubjects, setGeneralSubjects] = useState<GeneralSubject[]>([]);
  const [appliedSubjects, setAppliedSubjects] = useState<AppliedSubject[]>([]);
  const [entries, setEntries] = useState<SubjectEntry[]>([]);
  
  // UI states
  const [numberOfSubjects, setNumberOfSubjects] = useState<number | null>(null);
  const [maxSubjectWidth, setMaxSubjectWidth] = useState<number>(0);
  const [rangeMode, setRangeMode] = useState(false);
  
  // Combined states
  const [selectionState, setSelectionState] = useState<SubjectSelectionState>({
    currentInput: '',
    showSuggestions: false,
    selectedIndex: -1,
    activeInputIndex: null,
    filteredSubjects: []
  });

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null
  });

  // Refs
  const resultInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lowerResultInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const upperResultInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const subjectInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load subjects from CSV files
  useEffect(() => {
    const loadAllData = async () => {
      setLoadingState({ isLoading: true, error: null });
      
      try {
        // Load subject types
        const subjectList = await loadCSV<Subject>({
          path: './data/Subject_type.csv',
          mapRow: ([name, type, validation]) => ({ name, type, validation })
        });
        setSubjects(subjectList);
        
        // Calculate max width based on longest subject name
        const maxLength = Math.max(...subjectList.map(s => s.name.length));
        setMaxSubjectWidth(maxLength + 4);

        // Load general subjects
        const generalSubjectList = await loadCSV<GeneralSubject>({
          path: './data/general_subjects.csv',
          mapRow: ([subject, a, k]) => ({
            subject,
            a: parseFloat(a),
            k: parseFloat(k)
          })
        });
        setGeneralSubjects(generalSubjectList);

        // Load applied subjects
        const appliedSubjectList = await loadCSV<AppliedSubject>({
          path: './data/applied_subjects.csv',
          mapRow: ([subject, result, scaledScore]) => ({
            subject,
            result,
            scaledScore: parseFloat(scaledScore)
          })
        });
        setAppliedSubjects(appliedSubjectList);
        
        setLoadingState({ isLoading: false, error: null });
      } catch (error) {
        setLoadingState({ 
          isLoading: false, 
          error: 'Failed to load subject data. Please refresh the page.' 
        });
        console.error('Error loading data:', error);
      }
    };

    loadAllData();
  }, []);

  // Initialize entries when number of subjects is set
  useEffect(() => {
    if (numberOfSubjects !== null && numberOfSubjects > 0) {
      const initialEntries = Array(numberOfSubjects).fill(null).map((_, index) => ({
        subject: '',
        result: '',
        lowerResult: '',
        upperResult: '',
        originalIndex: index
      }));
      setEntries(initialEntries);
      // Initialize refs arrays
      resultInputRefs.current = Array(numberOfSubjects).fill(null);
      lowerResultInputRefs.current = Array(numberOfSubjects).fill(null);
      upperResultInputRefs.current = Array(numberOfSubjects).fill(null);
      subjectInputRefs.current = Array(numberOfSubjects).fill(null);
    }
  }, [numberOfSubjects]);

  // Calculate scaled score using the logistic function for general subjects
  const calculateGeneralScaledScore = (subject: string, rawScore: number): number => {
    const generalSubject = generalSubjects.find(s => s.subject.toLowerCase() === subject.toLowerCase());
    if (!generalSubject) return 0;
    
    const { a, k } = generalSubject;
    return Number((100 / (1 + Math.exp(-(a * rawScore + k)))).toFixed(2));
  };

  // Look up scaled score for applied subjects
  const lookupAppliedScaledScore = (subject: string, result: string): number | undefined => {
    const appliedSubject = appliedSubjects.find(s => 
      s.subject.toLowerCase() === subject.toLowerCase() && 
      s.result.toLowerCase() === result.toLowerCase() // Case-insensitive result match
    );
    return appliedSubject?.scaledScore;
  };

  // Get scaled score based on subject type and result
  const getScaledScore = (subject: string, result: string, ATAR_SCALE: number): number => {
    if (!subject || !result) return 0;
    
    // First check if it's a Pass subject
    const isPassSubject = subjects.find(s => 
      s.name.toLowerCase() === subject.toLowerCase() && 
      s.validation === VALIDATION_TYPES.PASS
    );

    if (isPassSubject) {
      // For Pass subjects, treat them like Applied subjects
      const score = lookupAppliedScaledScore(subject, result);
      return score || 0;
    }

    // Then check if it's a general subject
    const isGeneral = generalSubjects.some(s => s.subject.toLowerCase() === subject.toLowerCase());
    
    if (isGeneral) {
      const numericResult = parseFloat(result);
      if (isNaN(numericResult)) return 0;
      const score = calculateGeneralScaledScore(subject, numericResult);
      return score;
    } else {
      // For applied subjects, look up the exact score based on the result (letter grade or Pass)
      const score = lookupAppliedScaledScore(subject, result);
      return score || 0;
    }
  };

  // Handle subject input changes
  const handleSubjectInput = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = { 
      ...newEntries[index], 
      subject: value,
      scaledScore: undefined // Reset scaled score when subject changes
    };
    setEntries(newEntries);
    
    setSelectionState(prev => ({
      ...prev,
      currentInput: value,
      activeInputIndex: index,
      showSuggestions: value.length > 0,
      selectedIndex: -1,
      filteredSubjects: value.length > 0 
        ? subjects
            .map(s => s.name)
            .filter(name => name.toLowerCase().startsWith(value.toLowerCase()))
        : []
    }));
  };

  // Handle subject selection
  const handleSubjectSelect = (index: number, subjectName: string) => {
    const subject = subjects.find(s => s.name === subjectName);
    const isPassSubject = subject?.validation?.trim() === VALIDATION_TYPES.PASS;
    
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      subject: subjectName,
      lowerResult: isPassSubject ? 'Pass' : '',
      result: isPassSubject ? 'Pass' : '',
      upperResult: isPassSubject ? 'Pass' : '',
      scaledScore: isPassSubject ? getScaledScore(subjectName, 'Pass', 0) : undefined
    };
    
    setEntries(newEntries);
    setSelectionState(prev => ({
      ...prev,
      currentInput: '',
      showSuggestions: false,
      selectedIndex: -1
    }));
    
    // Focus handling
    setTimeout(() => {
      if (isPassSubject) {
        // For Pass subjects, focus the next subject input if available
        if (index < numberOfSubjects! - 1) {
          subjectInputRefs.current[index + 1]?.focus();
        }
      } else {
        // For non-Pass subjects, focus the appropriate result input
        if (rangeMode) {
          lowerResultInputRefs.current[index]?.focus();
        } else {
          resultInputRefs.current[index]?.focus();
        }
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleSubjectKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Always check for exact match first (case-insensitive)
      const exactMatch = subjects.find(s => 
        s.name.toLowerCase() === selectionState.currentInput.toLowerCase()
      );
      if (exactMatch) {
        e.preventDefault();
        handleSubjectSelect(index, exactMatch.name);
        return;
      }

      // If there's only one suggestion, use it
      if (selectionState.filteredSubjects.length === 1) {
        e.preventDefault();
        handleSubjectSelect(index, selectionState.filteredSubjects[0]);
        return;
      }

      // If suggestions are shown and an item is selected
      if (selectionState.showSuggestions && selectionState.selectedIndex >= 0) {
        e.preventDefault();
        handleSubjectSelect(index, selectionState.filteredSubjects[selectionState.selectedIndex]);
        return;
      }
    }

    // Arrow key navigation
    if (selectionState.showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectionState(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.filteredSubjects.length - 1)
        }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectionState(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1)
        }));
      }
    }
  };

  // Helper function to get numeric value, treating blank as 0
  const getNumericValue = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to get letter grade value, treating blank as 0
  const getLetterGradeValue = (grade: string): number => {
    if (!grade || grade.trim() === '') return 0;
    return LETTER_GRADE_VALUES[grade as keyof typeof LETTER_GRADE_VALUES] || 0;
  };

  // Maintain L ≤ R ≤ U relationship when a field changes
  const maintainRubberBandLogic = (
    entry: SubjectEntry,
    field: 'lowerResult' | 'result' | 'upperResult',
    newValue: string
  ): SubjectEntry => {
    const subject = subjects.find(s => s.name === entry.subject);
    if (!subject) return entry;

    const isLetterGrade = subject.validation?.trim() === VALIDATION_TYPES.LETTER_GRADE;

    // Get values based on subject type
    const getValue = isLetterGrade ? getLetterGradeValue : getNumericValue;
    const L = field === 'lowerResult' ? getValue(newValue) : getValue(entry.lowerResult);
    const R = field === 'result' ? getValue(newValue) : getValue(entry.result);
    const U = field === 'upperResult' ? getValue(newValue) : getValue(entry.upperResult);

    let updatedL = entry.lowerResult;
    let updatedR = entry.result;
    let updatedU = entry.upperResult;

    switch (field) {
      case 'lowerResult':
        // If L increases beyond R or U, all values become L
        if (L > R || L > U) {
          updatedL = newValue;
          updatedR = newValue;
          updatedU = newValue;
        } else {
          updatedL = newValue;
        }
        break;

      case 'result':
        if (R < L) {
          // If R decreases below L, L becomes R
          updatedL = newValue;
          updatedR = newValue;
        } else if (R > U) {
          // If R increases beyond U, U becomes R
          updatedR = newValue;
          updatedU = newValue;
        } else {
          // R is within bounds, just update R
          updatedR = newValue;
        }
        break;

      case 'upperResult':
        // If U decreases below L or R, all values become U
        if (U < L || U < R) {
          updatedL = newValue;
          updatedR = newValue;
          updatedU = newValue;
        } else {
          updatedU = newValue;
        }
        break;
    }

    return {
      ...entry,
      lowerResult: updatedL,
      result: updatedR,
      upperResult: updatedU,
      scaledScore: getScaledScore(entry.subject, updatedR, 0) // Always use result for scaled score
    };
  };

  const handleResultInput = (index: number, value: string, field: 'lowerResult' | 'result' | 'upperResult') => {
    const entry = entries[index];
    const subject = subjects.find(s => s.name === entry.subject);
    
    if (!subject) return;

    const newEntries = [...entries];
    let validatedValue = value;

    switch (subject.validation?.trim()) {
      case VALIDATION_TYPES.NUMERIC:
        validatedValue = validateAndClampNumber(value);
        break;
      case VALIDATION_TYPES.LETTER_GRADE:
        validatedValue = value.toUpperCase();
        if (!isValidLetterGrade(validatedValue)) {
          validatedValue = entry[field];
        }
        break;
      case VALIDATION_TYPES.PASS:
        if (!isValidPassResult(value)) {
          validatedValue = entry[field];
        }
        break;
    }

    newEntries[index] = {
      ...entry,
      [field]: validatedValue
    };
    setEntries(newEntries);
  };

  const handleResultKeyDown = (index: number, field: 'lowerResult' | 'result' | 'upperResult', e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const entry = entries[index];
      const subject = subjects.find(s => s.name === entry.subject);
      
      if (!subject) return;

      const value = entry[field];
      let validatedValue = value;
      let shouldUpdate = false;

      switch (subject.validation?.trim()) {
        case VALIDATION_TYPES.NUMERIC:
          validatedValue = validateAndClampNumber(value);
          shouldUpdate = validatedValue !== '';
          break;
        case VALIDATION_TYPES.LETTER_GRADE:
          validatedValue = value.toUpperCase();
          shouldUpdate = isValidLetterGrade(validatedValue);
          break;
        case VALIDATION_TYPES.PASS:
          shouldUpdate = isValidPassResult(value);
          break;
      }

      if (shouldUpdate) {
        // Create new entries array
        const newEntries = [...entries];
        
        // Apply rubber band logic for numeric fields and letter grades
        if (subject.validation?.trim() === VALIDATION_TYPES.NUMERIC || 
            subject.validation?.trim() === VALIDATION_TYPES.LETTER_GRADE) {
          newEntries[index] = maintainRubberBandLogic(entry, field, validatedValue);
        } else {
          // For pass/fail, update the value and calculate scaled score
          const updatedEntry = {
            ...entry,
            [field]: validatedValue,
          };
          
          // If this is the result field, update the scaled score
          if (field === 'result') {
            updatedEntry.scaledScore = getScaledScore(entry.subject, validatedValue, 0);
          }
          
          newEntries[index] = updatedEntry;
        }
        
        setEntries([...newEntries]);

        // Handle navigation based on range mode and current field
        if (rangeMode) {
          // In range mode, follow lower -> result -> upper -> next subject
          if (field === 'lowerResult') {
            setTimeout(() => resultInputRefs.current[index]?.focus(), 0);
          } else if (field === 'result') {
            setTimeout(() => upperResultInputRefs.current[index]?.focus(), 0);
          } else if (field === 'upperResult' && index < entries.length - 1) {
            setTimeout(() => subjectInputRefs.current[index + 1]?.focus(), 0);
          }
        } else {
          // Not in range mode, from result go directly to next subject
          if (field === 'result' && index < entries.length - 1) {
            setTimeout(() => subjectInputRefs.current[index + 1]?.focus(), 0);
          }
        }
      }
    }
  };

  // Keep handleResultBlur simple for now
  const handleResultBlur = (index: number, field: 'lowerResult' | 'result' | 'upperResult') => {
    const entry = entries[index];
    const subject = subjects.find(s => s.name === entry.subject);
    
    if (subject?.validation?.trim() === VALIDATION_TYPES.NUMERIC) {
      const value = entry[field] || '';
      const validatedValue = validateAndClampNumber(value);
      const newEntries = [...entries];
      newEntries[index] = {
        ...entry,
        [field]: validatedValue
      };
      setEntries(newEntries);
    }
  };

  // Get validation pattern for a subject
  const getValidationPattern = (subjectName: string) => {
    const subject = subjects.find(s => s.name === subjectName);
    if (!subject) return '';
    
    switch (subject.validation) {
      case VALIDATION_TYPES.NUMERIC:
        return VALIDATION_PATTERNS.NUMERIC;
      case VALIDATION_TYPES.LETTER_GRADE:
        return VALIDATION_PATTERNS.LETTER_GRADE;
      case VALIDATION_TYPES.PASS:
        return VALIDATION_PATTERNS.PASS;
      default:
        return '';
    }
  };

  // Get placeholder text for result input based on subject type
  const getResultPlaceholder = (subjectName: string) => {
    if (!subjectName) return "Select a subject first";
    
    const subject = subjects.find(s => s.name === subjectName);
    if (!subject) return "Enter result";

    return `Enter result (${subject.validation})`;
  };

  // Simple increment/decrement handlers
  const handleIncrement = (index: number, field: 'lowerResult' | 'result' | 'upperResult') => {
    const entry = entries[index];
    const subject = subjects.find(s => s.name === entry.subject);
    
    if (!subject) return;

    const newEntries = [...entries];
    let newValue = entry[field];

    switch (subject.validation?.trim()) {
      case VALIDATION_TYPES.NUMERIC:
        const currentValue = parseFloat(entry[field] || '0');
        if (!isNaN(currentValue) && currentValue < 100) {
          newValue = (currentValue + 1).toString();
          newEntries[index] = maintainRubberBandLogic(entry, field, newValue);
        }
        break;
      case VALIDATION_TYPES.LETTER_GRADE:
        const currentGrade = entry[field] || 'E';
        const grades = ['E', 'D', 'C', 'B', 'A'];
        const currentIndex = grades.indexOf(currentGrade);
        if (currentIndex < grades.length - 1) {
          newValue = grades[currentIndex + 1];
          newEntries[index] = maintainRubberBandLogic(entry, field, newValue);
        }
        break;
    }

    setEntries(newEntries);
  };

  const handleDecrement = (index: number, field: 'lowerResult' | 'result' | 'upperResult') => {
    const entry = entries[index];
    const subject = subjects.find(s => s.name === entry.subject);
    
    if (!subject) return;

    const newEntries = [...entries];
    let newValue = entry[field];

    switch (subject.validation?.trim()) {
      case VALIDATION_TYPES.NUMERIC:
        const currentValue = parseFloat(entry[field] || '0');
        if (!isNaN(currentValue) && currentValue > 0) {
          newValue = (currentValue - 1).toString();
          newEntries[index] = maintainRubberBandLogic(entry, field, newValue);
        }
        break;
      case VALIDATION_TYPES.LETTER_GRADE:
        const currentGrade = entry[field] || 'A';
        const grades = ['E', 'D', 'C', 'B', 'A'];
        const currentIndex = grades.indexOf(currentGrade);
        if (currentIndex > 0) {
          newValue = grades[currentIndex - 1];
          newEntries[index] = maintainRubberBandLogic(entry, field, newValue);
        }
        break;
    }

    setEntries(newEntries);
  };

  // Calculate current scores
  const teScore = calculateTEScore(entries, subjects);
  const atar = teScore !== null ? calculateATAR(teScore) : null;

  // Calculate ranged scores when in range mode
  const getRangedResults = () => {
    if (!rangeMode) return null;

    // Create entries arrays for lower and upper bounds
    const lowerEntries = entries.map(entry => ({
      ...entry,
      scaledScore: entry.subject ? getScaledScore(entry.subject, entry.lowerResult, 0) : undefined
    }));

    const upperEntries = entries.map(entry => ({
      ...entry,
      scaledScore: entry.subject ? getScaledScore(entry.subject, entry.upperResult, 0) : undefined
    }));

    // Calculate TE scores for each set
    const lowerTE = calculateTEScore(lowerEntries, subjects) || 0;
    const currentTE = teScore || 0;
    const upperTE = calculateTEScore(upperEntries, subjects) || 0;

    // Calculate ATARs
    const lowerATAR = calculateATAR(lowerTE);
    const currentATAR = atar || 30;
    const upperATAR = calculateATAR(upperTE);

    return {
      teScores: { lower: lowerTE, current: currentTE, upper: upperTE },
      atars: { lower: lowerATAR, current: currentATAR, upper: upperATAR }
    };
  };

  const rangedResults = getRangedResults();

  return (
    <div className="single-student-form">
      {loadingState.isLoading ? (
        <div className="loading">Loading subject data...</div>
      ) : loadingState.error ? (
        <div className="error">{loadingState.error}</div>
      ) : (
        <>
          <div className="header-container">
            <div className="subject-count-input">
              <label htmlFor="subjectCount">Number of subjects:</label>
              <input
                type="number"
                id="subjectCount"
                min="1"
                max="9"
                value={numberOfSubjects || ''}
                onChange={(e) => setNumberOfSubjects(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="range-mode-toggle">
            <label>
              <input
                type="checkbox"
                checked={rangeMode}
                onChange={(e) => {
                  setRangeMode(e.target.checked);
                  if (e.target.checked) {
                    // Copy result values to lower and upper when enabling range mode
                    const newEntries = entries.map(entry => ({
                      ...entry,
                      lowerResult: entry.result,
                      upperResult: entry.result
                    }));
                    setEntries(newEntries);
                  }
                }}
              />
              Enable Ranged ATARs
            </label>
          </div>

          {numberOfSubjects !== null && numberOfSubjects > 0 && (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    {rangeMode ? (
                      <>
                        <th>Lower Result</th>
                        <th>Result</th>
                        <th>Upper Result</th>
                      </>
                    ) : (
                      <th>Result</th>
                    )}
                    <th>Scaled</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.originalIndex}>
                      <td>
                        <div className="subject-input-container">
                          <input
                            ref={el => subjectInputRefs.current[entry.originalIndex] = el}
                            type="text"
                            value={entry.subject}
                            onChange={(e) => handleSubjectInput(entry.originalIndex, e.target.value)}
                            onKeyDown={(e) => handleSubjectKeyDown(entry.originalIndex, e)}
                            className="subject-input"
                          />
                          {selectionState.showSuggestions && selectionState.activeInputIndex === entry.originalIndex && (
                            <div className="suggestions">
                              {selectionState.filteredSubjects.map((subject, idx) => (
                                <div
                                  key={subject}
                                  className={`suggestion-item ${idx === selectionState.selectedIndex ? 'selected' : ''}`}
                                  onClick={() => handleSubjectSelect(entry.originalIndex, subject)}
                                >
                                  {subject}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      {rangeMode ? (
                        <>
                          <td>
                            <div className="result-input-container">
                              <input
                                ref={el => lowerResultInputRefs.current[entry.originalIndex] = el}
                                type="text"
                                value={entry.lowerResult || ''}
                                onChange={(e) => handleResultInput(entry.originalIndex, e.target.value, 'lowerResult')}
                                onKeyDown={(e) => handleResultKeyDown(entry.originalIndex, 'lowerResult', e)}
                                onBlur={() => handleResultBlur(entry.originalIndex, 'lowerResult')}
                                pattern={getValidationPattern(entry.subject)}
                                className="result-input"
                                disabled={!entry.subject}
                              />
                              <div className="button-stack">
                                <button 
                                  className="value-adjuster"
                                  onClick={() => handleIncrement(entry.originalIndex, 'lowerResult')}
                                  disabled={!entry.subject}
                                >
                                  ▲
                                </button>
                                <button 
                                  className="value-adjuster"
                                  onClick={() => handleDecrement(entry.originalIndex, 'lowerResult')}
                                  disabled={!entry.subject}
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="result-input-container">
                              <input
                                ref={el => resultInputRefs.current[entry.originalIndex] = el}
                                type="text"
                                value={entry.result || ''}
                                onChange={(e) => handleResultInput(entry.originalIndex, e.target.value, 'result')}
                                onKeyDown={(e) => handleResultKeyDown(entry.originalIndex, 'result', e)}
                                onBlur={() => handleResultBlur(entry.originalIndex, 'result')}
                                pattern={getValidationPattern(entry.subject)}
                                className="result-input"
                                disabled={!entry.subject}
                              />
                              <div className="button-stack">
                                <button 
                                  className="value-adjuster"
                                  onClick={() => handleIncrement(entry.originalIndex, 'result')}
                                  disabled={!entry.subject}
                                >
                                  ▲
                                </button>
                                <button 
                                  className="value-adjuster"
                                  onClick={() => handleDecrement(entry.originalIndex, 'result')}
                                  disabled={!entry.subject}
                                >
                                  ▼
                                </button>
                              </div>
                              <ValidationHint
                                subject={entry.subject}
                                value={entry.result || ''}
                                showSuggestions={selectionState.showSuggestions}
                                subjectsLoaded={subjects.length > 0}
                                subjects={subjects}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="result-input-container">
                              <input
                                ref={el => upperResultInputRefs.current[entry.originalIndex] = el}
                                type="text"
                                value={entry.upperResult || ''}
                                onChange={(e) => handleResultInput(entry.originalIndex, e.target.value, 'upperResult')}
                                onKeyDown={(e) => handleResultKeyDown(entry.originalIndex, 'upperResult', e)}
                                onBlur={() => handleResultBlur(entry.originalIndex, 'upperResult')}
                                pattern={getValidationPattern(entry.subject)}
                                className="result-input"
                                disabled={!entry.subject}
                              />
                              <div className="button-stack">
                                <button 
                                  className="value-adjuster"
                                  onClick={() => handleIncrement(entry.originalIndex, 'upperResult')}
                                  disabled={!entry.subject}
                                >
                                  ▲
                                </button>
                                <button 
                                  className="value-adjuster"
                                  onClick={() => handleDecrement(entry.originalIndex, 'upperResult')}
                                  disabled={!entry.subject}
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                          </td>
                        </>
                      ) : (
                        <td>
                          <div className="result-input-container">
                            <input
                              ref={el => resultInputRefs.current[entry.originalIndex] = el}
                              type="text"
                              value={entry.result || ''}
                              onChange={(e) => handleResultInput(entry.originalIndex, e.target.value, 'result')}
                              onKeyDown={(e) => handleResultKeyDown(entry.originalIndex, 'result', e)}
                              onBlur={() => handleResultBlur(entry.originalIndex, 'result')}
                              pattern={getValidationPattern(entry.subject)}
                              className="result-input"
                              disabled={!entry.subject}
                            />
                            <div className="button-stack">
                              <button 
                                className="value-adjuster"
                                onClick={() => handleIncrement(entry.originalIndex, 'result')}
                                disabled={!entry.subject}
                              >
                                ▲
                              </button>
                              <button 
                                className="value-adjuster"
                                onClick={() => handleDecrement(entry.originalIndex, 'result')}
                                disabled={!entry.subject}
                              >
                                ▼
                              </button>
                            </div>
                            <ValidationHint
                              subject={entry.subject}
                              value={entry.result || ''}
                              showSuggestions={selectionState.showSuggestions}
                              subjectsLoaded={subjects.length > 0}
                              subjects={subjects}
                            />
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="scaled-score">
                          {rangeMode ? (
                            entry.subject && (
                              <span>
                                ({getScaledScore(entry.subject, entry.lowerResult, 0).toFixed(1)} - {entry.scaledScore?.toFixed(1)} - {getScaledScore(entry.subject, entry.upperResult, 0).toFixed(1)})
                              </span>
                            )
                          ) : (
                            entry.scaledScore !== undefined && (
                              <span>{entry.scaledScore.toFixed(1)}</span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <ScaledScoreChart 
                entries={entries.filter(entry => entry.subject && entry.scaledScore !== undefined)}
                rangeMode={rangeMode}
              />

              <ResultsDisplay 
                teScore={teScore}
                atar={atar}
                rangeMode={rangeMode}
                rangedTEScores={rangedResults?.teScores}
                rangedATARs={rangedResults?.atars}
              />
            </>
          )}
        </>
      )}
    </div>
  );
} 