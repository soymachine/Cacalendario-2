import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { computeStats, type Stats } from '../lib/stats';
import { getEntries } from '../lib/storage';
import { onEvent, FLUXIA_UPDATED } from '../lib/events';
import { D } from '../lib/design';
import CacaIcon from '../assets/Switch-Caca-Icono.svg';
import MiccionIcon from '../assets/Switch-Miccion-Icono.svg';

const ICON_TINT = 'rgba(0,0,0,0.55)';

function EntryIcons({ hasPoop, hasUrine, size = 32 }: { hasPoop: boolean; hasUrine: boolean; size?: number }) {
  if (hasPoop && hasUrine) {
    const s = Math.round(size * 0.72);
    return (
      <View style={styles.iconsRow}>
        <CacaIcon width={s} height={s} fill={ICON_TINT} color={ICON_TINT} />
        <Text style={[styles.plus, { fontSize: Math.round(size * 0.38) }]}>+</Text>
        <MiccionIcon width={s} height={s} fill={ICON_TINT} color={ICON_TINT} />
      </View>
    );
  }
  if (hasUrine) return <MiccionIcon width={size} height={size} fill={ICON_TINT} color={ICON_TINT} />;
  return <CacaIcon width={size} height={size} fill={ICON_TINT} color={ICON_TINT} />;
}

export default function InlineStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [totalPoop, setTotalPoop] = useState(0);
  const [totalUrine, setTotalUrine] = useState(0);
  const [lastWeekPoop, setLastWeekPoop] = useState(0);
  const [lastWeekUrine, setLastWeekUrine] = useState(0);

  const refresh = () => {
    setStats(computeStats(Infinity));
    const entries = getEntries();
    setTotalPoop(entries.filter(e => e.entry_type !== 'urine').length);
    setTotalUrine(entries.filter(e => e.entry_type === 'urine').length);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    const lastWeek = entries.filter(e => e.date >= cutoffStr);
    setLastWeekPoop(lastWeek.filter(e => e.entry_type !== 'urine').length);
    setLastWeekUrine(lastWeek.filter(e => e.entry_type === 'urine').length);
  };

  useEffect(() => {
    refresh();
    return onEvent(FLUXIA_UPDATED, refresh);
  }, []);

  if (!stats || stats.total === 0) return null;

  // Last week = most recent week in weeklyData
  const lastWeekCount = stats.weeklyData.length > 0
    ? stats.weeklyData[stats.weeklyData.length - 1].count
    : 0;

  const timeMax = Math.max(...stats.timeOfDay.map(t => t.count), 1);

  return (
    <>
      {/* Total + Última sem. side by side */}
      <View style={styles.twoCol}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Total</Text>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <EntryIcons hasPoop={totalPoop > 0} hasUrine={totalUrine > 0} size={32} />
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Última sem.</Text>
          <View style={styles.statRow}>
            <Text style={styles.statNumber}>{lastWeekCount}</Text>
            <EntryIcons hasPoop={lastWeekPoop > 0} hasUrine={lastWeekUrine > 0} size={32} />
          </View>
        </View>
      </View>

      {/* Hora — vertical bar chart */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Hora</Text>
        <View style={styles.chart}>
          {stats.timeOfDay.map((slot, i) => {
            const barHeight = timeMax > 0 ? Math.max((slot.count / timeMax) * 60, slot.count > 0 ? 8 : 4) : 4;
            const isMax = slot.count === timeMax && slot.count > 0;
            return (
              <View key={i} style={styles.barCol}>
                {slot.count > 0 && <Text style={styles.barCount}>{slot.count}</Text>}
                <View
                  style={[
                    styles.bar,
                    { height: barHeight, backgroundColor: isMax ? D.primary : D.secondary },
                  ]}
                />
                <Text style={styles.barLabel}>{slot.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plus: {
    fontWeight: '900',
    color: D.textMuted,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: D.card,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: D.text,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: D.secondary,
    lineHeight: 38,
  },
  sectionCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 10,
    backgroundColor: D.card,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: D.secondary,
    marginBottom: 14,
  },
  chart: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    height: 90,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barCount: {
    fontSize: 13,
    fontWeight: '700',
    color: D.text,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: D.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
