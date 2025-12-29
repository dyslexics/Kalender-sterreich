
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MONTH_NAMES, AUSTRIAN_HOLIDAYS_2026 } from '../constants';
import { format } from 'date-fns';

export const downloadYearlyPDF = () => {
  const doc = new jsPDF('landscape');
  doc.setFontSize(22);
  doc.text('Kalender 2026 - Österreich', 14, 20);
  
  doc.setFontSize(12);
  doc.text('Gesetzliche Feiertage in Österreich 2026', 14, 30);

  const holidayData = AUSTRIAN_HOLIDAYS_2026.map(h => [
    format(new Date(h.date), 'dd.MM.yyyy'),
    h.name
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['Datum', 'Feiertag']],
    body: holidayData,
    theme: 'striped',
    headStyles: { fillColor: [191, 33, 47] } // Austrian Red
  });

  doc.save('Kalender_2026_Oesterreich.pdf');
};

export const downloadMonthlyPDF = (monthIndex: number) => {
  const doc = new jsPDF();
  const monthName = MONTH_NAMES[monthIndex];
  
  doc.setFontSize(20);
  doc.text(`${monthName} 2026`, 14, 20);
  
  const relevantHolidays = AUSTRIAN_HOLIDAYS_2026.filter(h => {
    const d = new Date(h.date);
    return d.getMonth() === monthIndex;
  });

  const holidayList = relevantHolidays.map(h => `${format(new Date(h.date), 'dd.MM.')}: ${h.name}`);
  doc.setFontSize(10);
  doc.text(holidayList.join(' | '), 14, 30);

  // Simple grid representation or table for days
  const daysInMonth = new Date(2026, monthIndex + 1, 0).getDate();
  const rows = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(2026, monthIndex, i);
    const dayName = format(date, 'EEEE');
    const isHoliday = AUSTRIAN_HOLIDAYS_2026.find(h => h.date === format(date, 'yyyy-MM-dd'));
    rows.push([i, dayName, isHoliday ? isHoliday.name : '']);
  }

  autoTable(doc, {
    startY: 40,
    head: [['Tag', 'Wochentag', 'Anmerkung/Feiertag']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [191, 33, 47] }
  });

  doc.save(`Kalender_2026_${monthName}.pdf`);
};
