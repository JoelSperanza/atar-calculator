export const VALIDATION_TYPES = {
  NUMERIC: "0 - 100",
  LETTER_GRADE: "A - E",
  PASS: "Pass"
} as const;

export const VALIDATION_PATTERNS = {
  NUMERIC: "^[0-9]{1,3}$",
  LETTER_GRADE: "^[A-E]$",
  PASS: "^Pass$"
} as const;

export const NUMERIC_BOUNDS = {
  MIN: 0,
  MAX: 100
} as const;

export const LETTER_GRADE_VALUES = {
  'A': 5,
  'B': 4,
  'C': 3,
  'D': 2,
  'E': 1
} as const;

export const MAX_SUBJECTS = 7;  // Maximum number of subjects allowed for ATAR calculation 