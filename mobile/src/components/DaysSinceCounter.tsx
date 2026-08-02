import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDaysSinceLastEntry } from '../lib/storage';
import { formatSinceDate } from '../lib/dates';
import { onEvent, FLUXIA_UPDATED } from '../lib/events';
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
    const unsubscribe = onEvent(FLUXIA_UPDATED, refresh);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (!data.sinceText) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Desde la última vez</Text>
        <Text style={styles.empty}>Sin registros aún</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Desde la última vez</Text>
      <View style={styles.counterRow}>
        <Text style={styles.big}>{data.days}</Text>
        <Text style={styles.unit}>d</Text>
        <Text style={[styles.big, styles.spaced]}>{pad(data.hours)}</Text>
        <Text style={styles.unit}>h</Text>
        <Text style={[styles.big, styles.spaced]}>{pad(data.minutes)}</Text>
        <Text style={styles.unit}>m</Text>
        <Text style={[styles.big, styles.spaced]}>{pad(data.seconds)}</Text>
        <Text style={styles.unit}>s</Text>
      </View>
      <Text style={styles.since}>{data.sinceText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: D.text,
    marginBottom: 6,
  },
  empty: {
    fontSize: 20,
    color: D.textMuted,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  big: {
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 44,
    color: D.primary,
  },
  spaced: {
    marginLeft: 4,
  },
  unit: {
    fontSize: 16,
    fontWeight: '700',
    color: D.secondary,
  },
  since: {
    fontSize: 12,
    marginTop: 6,
    color: D.textMuted,
  },
});
