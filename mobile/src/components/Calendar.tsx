import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getMonthName, getDaysInMonth, getFirstDayOfMonth, toDateKey } from '../lib/dates';
import { getEntriesForMonth, type PoopEntry } from '../lib/storage';
import { onEvent, FLUXIA_UPDATED } from '../lib/events';
import { D } from '../lib/design';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import CacaIcon from '../assets/Switch-Caca-Icono.svg';
import MiccionIcon from '../assets/Switch-Miccion-Icono.svg';

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
    return onEvent(FLUXIA_UPDATED, () => setEntries(getEntriesForMonth(year, month + 1)));
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
    <View style={styles.wrapper}>
      {/* Month nav */}
      <View style={styles.monthNav}>
        <Pressable onPress={prevMonth} style={styles.navButton}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.monthTitle}>
          {getMonthName(month)} {year}
        </Text>
        <Pressable onPress={nextMonth} style={styles.navButton}>
          <ChevronRightIcon />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>{d}</Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`empty-${i}`} style={styles.cell} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEntries = entriesByDate.get(dateKey) || [];
          const hasEntry = dayEntries.length > 0;
          const count = dayEntries.length;
          const isFuture = dateKey > todayKey;
          const hasPoop = dayEntries.some((e) => e.entry_type !== 'urine');
          const Icon = hasPoop ? CacaIcon : MiccionIcon;

          return (
            <View key={dateKey} style={styles.cell}>
              <Pressable
                onPress={() => { if (isFuture) return; onDayClick(dateKey, dayEntries); }}
                style={[
                  styles.dayCell,
                  { opacity: isFuture ? 0.4 : 1, backgroundColor: hasEntry ? D.secondary : D.card },
                ]}
              >
                {hasEntry ? (
                  <>
                    {/* fill="white" tints the icon like the web's brightness(0) invert(1) filter */}
                    <Icon width={22} height={22} fill="#ffffff" color="#ffffff" />
                    {count > 1 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{count}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.dayNumber}>{day}</Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_PERCENT = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: D.bg,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: D.secondary,
    letterSpacing: 0.3,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    width: CELL_PERCENT,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    color: D.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_PERCENT,
    aspectRatio: 1,
    padding: 2,
  },
  dayCell: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 12,
    color: D.primary,
  },
  countBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  countText: {
    fontSize: 9,
    fontWeight: '900',
    color: D.text,
  },
});
