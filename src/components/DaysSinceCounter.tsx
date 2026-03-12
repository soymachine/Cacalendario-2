import { useState, useEffect } from 'react';
import { getDaysSinceLastEntry } from '../lib/storage';
import { formatSinceDate } from '../lib/dates';

export default function DaysSinceCounter() {
  const [data, setData] = useState({ days: 0, hours: 0, sinceText: '' });

  const refresh = () => {
    const { days, hours, lastEntry } = getDaysSinceLastEntry();
    const sinceText = lastEntry ? formatSinceDate(lastEntry.date, lastEntry.time) : '';
    setData({ days, hours, sinceText });
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    window.addEventListener('cacalendario-updated', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('cacalendario-updated', refresh);
    };
  }, []);

  if (!data.sinceText) {
    return (
      <div className="px-7 py-4">
        <p className="text-sm font-black text-black">DÍAS SIN OBRAR</p>
        <p className="text-3xl font-normal text-black mt-1">Sin registros aún</p>
      </div>
    );
  }

  return (
    <div className="px-7 py-4">
      <p className="text-sm font-black text-black">DÍAS SIN OBRAR</p>
      <div className="flex items-baseline gap-0 mt-1">
        <span className="text-[80px] font-black text-black leading-none">{data.days}</span>
        <span className="text-3xl font-normal text-black">días</span>
        <span className="text-[80px] font-black text-black leading-none ml-1">{data.hours}</span>
        <span className="text-3xl font-normal text-black"> horas</span>
      </div>
      <p className="text-sm text-black mt-2">{data.sinceText}</p>
    </div>
  );
}
