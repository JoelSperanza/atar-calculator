export interface Subject {
  name: string;
  type: string;
  validation: string;
}

export interface Entry {
  subject: string;
  result: string;
  lowerResult: string;
  upperResult: string;
  scaledScore?: number;
  originalIndex: number;
}

export interface SubjectRange {
  min: number;
  max: number;
  scaledScore: number;
  nextScaledScore: number;
}

export interface SubjectData {
  ranges: SubjectRange[];
} 