import { Subject, Entry, SubjectData } from '../interfaces/types';

// Calculate scaled score for a subject
export function getScaledScore(
  subject: string,
  result: string,
  atarScale: Record<string, SubjectData>
): number {
  const subjectData = atarScale[subject];
  if (!subjectData) return 0;

  const numericResult = parseFloat(result);
  if (isNaN(numericResult)) return 0;

  const range = subjectData.ranges.find(r => 
    numericResult >= r.min && numericResult <= r.max
  );

  if (!range) return 0;

  const rangeSize = range.max - range.min;
  const position = (numericResult - range.min) / rangeSize;
  return range.scaledScore + (position * (range.nextScaledScore - range.scaledScore));
}

// Calculate TE Score
export function calculateTEScore(entries: Entry[], subjects: Subject[]): number | null {
  // Get all subjects with their scaled scores
  const generalScores = entries
    .filter(entry => subjects.find(s => s.name === entry.subject)?.type === 'General')
    .map(entry => entry.scaledScore || 0)
    .sort((a, b) => b - a);

  const appliedScores = entries
    .filter(entry => subjects.find(s => s.name === entry.subject)?.type === 'Applied/VET')
    .map(entry => entry.scaledScore || 0)
    .sort((a, b) => b - a);

  // Calculate Option A: Sum of top 5 general subjects
  const optionA = generalScores.length >= 5 
    ? generalScores.slice(0, 5).reduce((sum, score) => sum + score, 0)
    : null;

  // Calculate Option B: Sum of top 4 general + best applied
  const optionB = (generalScores.length >= 4 && appliedScores.length >= 1)
    ? generalScores.slice(0, 4).reduce((sum, score) => sum + score, 0) + appliedScores[0]
    : null;

  // Return the higher valid option, or null if neither is valid
  if (optionA === null && optionB === null) return null;
  if (optionA === null) return optionB;
  if (optionB === null) return optionA;
  return Math.max(optionA, optionB);
}

// Calculate ATAR from TE Score
export function calculateATAR(teScore: number): number {
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
  return atar;
} 