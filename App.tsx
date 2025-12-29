
import React, { useState, useEffect, useMemo } from 'react';
import CalendarHeader from './components/CalendarHeader';
import YearView from './components/YearView';
import MonthView from './components/MonthView';
import { ViewMode } from './types';
import { AUSTRIAN_HOLIDAYS_2026 } from './constants';
import { INITIAL_INSPIRATIONS_2026 } from './inspirations_data';
import { addMonths, subMonths, addDays, subDays, addWeeks, subWeeks, format, isAfter, parseISO, getMonth, eachDayOfInterval, startOfYear, endOfYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { downloadYearlyPDF, downloadMonthlyPDF } from './services/pdfService';
import { Info, Calendar as CalendarIcon, X, Sun, Snowflake, Leaf, Flower2, Quote, RefreshCw, Save, Clipboard, ShieldAlert } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Optional AI initialization: Only if API key is provided in the environment
const hasApiKey = !!process.env.API_KEY;
const ai = hasApiKey ? new GoogleGenAI({ apiKey: process.env.API_KEY! }) : null;

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('Year');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDetails, setDayDetails] = useState<{ namenstag: string; inspiration: string } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Merge initial hardcoded data with localStorage
  const [cachedData, setCachedData] = useState<Record<string, { namenstag: string, inspiration: string }>>(() => {
    const saved = localStorage.getItem('calendar_inspirations_2026');
    const localStore = saved ? JSON.parse(saved) : {};
    return { ...INITIAL_INSPIRATIONS_2026, ...localStore };
  });

  const [syncProgress, setSyncProgress] = useState<{ current: number, total: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('calendar_inspirations_2026', JSON.stringify(cachedData));
  }, [cachedData]);

  const nextHoliday = useMemo(() => {
    const now = new Date();
    const upcoming = AUSTRIAN_HOLIDAYS_2026.find(h => isAfter(parseISO(h.date), now));
    return upcoming || AUSTRIAN_HOLIDAYS_2026[0];
  }, []);

  const fetchDayDetails = async (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    if (cachedData[dateKey]) {
      setDayDetails(cachedData[dateKey]);
      return;
    }

    // Fallback if no AI is available
    if (!ai) {
      setDayDetails({ 
        namenstag: "Heilige des Tages", 
        inspiration: "Einen wunderschönen Tag in Österreich!" 
      });
      return;
    }

    setLoadingDetails(true);
    try {
      const prompt = `Gib mir für den ${format(date, 'd. MMMM', { locale: de })} (Österreich): Namenstag: [Namen] | Inspiration: [Max 100 Zeichen]`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const text = response.text || "";
      const namenstag = text.match(/Namenstag:\s*([^|]*)/)?.[1]?.trim() || "Heilige des Tages";
      const inspiration = text.match(/Inspiration:\s*(.*)/)?.[1]?.trim() || "Genießen Sie den Tag.";
      
      const newData = { namenstag, inspiration };
      setCachedData(prev => ({ ...prev, [dateKey]: newData }));
      setDayDetails(newData);
    } catch (error) {
      setDayDetails({ namenstag: "Unbekannt", inspiration: "Alles Gute für heute!" });
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedDate) fetchDayDetails(selectedDate);
    else setDayDetails(null);
  }, [selectedDate]);

  const startFullYearSync = async () => {
    if (!ai || syncProgress) return;
    const allDays = eachDayOfInterval({
      start: startOfYear(new Date(2026, 0, 1)),
      end: endOfYear(new Date(2026, 0, 1))
    });

    const daysToFetch = allDays.filter(d => !cachedData[format(d, 'yyyy-MM-dd')]);
    if (daysToFetch.length === 0) {
      alert("Alle Tage für 2026 sind bereits lokal gespeichert!");
      return;
    }

    setSyncProgress({ current: 0, total: daysToFetch.length });
    const batchSize = 5;
    for (let i = 0; i < daysToFetch.length; i += batchSize) {
      const batch = daysToFetch.slice(i, i + batchSize);
      await Promise.all(batch.map(async (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        try {
          const prompt = `Gib mir für den ${format(date, 'd. MMMM', { locale: de })} (Österreich) kurz: Namenstag: [Namen] | Inspiration: [Max 100 Zeichen]`;
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
          });
          const text = response.text || "";
          const namenstag = text.match(/Namenstag:\s*([^|]*)/)?.[1]?.trim() || "Heilige";
          const inspiration = text.match(/Inspiration:\s*(.*)/)?.[1]?.trim() || "Schöner Tag.";
          setCachedData(prev => ({ ...prev, [dateKey]: { namenstag, inspiration } }));
        } catch (e) { console.warn(e); }
      }));
      setSyncProgress(prev => prev ? { ...prev, current: i + batch.length } : null);
      await new Promise(r => setTimeout(r, 800));
    }
    setSyncProgress(null);
  };

  const copyDataToClipboard = () => {
    const code = `export const INITIAL_INSPIRATIONS_2026: Record<string, { namenstag: string, inspiration: string }> = ${JSON.stringify(cachedData, null, 2)};`;
    navigator.clipboard.writeText(code).then(() => {
      alert("Daten-Code kopiert! Füge ihn in 'inspirations_data.ts' ein.");
    });
  };

  const exportLocalData = () => {
    const dataStr = JSON.stringify(cachedData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'österreich_kalender_2026_lokal.json';
    link.click();
  };

  const handleDownload = () => {
    if (viewMode === 'Year') downloadYearlyPDF();
    else if (viewMode === 'Month') downloadMonthlyPDF(getMonth(currentDate));
  };

  const getSeason = (date: Date) => {
    const m = getMonth(date);
    if (m >= 2 && m <= 4) return { name: 'Frühling', icon: <Flower2 className="text-pink-500" />, bg: 'bg-pink-50' };
    if (m >= 5 && m <= 7) return { name: 'Sommer', icon: <Sun className="text-amber-500" />, bg: 'bg-amber-50' };
    if (m >= 8 && m <= 10) return { name: 'Herbst', icon: <Leaf className="text-orange-500" />, bg: 'bg-orange-50' };
    return { name: 'Winter', icon: <Snowflake className="text-blue-500" />, bg: 'bg-blue-50' };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <CalendarHeader viewMode={viewMode} setViewMode={setViewMode} currentDate={currentDate} onNavigate={(dir) => {
        if (viewMode === 'Month') setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
      }} onDownload={handleDownload} />

      <main className="flex-1 max-w-[1600px] mx-auto w-full pb-44">
        {viewMode === 'Year' && <YearView onMonthClick={(idx) => { setCurrentDate(new Date(2026, idx, 1)); setViewMode('Month'); }} onDayClick={setSelectedDate} />}
        {viewMode === 'Month' && <MonthView currentDate={currentDate} onDayClick={setSelectedDate} />}
        {(viewMode === 'Week' || viewMode === 'Day') && (
          <div className="p-12 text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md mx-auto border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ansicht nicht implementiert</h2>
              <button onClick={() => setViewMode('Year')} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold mt-4">Zurück zum Jahr</button>
            </div>
          </div>
        )}
      </main>

      {syncProgress && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
            <RefreshCw className="w-12 h-12 text-red-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Synchronisierung...</h3>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-2">
              <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }} />
            </div>
            <p className="text-xs font-bold text-slate-400">Tag {syncProgress.current} von {syncProgress.total}</p>
          </div>
        </div>
      )}

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-40 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 justify-center">
          {hasApiKey && (
            <>
              <button onClick={startFullYearSync} className="bg-white/90 backdrop-blur text-slate-700 px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-[10px] font-bold flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all">
                <RefreshCw size={12} /> Sync mit KI
              </button>
              <button onClick={copyDataToClipboard} className="bg-white/90 backdrop-blur text-slate-700 px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-[10px] font-bold flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-all">
                <Clipboard size={12} /> Code kopieren
              </button>
            </>
          )}
          <button onClick={exportLocalData} className="bg-white/90 backdrop-blur text-slate-700 px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-100 transition-all">
            <Save size={12} /> JSON Export
          </button>
          {!hasApiKey && (
            <div className="bg-amber-100/90 backdrop-blur text-amber-700 px-3 py-2 rounded-xl shadow-lg border border-amber-200 text-[10px] font-bold flex items-center gap-2">
              <ShieldAlert size={12} /> Lokal-Modus (Keine KI)
            </div>
          )}
        </div>
        
        <button onClick={() => setIsHolidaysModalOpen(true)} className="w-full text-left bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 hover:bg-slate-800 transition-all">
          <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg"><CalendarIcon size={20} className="text-white" /></div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] uppercase font-bold tracking-widest text-red-400 mb-0.5">Österreich 2026</p>
            <p className="text-sm font-medium text-slate-200 truncate italic">Nächster Feiertag: {format(parseISO(nextHoliday.date), 'dd. MMMM', { locale: de })}</p>
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">{Object.keys(cachedData).length} / 365 geladen</div>
        </button>
      </footer>

      {selectedDate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedDate(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className={`p-8 text-center ${getSeason(selectedDate).bg} relative overflow-hidden`}>
              <button onClick={() => setSelectedDate(null)} className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
              <div className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">{getSeason(selectedDate).icon}</div>
                <h3 className="text-red-600 font-bold uppercase tracking-[0.2em] text-sm mb-1">{format(selectedDate, 'EEEE', { locale: de })}</h3>
                <h2 className="text-5xl font-black text-slate-900 leading-none mb-2">{format(selectedDate, 'd.')}</h2>
                <h3 className="text-xl font-bold text-slate-600">{format(selectedDate, 'MMMM yyyy', { locale: de })}</h3>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Namenstag</span>
                <p className="text-slate-800 font-bold text-lg">{loadingDetails ? '...' : dayDetails?.namenstag}</p>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative">
                <Quote className="absolute -top-2 -left-2 text-white/10 w-24 h-24" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-2 relative z-10">Inspiration</span>
                <p className="text-slate-100 font-medium italic relative z-10">"{loadingDetails ? 'Gemini verfasst...' : dayDetails?.inspiration}"</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="w-full bg-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-300 transition-colors">Schließen</button>
            </div>
          </div>
        </div>
      )}

      {isHolidaysModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsHolidaysModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="bg-red-600 p-6 text-white shrink-0">
              <h2 className="text-2xl font-bold">Österreich 2026</h2>
              <p className="text-red-100 text-sm">Feiertage im Überblick</p>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {AUSTRIAN_HOLIDAYS_2026.map(h => (
                <div key={h.date} onClick={() => { setSelectedDate(parseISO(h.date)); setIsHolidaysModalOpen(false); }} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-red-50 cursor-pointer transition-colors group">
                  <span className="font-bold text-slate-700">{format(parseISO(h.date), 'dd.MM.')}</span>
                  <span className="text-slate-600 font-medium group-hover:text-red-600">{h.name}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-100"><button onClick={() => setIsHolidaysModalOpen(false)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Schließen</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
