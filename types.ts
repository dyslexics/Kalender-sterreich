
export type ViewMode = 'Year' | 'Month' | 'Week' | 'Day';

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isRegional?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'user';
}

export interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  holidayName?: string;
}
