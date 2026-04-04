import { useState, useEffect } from 'react';
import { getMonthName, getDaysInMonth, getFirstDayOfMonth, toDateKey } from '../lib/dates';
import { getEntriesForMonth, type PoopEntry } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';

interface CalendarProps {
  onDayClick: (date: string, entries: PoopEntry[]) => void;
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function Calendar({ onDayClick }: CalendarProps) {
  const { emoji, theme } = usePreferences();
  const now = new Date();
  const todayKey = toDateKey(now);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [entries, setEntries] = useState<PoopEntry[]>([]);

  useEffect(() => {
    setEntries(getEntriesForMonth(year, month + 1));
  }, [year, month]);

  // Listen for storage changes (when new entry is saved)
  useEffect(() => {
    const handler = () => setEntries(getEntriesForMonth(year, month + 1));
    window.addEventListener('fluxia-updated', handler);
    return () => window.removeEventListener('fluxia-updated', handler);
  }, [year, month]);

  // Group entries by date
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
    <div className="w-full px-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-70" style={{ backgroundColor: `${theme.text}15` }}>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10L10 18" stroke={theme.text} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-2xl font-black tracking-wide" style={{ color: theme.text }}>{getMonthName(month)}</h2>
        <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-70" style={{ backgroundColor: `${theme.text}15` }}>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M2 2L10 10L2 18" stroke={theme.text} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-sm font-black" style={{ color: theme.text }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
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
              onClick={() => {
                if (isFuture) return;
                onDayClick(dateKey, dayEntries);
              }}
              className={`aspect-square rounded-full flex items-center justify-center text-sm relative ${
                isFuture ? 'cursor-default opacity-40' : 'cursor-pointer active:scale-95'
              }`}
              style={{ backgroundColor: theme.glass }}
            >
              {hasEntry ? (
                <>
                  {emoji.char === 'svg' ? (
                    <img src={asset('/poop-small.svg')} alt="poop" className="w-7 h-7" />
                  ) : (
                    <span className="text-xl">{emoji.char}</span>
                  )}
                  {/* Badge for multiple entries */}
                  {count > 1 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                      style={{ backgroundColor: theme.text, color: invertColorFor(theme) }}
                    >
                      {count}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs font-medium" style={{ color: `${theme.text}66` }}>{day}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function invertColorFor(theme: { id: string }): string {
  return theme.id === 'night' ? '#1a1a2e' : 'white';
}
