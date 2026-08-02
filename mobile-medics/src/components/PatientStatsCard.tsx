import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Rect, Line, Text as SvgText, Circle as SvgCircle } from 'react-native-svg';
import type { PatientDetail } from '../lib/patientDetail';
import { SYMPTOM_LABEL } from '../lib/entryLabels';
import { D } from '../lib/design';

interface PatientStatsCardProps {
  detail: PatientDetail;
}

function bristolColor(b: number): string {
  return b >= 3 && b <= 5 ? D.success : b < 3 ? '#C0832B' : D.danger;
}

export default function PatientStatsCard({ detail }: PatientStatsCardProps) {
  const bVals = detail.entries.filter((e) => e.entry_type === 'poop' && e.bristol != null).map((e) => e.bristol as number).slice(0, 10);
  let trend: { label: string; bg: string; color: string } | null = null;
  if (bVals.length >= 6) {
    const recentAvg = bVals.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const rest = bVals.slice(5, 10);
    const olderAvg = rest.reduce((a, b) => a + b, 0) / rest.length;
    const rDist = Math.abs(recentAvg - 4), oDist = Math.abs(olderAvg - 4);
    if (rDist < oDist - 0.4) trend = { label: '↑ Mejorando', bg: '#E7F5EC', color: D.success };
    else if (rDist > oDist + 0.4) trend = { label: '↓ Empeorando', bg: D.dangerBg, color: D.danger };
    else trend = { label: '— Estable', bg: D.chip, color: D.textMuted };
  }

  const bristolData = detail.entries.filter((e) => e.entry_type === 'poop' && e.bristol != null).slice(0, 30).reverse();

  const now = new Date();
  const weeks = Array.from({ length: 8 }, (_, w) => {
    const end = new Date(now); end.setDate(now.getDate() - w * 7);
    const start = new Date(end); start.setDate(end.getDate() - 7);
    return {
      label: w === 0 ? 'Hoy' : `-${w}s`,
      count: detail.entries.filter((e) => e.date >= start.toISOString().slice(0, 10) && e.date < end.toISOString().slice(0, 10)).length,
    };
  }).reverse();
  const maxCount = Math.max(...weeks.map((w) => w.count), 1);

  const symCount: Record<string, number> = {};
  detail.entries.forEach((e) => e.symptoms.forEach((s) => { symCount[s] = (symCount[s] || 0) + 1; }));
  const topSymptoms = Object.entries(symCount).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const W = 320, H = 110, XL = 22, XR = 4, YT = 8, YB = 8;
  const CW = W - XL - XR, CH = H - YT - YB;
  const xOf = (i: number) => XL + (bristolData.length > 1 ? (i * CW) / (bristolData.length - 1) : CW / 2);
  const yOf = (b: number) => YT + ((7 - b) / 6) * CH;
  const pathD = bristolData.map((e, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(e.bristol!).toFixed(1)}`).join(' ');

  const W2 = 300, H2 = 64, BW = 26, GAP = 6;
  const total = weeks.length * (BW + GAP) - GAP;
  const ox = (W2 - total) / 2;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Estadísticas</Text>

      <View style={styles.tileRow}>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{detail.totalEntries}</Text>
          <Text style={styles.tileLabel}>Registros</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{detail.bristolAvg != null ? detail.bristolAvg.toFixed(1) : '—'}</Text>
          <Text style={styles.tileLabel}>Bristol medio</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{detail.daysSinceLast ?? '—'}</Text>
          <Text style={styles.tileLabel}>Días sin reg.</Text>
        </View>
      </View>
      {trend && (
        <View style={[styles.trendBox, { backgroundColor: trend.bg }]}>
          <Text style={[styles.trendText, { color: trend.color }]}>{trend.label} · últimas 10 deposiciones</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>TENDENCIA BRISTOL (últimas 30 deposiciones)</Text>
      {bristolData.length < 2 ? (
        <Text style={styles.noData}>Sin suficientes datos de Bristol</Text>
      ) : (
        <Svg width="100%" height={130} viewBox={`0 0 ${W} ${H}`}>
          <Rect x={XL} y={yOf(7)} width={CW} height={yOf(5) - yOf(7)} fill="rgba(210,100,100,0.05)" />
          <Rect x={XL} y={yOf(5)} width={CW} height={yOf(3) - yOf(5)} fill="rgba(63,158,110,0.06)" />
          <Rect x={XL} y={yOf(3)} width={CW} height={yOf(1) - yOf(3)} fill="rgba(224,159,60,0.05)" />
          {[3, 5].map((b) => (
            <Line key={b} x1={XL} y1={yOf(b)} x2={XL + CW} y2={yOf(b)} stroke="rgba(34,42,46,0.15)" strokeWidth={0.6} strokeDasharray="3,2" />
          ))}
          {[1, 4, 7].map((b) => (
            <SvgText key={b} x={XL - 4} y={yOf(b) + 3} textAnchor="end" fontSize={7} fill={b === 4 ? D.text : D.textMuted}>T{b}</SvgText>
          ))}
          <Path d={pathD} fill="none" stroke="rgba(34,42,46,0.2)" strokeWidth={1.5} />
          {bristolData.map((e, i) => (
            <SvgCircle key={i} cx={xOf(i)} cy={yOf(e.bristol!)} r={3} fill={bristolColor(e.bristol!)} />
          ))}
        </Svg>
      )}

      <Text style={[styles.sectionLabel, { marginTop: 10 }]}>FRECUENCIA SEMANAL (8 semanas)</Text>
      <Svg width="100%" height={80} viewBox={`0 0 ${W2} ${H2}`}>
        {weeks.map((wk, i) => {
          const bh = Math.max((wk.count / maxCount) * (H2 - 18), wk.count > 0 ? 4 : 0);
          const x = ox + i * (BW + GAP);
          const y = H2 - 12 - bh;
          return (
            <G key={i}>
              <Rect x={x} y={H2 - 12 - (H2 - 18)} width={BW} height={H2 - 18} rx={3} fill={D.chip} />
              <Rect x={x} y={y} width={BW} height={bh} rx={3} fill={wk.count > 0 ? D.success : D.chipDark} opacity={wk.count > 0 ? 0.75 : 0.4} />
              {wk.count > 0 && <SvgText x={x + BW / 2} y={y - 2} textAnchor="middle" fontSize={8} fill={D.text} fontWeight="700">{wk.count}</SvgText>}
              <SvgText x={x + BW / 2} y={H2 - 1} textAnchor="middle" fontSize={7} fill={D.textMuted}>{wk.label}</SvgText>
            </G>
          );
        })}
      </Svg>

      {topSymptoms.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 10 }]}>SÍNTOMAS MÁS FRECUENTES</Text>
          <View style={styles.symptomsRow}>
            {topSymptoms.map(([sym, count]) => (
              <Text key={sym} style={styles.symptomChip}>{SYMPTOM_LABEL[sym] || sym} ×{count}</Text>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: D.card, borderRadius: 16, padding: 14, marginBottom: 12 },
  title: { fontSize: 13, fontWeight: '800', color: D.text, marginBottom: 10 },
  tileRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tile: { flex: 1, alignItems: 'center', backgroundColor: D.bg, borderRadius: 10, paddingVertical: 8 },
  tileValue: { fontSize: 17, fontWeight: '900', color: D.text },
  tileLabel: { fontSize: 9, color: D.textMuted, marginTop: 2 },
  trendBox: { borderRadius: 10, paddingVertical: 6, alignItems: 'center', marginBottom: 10 },
  trendText: { fontSize: 11, fontWeight: '700' },
  sectionLabel: { fontSize: 9, fontWeight: '800', color: D.textMuted, letterSpacing: 0.4, marginBottom: 4 },
  noData: { fontSize: 11, color: D.textMuted, textAlign: 'center', paddingVertical: 12 },
  symptomsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  symptomChip: { fontSize: 11, fontWeight: '600', color: '#B94A4A', backgroundColor: '#FBEDED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});
