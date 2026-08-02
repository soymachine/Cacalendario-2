import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PatientEntry } from '../lib/patientDetail';
import { D } from '../lib/design';

interface PatientCalendarProps {
  entries: PatientEntry[];
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function PatientCalendar({ entries }: PatientCalendarProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const goPrev = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const goNext = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const entriesByDate = new Map<string, number>();
  entries.forEach((e) => {
    const [y, m] = e.date.split('-').map(Number);
    if (y === year && m === month + 1) entriesByDate.set(e.date, (entriesByDate.get(e.date) || 0) + 1);
  });

  const cells: { key: string; day?: number; dateStr?: string }[] = [];
  for (let i = 0; i < startDay; i++) cells.push({ key: `empty-${i}` });
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ key: dateStr, day, dateStr });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={goPrev} style={styles.navButton}><Text style={styles.navText}>←</Text></Pressable>
        <Text style={styles.monthLabel}>
          {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={goNext} style={styles.navButton}><Text style={styles.navText}>→</Text></Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => <Text key={d} style={styles.weekday}>{d}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map((cell) => {
          if (!cell.dateStr) return <View key={cell.key} style={styles.cell} />;
          const count = entriesByDate.get(cell.dateStr) || 0;
          const isToday = cell.dateStr === todayStr;
          const isFuture = new Date(cell.dateStr) > today;
          const hasEntry = count > 0;
          return (
            <View
              key={cell.key}
              style={[
                styles.cell,
                styles.dayCell,
                hasEntry && { backgroundColor: D.primary },
                !hasEntry && isToday && { backgroundColor: D.primary + '20', borderWidth: 1, borderColor: D.primary },
                isFuture && { opacity: 0.3 },
              ]}
            >
              <Text style={[styles.dayText, hasEntry && styles.dayTextActive]}>{cell.day}</Text>
              {hasEntry && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{count}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  card: { backgroundColor: D.card, borderRadius: 16, padding: 12, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navButton: { paddingHorizontal: 10, paddingVertical: 4 },
  navText: { fontSize: 16, color: D.textMuted },
  monthLabel: { fontSize: 13, fontWeight: '800', color: D.text, textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { width: CELL_SIZE, textAlign: 'center', fontSize: 11, fontWeight: '700', color: D.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, aspectRatio: 1, padding: 2 },
  dayCell: { alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  dayText: { fontSize: 12, fontWeight: '600', color: D.textMuted },
  dayTextActive: { color: '#fff' },
  countBadge: { position: 'absolute', top: 1, right: 1, minWidth: 12, height: 12, borderRadius: 6, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  countBadgeText: { fontSize: 7, fontWeight: '800', color: D.primary },
});
