import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DoctorInfo } from '../lib/doctor';
import { getSemaforo, resolveSemaforoThresholds, type SemaforoKey } from '../lib/semaforo';
import { tagColor } from '../lib/tags';
import { patientLabel, type PatientLink, type PracticeStats } from '../lib/patients';
import { D, CONTENT_MAX_WIDTH, centered } from '../lib/design';
import type { Tab } from './BottomNav';

interface HomeScreenProps {
  doctor: DoctorInfo;
  patients: PatientLink[];
  patientsLoading: boolean;
  practiceStats: PracticeStats | null;
  onNavigate: (tab: Tab, semaforoFilter?: string) => void;
  onSelectPatient: (patient: PatientLink) => void;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HomeScreen({ doctor, patients, patientsLoading, practiceStats, onNavigate, onSelectPatient }: HomeScreenProps) {
  const accepted = patients.filter((p) => p.status === 'accepted');
  const pending = patients.filter((p) => p.status === 'pending');

  const keyFor = (p: PatientLink): SemaforoKey => {
    const { green, red } = resolveSemaforoThresholds(doctor.semaforo_green, doctor.semaforo_red, {
      enabled: !!p.semaforo_override, green: p.semaforo_green_override, red: p.semaforo_red_override,
    });
    return getSemaforo(p.daysSinceLast ?? null, green, red).key;
  };

  const semCounts = accepted.reduce((acc, p) => {
    const k = keyFor(p);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const noDataWeek = accepted.filter((p) => p.daysSinceLast == null || p.daysSinceLast >= 7).length;

  const attentionList = [...accepted].sort((a, b) => {
    const order: Record<string, number> = { red: 0, gray: 1, orange: 2, green: 3 };
    const ka = keyFor(a), kb = keyFor(b);
    if (ka !== kb) return order[ka] - order[kb];
    const da = a.daysSinceLast ?? 9999, db = b.daysSinceLast ?? 9999;
    return ka === 'green' ? da - db : db - da;
  }).slice(0, 7);

  const tiles: { value: number; label: string; bg: string; color: string; filter?: string }[] = [
    { value: accepted.length, label: 'Pacientes activos', bg: '#EAF2FB', color: D.primary },
    { value: semCounts.green || 0, label: 'Al día', bg: '#E7F5EC', color: D.success, filter: 'green' },
    { value: semCounts.orange || 0, label: 'Atención', bg: '#FCF4E7', color: '#C0832B', filter: 'orange' },
    { value: semCounts.red || 0, label: 'Inactivos', bg: D.dangerBg, color: D.danger, filter: 'red' },
    { value: noDataWeek, label: 'Sin reg. 7d', bg: D.accentSoft, color: D.accent, filter: noDataWeek > 0 ? 'no7d' : undefined },
  ];
  if (pending.length > 0) tiles.push({ value: pending.length, label: 'Invit. pendientes', bg: D.accentSoft, color: D.accent });

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, centered(CONTENT_MAX_WIDTH)]}>
        <Text style={styles.kicker}>HOLA,</Text>
        <Text style={styles.title}>Dr. {doctor.name.split(' ')[0]}</Text>
        <Text style={styles.subtitle}>
          {patientsLoading ? ' ' : `${accepted.length} pacientes activos · ${pending.length} invitaciones pendientes`}
        </Text>

        {patientsLoading ? (
          <ActivityIndicator style={styles.loading} color={D.primary} />
        ) : (
          <>
            <View style={styles.tileRow}>
              {tiles.map((t) => (
                <Pressable
                  key={t.label}
                  disabled={!t.filter}
                  onPress={() => t.filter && onNavigate('pacientes', t.filter)}
                  style={[styles.tile, { backgroundColor: t.bg }]}
                >
                  <Text style={[styles.tileValue, { color: t.color }]}>{t.value}</Text>
                  <Text style={[styles.tileLabel, { color: t.color }]}>{t.label}{t.filter ? ' ↗' : ''}</Text>
                </Pressable>
              ))}
            </View>

            {practiceStats && accepted.length > 0 && (
              <View style={styles.statsCard}>
                <View style={styles.statsCol}>
                  <Text style={styles.statsKicker}>REGISTROS ESTA SEMANA</Text>
                  <Text style={styles.statsValue}>{practiceStats.thisWeekEntries}</Text>
                  {practiceStats.lastWeekEntries > 0 && (
                    <Text style={[styles.statsDelta, { color: practiceStats.thisWeekEntries >= practiceStats.lastWeekEntries ? D.success : D.danger }]}>
                      {practiceStats.thisWeekEntries >= practiceStats.lastWeekEntries ? '↑' : '↓'} vs {practiceStats.lastWeekEntries} sem. anterior
                    </Text>
                  )}
                </View>
                {practiceStats.thisWeekBristol !== null && (
                  <View style={styles.statsCol}>
                    <Text style={styles.statsKicker}>BRISTOL MEDIO (7 DÍAS)</Text>
                    <Text style={styles.statsValue}>{practiceStats.thisWeekBristol.toFixed(1)} / 7</Text>
                    {practiceStats.lastWeekBristol !== null && (() => {
                      const improving = Math.abs(practiceStats.thisWeekBristol! - 4) < Math.abs(practiceStats.lastWeekBristol! - 4);
                      return (
                        <Text style={[styles.statsDelta, { color: improving ? D.success : D.danger }]}>
                          {improving ? '↑' : '↓'} {improving ? 'mejorando' : 'empeorando'}
                        </Text>
                      );
                    })()}
                  </View>
                )}
              </View>
            )}

            {attentionList.length > 0 && (
              <View style={styles.attentionCard}>
                <View style={styles.attentionHeader}>
                  <Text style={styles.attentionTitle}>Requieren atención</Text>
                  <Pressable onPress={() => onNavigate('pacientes', 'all')}>
                    <Text style={styles.attentionSeeAll}>Ver todos →</Text>
                  </Pressable>
                </View>
                {attentionList.map((p, i) => {
                  const { green, red } = resolveSemaforoThresholds(doctor.semaforo_green, doctor.semaforo_red, {
                    enabled: !!p.semaforo_override, green: p.semaforo_green_override, red: p.semaforo_red_override,
                  });
                  const sem = getSemaforo(p.daysSinceLast ?? null, green, red);
                  return (
                    <Pressable key={p.id} onPress={() => onSelectPatient(p)} style={[styles.attentionRow, i < attentionList.length - 1 && styles.attentionRowBorder]}>
                      <View style={[styles.dot, { backgroundColor: sem.color }]} />
                      <View style={styles.attentionInfo}>
                        <Text style={styles.attentionName} numberOfLines={1}>{patientLabel(p)}</Text>
                        <Text style={styles.attentionMeta}>
                          {p.daysSinceLast == null ? 'Sin registros' : p.daysSinceLast === 0 ? 'Hoy' : p.daysSinceLast === 1 ? 'Ayer' : `hace ${p.daysSinceLast} días`}
                          {p.lastEntryDate && p.daysSinceLast != null ? ` · ${shortDate(p.lastEntryDate)}` : ''}
                        </Text>
                      </View>
                      {(p.tags || []).slice(0, 2).map((t) => (
                        <Text key={t} style={[styles.tag, { backgroundColor: tagColor(t) + '20', color: tagColor(t) }]}>{t}</Text>
                      ))}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {accepted.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aún no tienes pacientes</Text>
                <Text style={styles.emptyBody}>Invita a tu primer paciente para empezar el seguimiento.</Text>
                <Pressable onPress={() => onNavigate('invitar')} style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>+ Invitar paciente</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  kicker: { fontSize: 12, fontWeight: '900', color: D.textMuted, letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '900', color: D.text, marginTop: 2 },
  subtitle: { fontSize: 13, color: D.textMuted, marginTop: 4, marginBottom: 20 },
  loading: { marginTop: 60 },
  tileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tile: { flexBasis: '30%', flexGrow: 1, borderRadius: 14, padding: 14, gap: 4 },
  tileValue: { fontSize: 26, fontWeight: '900' },
  tileLabel: { fontSize: 11, opacity: 0.8 },
  statsCard: { backgroundColor: D.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', gap: 28, marginBottom: 16 },
  statsCol: { flex: 1 },
  statsKicker: { fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 0.4, marginBottom: 4 },
  statsValue: { fontSize: 24, fontWeight: '900', color: D.text },
  statsDelta: { fontSize: 11, marginTop: 3, fontWeight: '600' },
  attentionCard: { backgroundColor: D.card, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  attentionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: D.border },
  attentionTitle: { fontSize: 13, fontWeight: '800', color: D.text },
  attentionSeeAll: { fontSize: 11, color: D.textMuted },
  attentionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 11 },
  attentionRowBorder: { borderBottomWidth: 1, borderBottomColor: D.border },
  dot: { width: 10, height: 10, borderRadius: 5 },
  attentionInfo: { flex: 1, minWidth: 0 },
  attentionName: { fontSize: 13, fontWeight: '700', color: D.text },
  attentionMeta: { fontSize: 11, color: D.textMuted },
  tag: { fontSize: 10, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  emptyCard: { backgroundColor: D.card, borderRadius: 16, padding: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: D.text, marginBottom: 6 },
  emptyBody: { fontSize: 13, color: D.textMuted, textAlign: 'center', marginBottom: 18 },
  emptyButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 99, backgroundColor: D.primary },
  emptyButtonText: { color: D.primaryText, fontSize: 14, fontWeight: '700' },
});
