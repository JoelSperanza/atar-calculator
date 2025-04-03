import { MAX_SUBJECTS } from '../constants/grades';

export type FieldType = 'subject' | 'result' | 'lowerResult' | 'upperResult';
export type NavigationDirection = 'next' | 'previous' | 'up' | 'down';

export interface NavigationPosition {
  fieldType: FieldType;
  index: number;
}

export interface NavigationMap {
  [key: string]: {
    [key: string]: NavigationPosition | null;
  };
}

export const getNextPosition = (
  current: NavigationPosition,
  direction: NavigationDirection,
  rangeMode: boolean
): NavigationPosition | null => {
  const { fieldType, index } = current;
  
  // Handle boundary cases
  if (index < 0 || index >= MAX_SUBJECTS) return null;
  
  // Define navigation map based on current field type
  const navigationMap: NavigationMap = {
    subject: {
      next: { fieldType: rangeMode ? 'lowerResult' : 'result', index },
      previous: { fieldType: 'subject', index: index - 1 },
      up: { fieldType: 'subject', index: index - 1 },
      down: { fieldType: 'subject', index: index + 1 }
    },
    result: {
      next: { fieldType: 'subject', index: index + 1 },
      previous: { fieldType: 'subject', index },
      up: { fieldType: 'result', index: index - 1 },
      down: { fieldType: 'result', index: index + 1 }
    },
    lowerResult: {
      next: { fieldType: 'result', index },
      previous: { fieldType: 'subject', index },
      up: { fieldType: 'lowerResult', index: index - 1 },
      down: { fieldType: 'lowerResult', index: index + 1 }
    },
    upperResult: {
      next: { fieldType: 'subject', index: index + 1 },
      previous: { fieldType: 'result', index },
      up: { fieldType: 'upperResult', index: index - 1 },
      down: { fieldType: 'upperResult', index: index + 1 }
    }
  };

  // Get next position from navigation map
  const nextPosition = navigationMap[fieldType][direction];
  
  // Handle boundary cases for next position
  if (!nextPosition || nextPosition.index < 0 || nextPosition.index >= MAX_SUBJECTS) {
    return null;
  }

  return nextPosition;
}; 