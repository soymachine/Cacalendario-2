import { useState, useEffect } from 'react';
import { getMonthName, getDaysInMonth, getFirstDayOfMonth, toDateKey } from '../lib/dates';
import { getEntriesForMonth, type PoopEntry } from '../lib/storage';
import { asset } from '../lib/config';
import { D } from '../lib/design';

interface CalendarProps {
  onDayClick: (date: string, entries: PoopEntry[]) => void;
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function Calendar({ onDayClick }: CalendarProps) {
  const now = new Date();
  const todayKey = toDateKey(now);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [entries, setEntries] = useState<PoopEntry[]>([]);

  useEffect(() => {
    setEntries(getEntriesForMonth(year, month + 1));
  }, [year, month]);

  useEffect(() => {
    const handler = () => setEntries(getEntriesForMonth(year, month + 1));
    window.addEventListener('fluxia-updated', handler);
    return () => window.removeEventListener('fluxia-updated', handler);
  }, [year, month]);

  const entriesByDate = new Map<string, PoopEntry[]>();
  entries.forEach((e) => {
    const existing = entriesByDate.get(e.date) || [];
    existing.push(e);
    entriesByDate.set(e.date, existing);
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ width: '100%', padding: '16px 12px' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: D.bg,
          }}
        >
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M8 2L2 9L8 16" stroke={D.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: D.text, margin: 0, letterSpacing: 0.3 }}>
          {getMonthName(month)} {year}
        </h2>
        <button
          onClick={nextMonth}
          style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: D.bg,
          }}
        >
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M2 2L8 9L2 16" stroke={D.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 900, color: D.textMuted }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEntries = entriesByDate.get(dateKey) || [];
          const hasEntry = dayEntries.length > 0;
          const count = dayEntries.length;
          const isFuture = dateKey > todayKey;

          return (
            <button
              key={dateKey}
              onClick={() => { if (isFuture) return; onDayClick(dateKey, dayEntries); }}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: 'none',
                cursor: isFuture ? 'default' : 'pointer',
                opacity: isFuture ? 0.4 : 1,
                backgroundColor: hasEntry ? D.chip : D.bg,
              }}
            >
              {hasEntry ? (
                <>
                  {(() => {
                    const hasPoop = dayEntries.some((e: any) => e.entry_type !== 'urine');
                    const hasUrine = dayEntries.some((e: any) => e.entry_type === 'urine');
                    const imgStyle = { filter: 'brightness(0) opacity(0.55)' as const };
                    if (hasPoop && hasUrine) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img src={asset('/Switch-Caca-Icono.svg')} alt="" width={14} height={14} style={imgStyle} />
                          <span style={{ fontSize: 9, fontWeight: 900, color: D.text, lineHeight: 1 }}>+</span>
                          <img src={asset('/Switch-Miccion-Icono.svg')} alt="" width={14} height={14} style={imgStyle} />
                        </div>
                      );
                    }
                    if (hasUrine) return <img src={asset('/Switch-Miccion-Icono.svg')} alt="" width={22} height={22} style={imgStyle} />;
                    return <img src={asset('/Switch-Caca-Icono.svg')} alt="" width={22} height={22} style={imgStyle} />;
                  })()}
                  {count > 1 && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 16, height: 16, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 900,
                      backgroundColor: D.primary, color: D.primaryText,
                    }}>
                      {count}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: 12, color: `${D.text}66` }}>{day}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
