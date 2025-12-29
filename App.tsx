
import React, { useState, useEffect, useMemo } from 'react';
import CalendarHeader from './components/CalendarHeader';
import YearView from './components/YearView';
import MonthView from './components/MonthView';
import { ViewMode } from './types';
import { AUSTRIAN_HOLIDAYS_2026 } from './constants';
import { addMonths, subMonths, addDays, subDays, addWeeks, subWeeks, format, isAfter, parseISO, getMonth, eachDayOfInterval, startOfYear, endOfYear, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { downloadYearlyPDF, downloadMonthlyPDF } from './services/pdfService';
import { Info, Calendar as CalendarIcon, X, Sun, Snowflake, Leaf, Flower2, Quote, MapPin, Download, RefreshCw, Save } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('Year');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDetails, setDayDetails] = useState<{ namenstag: string; inspiration: string } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Local storage management for inspirations
  const [cachedData, setCachedData] = useState<Record<string, { namenstag: string, inspiration: string }>>(() => {
    const saved = localStorage.getItem('calendar_inspirations_2026');
    return saved ? JSON.parse(saved) : {};
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

    setLoadingDetails(true);
    try {
      const prompt = `Du bist ein österreichischer Kalender-Experte. 
      Nenne mir für den ${format(date, 'd. MMMM', { locale: de })} (Österreich):
      1. Den Namenstag (nur Namen, Komma-separiert).
      2. Eine kurze tägliche Inspiration oder ein Zitat mit Bezug zu Österreich oder der Jahreszeit.
      Antworte strikt im Format:
      Namenstag: [Namen]
      Inspiration: [Text]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const text = response.text || "";
      const namenstag = text.match(/Namenstag:\s*(.*)/)?.[1] || "Heilige des Tages";
      const inspiration = text.match(/Inspiration:\s*(.*)/)?.[1] || "Ein wunderbarer Tag in Österreich.";
      
      const newData = { namenstag, inspiration };
      setCachedData(prev => ({ ...prev, [dateKey]: newData }));
      setDayDetails(newData);
    } catch (error) {
      console.error("Gemini Error:", error);
      setDayDetails({ namenstag: "Unbekannt", inspiration: "Genieße diesen schönen Tag!" });
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchDayDetails(selectedDate);
    } else {
      setDayDetails(null);
    }
  }, [selectedDate]);

  const startFullYearSync = async () => {
    if (syncProgress) return;
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
    
    // Batch processing to avoid massive rate limits and browser freezing
    const batchSize = 5;
    for (let i = 0; i < daysToFetch.length; i += batchSize) {
      const batch = daysToFetch.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        try {
          const prompt = `Gib mir für den ${format(date, 'd. MMMM', { locale: de })} (Österreich) kurz: Namenstag: [Namen] | Inspiration: [Max 100 Zeichen]`;
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-lite-latest',
            contents: prompt,
          });
          const text = response.text || "";
          const namenstag = text.match(/Namenstag:\s*([^|]*)/)?.[1]?.trim() || "Heilige";
          const inspiration = text.match(/Inspiration:\s*(.*)/)?.[1]?.trim() || "Schöner Tag.";
          
          setCachedData(prev => ({ ...prev, [dateKey]: { namenstag, inspiration } }));
        } catch (e) {
          console.warn(`Fehler bei ${dateKey}`, e);
        }
      }));

      setSyncProgress(prev => prev ? { ...prev, current: i + batch.length } : null);
      // Small delay between batches
      await new Promise(r => setTimeout(r, 1000));
    }

    setSyncProgress(null);
    alert("Synchronisierung abgeschlossen! Alle Daten sind nun lokal verfügbar.");
  };

  const exportLocalData = () => {
    const dataStr = JSON.stringify(cachedData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'österreich_kalender_2026_lokal.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleNavigate = (direction: number) => {
    switch (viewMode) {
      case 'Year': break;
      case 'Month': setCurrentDate(direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1)); break;
      case 'Week': setCurrentDate(direction > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1)); break;
      case 'Day': setCurrentDate(direction > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1)); break;
    }
  };

  const handleDownload = () => {
    if (viewMode === 'Year') downloadYearlyPDF();
    else downloadMonthlyPDF(currentDate.getMonth());
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
      <CalendarHeader 
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentDate={currentDate}
        onNavigate={handleNavigate}
        onDownload={handleDownload}
      />

      <main className="flex-1 max-w-[1600px] mx-auto w-full pb-40">
        {viewMode === 'Year' && <YearView onMonthClick={(idx) => { setCurrentDate(new Date(2026, idx, 1)); setViewMode('Month'); }} onDayClick={setSelectedDate} />}
        {viewMode === 'Month' && <MonthView currentDate={currentDate} onDayClick={setSelectedDate} />}
        {(viewMode === 'Week' || viewMode === 'Day') && (
          <div className="p-12 text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md mx-auto border border-slate-100">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Info size={32} /></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ansicht eingeschränkt</h2>
              <p className="text-slate-600 mb-6">Bitte nutzen Sie die Jahres- oder Monatsübersicht, um Tage direkt auszuwählen.</p>
              <button onClick={() => setViewMode('Year')} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors">Zurück zum Jahr</button>
            </div>
          </div>
        )}
      </main>

      {/* Sync Status Overlay */}
      {syncProgress && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
            <RefreshCw className="w-12 h-12 text-red-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">2026 wird synchronisiert...</h3>
            <p className="text-slate-500 text-sm mb-6">Wir laden alle Inspirationen und Namenstage für das gesamte Jahr herunter.</p>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-red-600 h-full transition-all duration-300" 
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Tag {syncProgress.current} von {syncProgress.total}
            </p>
          </div>
        </div>
      )}

      {/* Footer Tools */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-40 flex flex-col gap-3">
        <div className="flex gap-2 justify-center">
          <button 
            onClick={startFullYearSync}
            className="bg-white/90 backdrop-blur text-slate-700 px-4 py-2 rounded-2xl shadow-xl border border-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <RefreshCw size={14} /> 2026 Synchronisieren
          </button>
          <button 
            onClick={exportLocalData}
            className="bg-white/90 backdrop-blur text-slate-700 px-4 py-2 rounded-2xl shadow-xl border border-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-slate-100 transition-all"
          >
            <Save size={14} /> Daten exportieren (.json)
          </button>
        </div>
        
        <button 
          onClick={() => setIsHolidaysModalOpen(true)}
          className="w-full text-left bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <CalendarIcon size={20} className="text-white" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] uppercase font-bold tracking-widest text-red-400 mb-0.5">Feiertage & Vorschau</p>
            <p className="text-sm font-medium text-slate-200 truncate italic">
              Nächster Feiertag: {format(parseISO(nextHoliday.date), 'dd. MMMM', { locale: de })} ({nextHoliday.name})
            </p>
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">
            {Object.keys(cachedData).length} / 365 Tagen geladen
          </div>
        </button>
      </footer>

      {/* Day Detail Modal */}
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
              {AUSTRIAN_HOLIDAYS_2026.find(h => h.date === format(selectedDate, 'yyyy-MM-dd')) && (
                <div className="inline-block bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg text-sm mb-4 animate-bounce">
                  {AUSTRIAN_HOLIDAYS_2026.find(h => h.date === format(selectedDate, 'yyyy-MM-dd'))?.name}
                </div>
              )}
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3 text-slate-400">
                  <Info size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Namenstag</span>
                </div>
                <p className="text-slate-800 font-bold text-lg leading-snug">
                  {loadingDetails ? <span className="animate-pulse">Lädt...</span> : dayDetails?.namenstag}
                </p>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <Quote className="absolute -top-2 -left-2 text-white/10 w-24 h-24" />
                <div className="flex items-center gap-3 mb-3 text-red-400 relative z-10">
                  <Flower2 size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Gedanke des Tages</span>
                </div>
                <p className="text-slate-100 font-medium leading-relaxed relative z-10 italic">
                  "{loadingDetails ? 'Gemini verfasst eine Inspiration...' : dayDetails?.inspiration}"
                </p>
              </div>

              <button onClick={() => setSelectedDate(null)} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-4 rounded-2xl font-bold transition-all">Schließen</button>
            </div>
          </div>
        </div>
      )}

      {/* Holidays List Modal */}
      {isHolidaysModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsHolidaysModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-red-600 p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold">Österreich 2026</h2>
                <p className="text-red-100 text-sm">Alle bundesweiten Feiertage</p>
              </div>
              <button onClick={() => setIsHolidaysModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {AUSTRIAN_HOLIDAYS_2026.map((holiday) => (
                <div 
                  key={holiday.date} 
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl cursor-pointer border border-transparent hover:border-slate-200"
                  onClick={() => { setSelectedDate(parseISO(holiday.date)); setIsHolidaysModalOpen(false); }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{format(parseISO(holiday.date), 'MMM', { locale: de })}</span>
                      <span className="text-lg font-bold text-slate-700 leading-none">{format(parseISO(holiday.date), 'dd')}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{holiday.name}</p>
                      <p className="text-xs text-slate-500 font-semibold">{format(parseISO(holiday.date), 'EEEE', { locale: de })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-20 right-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] -z-10" />
    </div>
  );
};

export default App;
