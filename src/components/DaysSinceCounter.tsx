import { useState, useEffect } from 'react';
import { getDaysSinceLastEntry } from '../lib/storage';
import { formatSinceDate } from '../lib/dates';
import { usePreferences } from '../lib/usePreferences';

export default function DaysSinceCounter() {
  const { theme } = usePreferences();
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
        <p className="text-sm font-black" style={{ color: theme.text }}>DÍAS SIN OBRAR</p>
        <p className="text-3xl font-normal mt-1" style={{ color: theme.text }}>Sin registros aún</p>
      </div>
    );
  }

  return (
    <div className="px-7 py-4">
      <p className="text-sm font-black" style={{ color: theme.text }}>DÍAS SIN OBRAR</p>
      <div className="flex items-baseline gap-0 mt-1">
        <span className="text-[80px] font-black leading-none" style={{ color: theme.text }}>{data.days}</span>
        <span className="text-3xl font-normal" style={{ color: theme.text }}>días</span>
        <span className="text-[80px] font-black leading-none ml-1" style={{ color: theme.text }}>{data.hours}</span>
        <span className="text-3xl font-normal" style={{ color: theme.text }}> horas</span>
      </div>
      <p className="text-sm mt-2" style={{ color: theme.text }}>{data.sinceText}</p>
    </div>
  );
}
