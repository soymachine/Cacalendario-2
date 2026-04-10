import { useState, useEffect } from 'react';
import { getDaysSinceLastEntry } from '../lib/storage';
import { formatSinceDate } from '../lib/dates';
import { D } from '../lib/design';

export default function DaysSinceCounter() {
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
      <div style={{ padding: '12px 4px' }}>
        <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, letterSpacing: 0.5, margin: '0 0 4px' }}>TIEMPO SIN OBRAR</p>
        <p style={{ fontSize: 24, color: D.text, margin: 0 }}>Sin registros aún</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 4px' }}>
      <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, letterSpacing: 0.5, margin: '0 0 4px' }}>TIEMPO SIN OBRAR</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
        <span style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: D.text }}>{data.days}</span>
        <span style={{ fontSize: 18, color: D.text }}>d</span>
        <span style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: D.text, marginLeft: 4 }}>{pad(data.hours)}</span>
        <span style={{ fontSize: 18, color: D.text }}>h</span>
        <span style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: D.text, marginLeft: 4 }}>{pad(data.minutes)}</span>
        <span style={{ fontSize: 18, color: D.text }}>m</span>
        <span style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: D.text, marginLeft: 4 }}>{pad(data.seconds)}</span>
        <span style={{ fontSize: 18, color: D.text }}>s</span>
      </div>
      <p style={{ fontSize: 12, marginTop: 4, color: D.textMuted }}>{data.sinceText}</p>
    </div>
  );
}
