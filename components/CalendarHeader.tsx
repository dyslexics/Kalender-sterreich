
import React from 'react';
import { ViewMode } from '../types';
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentDate: Date;
  onNavigate: (direction: number) => void;
  onDownload: () => void;
}

const CalendarHeader: React.FC<Props> = ({ viewMode, setViewMode, currentDate, onNavigate, onDownload }) => {
  const formatHeaderDate = () => {
    if (viewMode === 'Year') return '2026';
    const month = currentDate.toLocaleString('de-AT', { month: 'long' });
    if (viewMode === 'Month') return `${month} 2026`;
    if (viewMode === 'Week') return `KW ${Math.ceil((currentDate.getDate() + 6) / 7)}, ${month} 2026`;
    return currentDate.toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-red-600 p-2 rounded-lg text-white">
          <CalendarIcon size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Österreich 2026</h1>
          <p className="text-sm text-slate-500 font-medium">{formatHeaderDate()}</p>
        </div>
      </div>

      <div className="flex items-center bg-slate-100 p-1 rounded-xl">
        {(['Year', 'Month', 'Week', 'Day'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === mode 
                ? 'bg-white text-red-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {mode === 'Year' ? 'Jahr' : mode === 'Month' ? 'Monat' : mode === 'Week' ? 'Woche' : 'Tag'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
          <button onClick={() => onNavigate(-1)} className="p-2 hover:bg-slate-200 text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => onNavigate(1)} className="p-2 hover:bg-slate-200 text-slate-600 transition-colors border-l border-slate-200">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <button 
          onClick={onDownload}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md active:scale-95"
        >
          <Download size={18} />
          <span>PDF Export</span>
        </button>
      </div>
    </header>
  );
};

export default CalendarHeader;
