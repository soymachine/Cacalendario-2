import { useState, useEffect } from 'react';
import { getDaysSinceLastEntry } from '../lib/storage';
import { formatSinceDate } from '../lib/dates';
import { usePreferences } from '../lib/usePreferences';

export default function DaysSinceCounter() {
  const { theme } = usePreferences();
  const [data, setData] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, sinceText: '' });

  const refresh = () => {
    const { days, hours, minutes, seconds, lastEntry } = getDaysSinceLastEntry();
    const sinceText = lastEntry ? formatSinceDate(lastEntry.date, lastEntry.time) : '';
    setData({ days, hours, minutes, seconds, sinceText });
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 1000);
    window.addEventListener('fluxia-updated', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('fluxia-updated', refresh);
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (!data.sinceText) {
    return (
      <div className="px-7 py-4">
        <p className="text-sm font-black" style={{ color: theme.text }}>TIEMPO SIN OBRAR</p>
        <p className="text-2xl font-normal mt-1" style={{ color: theme.text }}>Sin registros aún</p>
      </div>
    );
  }

  return (
    <div className="px-7 py-3">
      <p className="text-sm font-black" style={{ color: theme.text }}>TIEMPO SIN OBRAR</p>
      <div className="flex items-baseline gap-0 mt-1">
        <span className="text-[48px] font-black leading-none" style={{ color: theme.text }}>{data.days}</span>
        <span className="text-lg font-normal" style={{ color: theme.text }}>d</span>
        <span className="text-[48px] font-black leading-none ml-1" style={{ color: theme.text }}>{pad(data.hours)}</span>
        <span className="text-lg font-normal" style={{ color: theme.text }}>h</span>
        <span className="text-[48px] font-black leading-none ml-1" style={{ color: theme.text }}>{pad(data.minutes)}</span>
        <span className="text-lg font-normal" style={{ color: theme.text }}>m</span>
        <span className="text-[48px] font-black leading-none ml-1" style={{ color: theme.text }}>{pad(data.seconds)}</span>
        <span className="text-lg font-normal" style={{ color: theme.text }}>s</span>
      </div>
      <p className="text-xs mt-1" style={{ color: theme.text }}>{data.sinceText}</p>
    </div>
  );
}
