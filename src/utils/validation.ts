import { NUMERIC_BOUNDS, VALIDATION_PATTERNS } from '../constants/grades';

export const validateAndClampNumber = (value: string): string => {
  const num = parseInt(value);
  if (isNaN(num)) return '';
  return Math.max(NUMERIC_BOUNDS.MIN, Math.min(NUMERIC_BOUNDS.MAX, num)).toString();
};

export const isValidLetterGrade = (value: string): boolean => {
  return value === '' || new RegExp(VALIDATION_PATTERNS.LETTER_GRADE).test(value);
};

export const isValidPassResult = (value: string): boolean => {
  return value === 'Pass' || value === 'Fail';
}; 