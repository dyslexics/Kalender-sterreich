
import React from 'react';
import { MONTH_NAMES, DAY_NAMES, AUSTRIAN_HOLIDAYS_2026 } from '../constants';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

interface Props {
  onMonthClick: (index: number) => void;
  onDayClick: (date: Date) => void;
}

const YearView: React.FC<Props> = ({ onMonthClick, onDayClick }) => {
  const renderMonth = (monthIndex: number) => {
    const monthStart = startOfMonth(new Date(2026, monthIndex));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Adjusted for European Monday start (0=Sun, 1=Mon...6=Sat)
    let startDay = getDay(monthStart);
    startDay = startDay === 0 ? 6 : startDay - 1;

    const blanks = Array(startDay).fill(null);

    return (
      <div 
        key={monthIndex} 
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-red-400 hover:shadow-md transition-all group relative"
      >
        <div 
          onClick={() => onMonthClick(monthIndex)}
          className="text-lg font-bold text-slate-800 mb-3 group-hover:text-red-600 transition-colors cursor-pointer"
        >
          {MONTH_NAMES[monthIndex]}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-[10px] font-bold text-slate-400 text-center uppercase">{d}</div>
          ))}
          {blanks.map((_, i) => <div key={`b-${i}`} />)}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const holiday = AUSTRIAN_HOLIDAYS_2026.find(h => h.date === dateStr);
            const isWeekend = getDay(day) === 0 || getDay(day) === 6;

            return (
              <div
                key={dateStr}
                title={holiday?.name}
                onClick={(e) => {
                  e.stopPropagation();
                  onDayClick(day);
                }}
                className={`text-xs h-6 flex items-center justify-center rounded-md relative cursor-pointer transition-colors
                  ${holiday ? 'bg-red-50 text-red-600 font-bold' : isWeekend ? 'text-slate-400' : 'text-slate-700'}
                  hover:bg-slate-100
                `}
              >
                {day.getDate()}
                {holiday && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {Array.from({ length: 12 }).map((_, i) => renderMonth(i))}
    </div>
  );
};

export default YearView;
