
import React from 'react';
import { DAY_NAMES, AUSTRIAN_HOLIDAYS_2026 } from '../constants';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  getDay, isSameDay, startOfWeek, endOfWeek 
} from 'date-fns';

interface Props {
  currentDate: Date;
}

const MonthView: React.FC<Props> = ({ currentDate }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] p-6">
      <div className="grid grid-cols-7 border-t border-l border-slate-200 rounded-t-xl overflow-hidden shadow-sm">
        {DAY_NAMES.map(d => (
          <div key={d} className="bg-slate-50 py-3 text-center text-sm font-bold text-slate-500 border-r border-b border-slate-200">
            {d}
          </div>
        ))}
        {days.map(day => {
          const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
          const dateStr = format(day, 'yyyy-MM-dd');
          const holiday = AUSTRIAN_HOLIDAYS_2026.find(h => h.date === dateStr);
          const isToday = isSameDay(day, new Date());
          const isWeekend = getDay(day) === 0 || getDay(day) === 6;

          return (
            <div 
              key={dateStr}
              className={`min-h-[100px] p-2 border-r border-b border-slate-200 flex flex-col gap-1 transition-colors
                ${!isCurrentMonth ? 'bg-slate-50/50 text-slate-300' : 'bg-white'}
                ${isToday ? 'bg-blue-50/30' : ''}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-semibold rounded-full w-8 h-8 flex items-center justify-center
                  ${isToday ? 'bg-red-600 text-white shadow-sm' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}
                  ${holiday && isCurrentMonth ? 'text-red-600 font-bold' : ''}
                `}>
                  {day.getDate()}
                </span>
                {isWeekend && isCurrentMonth && !holiday && <span className="text-[10px] text-slate-400 font-medium">WE</span>}
              </div>
              
              {holiday && (
                <div className="bg-red-50 border-l-2 border-red-500 p-1.5 rounded-r-md">
                  <p className="text-[10px] text-red-700 font-bold leading-tight uppercase tracking-wider">{holiday.name}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
