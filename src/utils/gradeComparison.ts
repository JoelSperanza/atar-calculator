import { LETTER_GRADE_VALUES } from '../constants/grades';

export const compareLetterGrades = (grade1: string, grade2: string): number => {
  if (!grade1 || !grade2) return 0;
  const value1 = LETTER_GRADE_VALUES[grade1 as keyof typeof LETTER_GRADE_VALUES] || 0;
  const value2 = LETTER_GRADE_VALUES[grade2 as keyof typeof LETTER_GRADE_VALUES] || 0;
  return value2 - value1;
};

export const getLetterGradeValue = (grade: string): number => {
  if (!grade || grade.trim() === '') return 0;
  return LETTER_GRADE_VALUES[grade as keyof typeof LETTER_GRADE_VALUES] || 0;
}; 