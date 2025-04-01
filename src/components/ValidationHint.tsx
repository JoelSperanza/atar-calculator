import { VALIDATION_TYPES } from './SingleStudentForm';

interface Subject {
  name: string;
  type: string;
  validation: string;
}

interface ValidationHintProps {
  subject: string;
  value: string;
  showSuggestions: boolean;
  subjectsLoaded: boolean;
  subjects: Subject[];
}

export function ValidationHint({ 
  subject, 
  value, 
  showSuggestions, 
  subjectsLoaded,
  subjects
}: ValidationHintProps) {
  if (!subject || value || showSuggestions || !subjectsLoaded) {
    return null;
  }

  const validation = subjects.find(s => s.name === subject)?.validation;
  if (!validation) return null;

  return (
    <div className="validation-hint" role="tooltip">
      {validation}
    </div>
  );
} 