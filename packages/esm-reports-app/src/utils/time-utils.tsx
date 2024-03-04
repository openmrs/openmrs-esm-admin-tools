export const TIME_PATTERN = '^(2[0-3]|[0-1]?[0-9]):([0-5][0-9])$';

export interface Time {
  hours: number;
  minutes: number;
}

export function parseTime(text: string): Time | null {
  if (!text || text.indexOf(':') < 0) {
    return null;
  }

  const parts = text.split(':');

  return { hours: parseInt(parts[0]), minutes: parseInt(parts[1]) };
}

export function to24HTime(date: Date | Time): string {
  if (!date) {
    return null;
  } else if (date instanceof Date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } else {
    return `${String(date.hours).padStart(2, '0')}:${String(date.minutes).padStart(2, '0')}`;
  }
}
