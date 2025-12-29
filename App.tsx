
import React, { useState, useEffect, useCallback } from 'react';
import CalendarHeader from './components/CalendarHeader';
import YearView from './components/YearView';
import MonthView from './components/MonthView';
import { ViewMode } from './types';
import { addMonths, subMonths, addDays, subDays, addWeeks, subWeeks, startOfYear, format } from 'date-fns';
import { downloadYearlyPDF, downloadMonthlyPDF } from './services/pdfService';
import { getAustrianFact } from './services/geminiService';
import { Sparkles, Info, Heart } from 'lucide-react';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('Year');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [culturalFact, setCulturalFact] = useState<string>('');
  const [loadingFact, setLoadingFact] = useState(false);

  const fetchFact = useCallback(async (date: Date) => {
    setLoadingFact(true);
    const fact = await getAustrianFact(format(date, 'MMMM'));
    setCulturalFact(fact);
    setLoadingFact(false);
  }, []);

  useEffect(() => {
    fetchFact(currentDate);
  }, [currentDate, fetchFact]);

  const handleNavigate = (direction: number) => {
    switch (viewMode) {
      case 'Year':
        // Only one year supported
        break;
      case 'Month':
        setCurrentDate(direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        break;
      case 'Week':
        setCurrentDate(direction > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
      case 'Day':
        setCurrentDate(direction > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
    }
  };

  const handleDownload = () => {
    if (viewMode === 'Year') {
      downloadYearlyPDF();
    } else {
      downloadMonthlyPDF(currentDate.getMonth());
    }
  };

  const switchToMonth = (index: number) => {
    setCurrentDate(new Date(2026, index, 1));
    setViewMode('Month');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <CalendarHeader 
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentDate={currentDate}
        onNavigate={handleNavigate}
        onDownload={handleDownload}
      />

      <main className="flex-1 max-w-[1600px] mx-auto w-full">
        {viewMode === 'Year' && <YearView onMonthClick={switchToMonth} />}
        {viewMode === 'Month' && <MonthView currentDate={currentDate} />}
        {(viewMode === 'Week' || viewMode === 'Day') && (
          <div className="p-12 text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-slate-100">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Fokus Ansicht</h2>
              <p className="text-slate-600 mb-6">Die Detailansicht für Wochen und Tage ist in dieser Version für 2026 optimiert. Nutzen Sie die Monatsansicht für alle Details.</p>
              <button 
                onClick={() => setViewMode('Month')}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Zurück zur Monatsansicht
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Insight Bar */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-40">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] uppercase font-bold tracking-widest text-red-400 mb-0.5">Kultureller Einblick</p>
            <p className="text-sm font-medium text-slate-200 truncate italic">
              {loadingFact ? 'Lade interessante Fakten über Österreich...' : culturalFact}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 pr-2">
            <Heart size={16} className="text-red-500 fill-red-500" />
            <span className="text-[10px] font-bold text-slate-400">AT</span>
          </div>
        </div>
      </footer>

      {/* Background Decor */}
      <div className="fixed top-20 right-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] -z-10" />
    </div>
  );
};

export default App;
