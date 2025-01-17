export interface CronField {
  name: string;
  value: number | string;
}

export const ST_ONCE = 'once';
export const ST_EVERY_DAY = 'everyDay';
export const ST_EVERY_WEEK = 'everyWeek';
export const ST_EVERY_MONTH = 'everyMonth';
export const ST_ADVANCED = 'advanced';
export const SCHEDULE_TYPES = [ST_ONCE, ST_EVERY_DAY, ST_EVERY_WEEK, ST_EVERY_MONTH, ST_ADVANCED];
export const DAYS_OF_WEEK: CronField[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
].map((name, idx) => ({
  name,
  value: idx + 1,
}));
export const DAYS_OF_MONTH: CronField[] = [
  { name: 'firstDay', value: '1' },
  { name: 'lastDay', value: 'L' },
];
