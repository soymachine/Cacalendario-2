import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DoctorInfo } from '../lib/doctor';
import { getSemaforo, resolveSemaforoThresholds } from '../lib/semaforo';
import { tagColor } from '../lib/tags';
import { patientLabel, patientInitial, type PatientLink } from '../lib/patients';
import { D, CONTENT_MAX_WIDTH, centered } from '../lib/design';

type SemaforoFilter = 'all' | 'green' | 'orange' | 'red' | 'gray' | 'no7d';
type SortBy = 'estado' | 'nombre';

interface PatientListScreenProps {
  doctor: DoctorInfo;
  patients: PatientLink[];
  patientsLoading: boolean;
  initialSemaforoFilter?: string;
  onRefresh: () => void;
  onSelectPatient: (patient: PatientLink) => void;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PatientListScreen({
  doctor, patients, patientsLoading, initialSemaforoFilter, onRefresh, onSelectPatient,
}: PatientListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('estado');
  const [semaforoFilter, setSemaforoFilter] = useState<SemaforoFilter>((initialSemaforoFilter as SemaforoFilter) || 'all');

  const keyFor = (p: PatientLink) => {
    const { green, red } = resolveSemaforoThresholds(doctor.semaforo_green, doctor.semaforo_red, {
      enabled: !!p.semaforo_override, green: p.semaforo_green_override, red: p.semaforo_red_override,
    });
    return getSemaforo(p.daysSinceLast ?? null, green, red).key;
  };

  const accepted = patients.filter((p) => p.status === 'accepted');
  const pending = patients.filter((p) => p.status === 'pending');
  const semCounts = accepted.reduce((acc, p) => { const k = keyFor(p); acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>);
  const no7d = accepted.filter((p) => p.daysSinceLast == null || p.daysSinceLast >= 7).length;

  const pills: { key: SemaforoFilter; label: string; count: number; color: string; soft: string }[] = [
    { key: 'all', label: 'Todos', count: accepted.length, color: D.secondary, soft: '#E7F5EC' },
    { key: 'green', label: 'Al día', count: semCounts.green || 0, color: D.success, soft: '#E7F5EC' },
    { key: 'orange', label: 'Atención', count: semCounts.orange || 0, color: '#C0832B', soft: '#FCF4E7' },
    { key: 'red', label: 'Inactivos', count: semCounts.red || 0, color: D.danger, soft: D.dangerBg },
    { key: 'gray', label: 'Sin datos', count: semCounts.gray || 0, color: D.textMuted, soft: D.chip },
    { key: 'no7d', label: 'Sin reg. 7d', count: no7d, color: D.accent, soft: D.accentSoft },
  ];

  const globalTags = doctor.global_tags || [];

  const q = searchQuery.trim().toLowerCase();
  const displayed = [...patients]
    .filter((p) => {
      if (q && !patientLabel(p).toLowerCase().includes(q) && !(p.patient_email || '').toLowerCase().includes(q)) return false;
      if (tagFilter && !(p.tags || []).includes(tagFilter)) return false;
      if (semaforoFilter === 'no7d') return p.status === 'accepted' && (p.daysSinceLast == null || p.daysSinceLast >= 7);
      if (semaforoFilter !== 'all') return p.status === 'accepted' && keyFor(p) === semaforoFilter;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'estado') {
        if (a.status === b.status) return patientLabel(a).localeCompare(patientLabel(b));
        return a.status === 'accepted' ? -1 : 1;
      }
      return patientLabel(a).localeCompare(patientLabel(b));
    });

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <View style={[styles.body, centered(CONTENT_MAX_WIDTH)]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis pacientes</Text>
        <Text style={styles.subtitle}>{accepted.length} vinculados · {pending.length} pendientes</Text>
      </View>

      <FlatList
        data={pills}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.key}
        contentContainerStyle={styles.pillsRow}
        style={styles.pillsList}
        renderItem={({ item }) => {
          const active = semaforoFilter === item.key;
          return (
            <Pressable
              onPress={() => setSemaforoFilter(item.key)}
              style={[styles.pill, { backgroundColor: active ? item.soft : D.chip, borderColor: active ? item.color : 'transparent' }]}
            >
              <Text
                numberOfLines={1}
                style={[styles.pillText, { color: active ? item.color : D.textMuted, fontWeight: active ? '800' : '600' }]}
              >
                {item.label} {item.count}
              </Text>
            </Pressable>
          );
        }}
      />

      {globalTags.length > 0 && (
        <FlatList
          data={['__all__', ...globalTags]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(t) => t}
          contentContainerStyle={styles.pillsRow}
          style={styles.pillsList}
          renderItem={({ item }) => {
            if (item === '__all__') {
              return (
                <Pressable onPress={() => setTagFilter(null)} style={[styles.tagPill, { backgroundColor: tagFilter === null ? D.text : D.chip }]}>
                  <Text numberOfLines={1} style={[styles.tagPillText, { color: tagFilter === null ? '#fff' : D.textMuted }]}>Todos</Text>
                </Pressable>
              );
            }
            const active = tagFilter === item;
            return (
              <Pressable onPress={() => setTagFilter(active ? null : item)} style={[styles.tagPill, { backgroundColor: active ? tagColor(item) : tagColor(item) + '20' }]}>
                <Text numberOfLines={1} style={[styles.tagPillText, { color: active ? '#fff' : tagColor(item) }]}>{item}</Text>
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.toolbar}>
        <Text style={styles.toolbarLabel}>Ordenar:</Text>
        {(['estado', 'nombre'] as const).map((opt) => (
          <Pressable key={opt} onPress={() => setSortBy(opt)} style={[styles.sortButton, sortBy === opt && styles.sortButtonActive]}>
            <Text style={[styles.sortButtonText, sortBy === opt && styles.sortButtonTextActive]}>{opt === 'estado' ? 'Estado' : 'Nombre'}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar paciente…"
        placeholderTextColor={D.textMuted}
        style={styles.search}
      />

      <FlatList
        data={displayed}
        keyExtractor={(p) => p.id}
        style={styles.listContainer}
        contentInsetAdjustmentBehavior="never"
        refreshControl={<RefreshControl refreshing={patientsLoading} onRefresh={onRefresh} tintColor={D.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!patientsLoading ? (
          <Text style={styles.emptyText}>
            {patients.length === 0 ? 'No hay pacientes. Invita a tu primer paciente.' : 'Sin resultados.'}
          </Text>
        ) : null}
        renderItem={({ item: patient }) => {
          const isAccepted = patient.status === 'accepted' && !patient.doctor_unlinked;
          const { green, red } = resolveSemaforoThresholds(doctor.semaforo_green, doctor.semaforo_red, {
            enabled: !!patient.semaforo_override, green: patient.semaforo_green_override, red: patient.semaforo_red_override,
          });
          const semaforo = getSemaforo(patient.daysSinceLast ?? null, green, red);
          return (
            <Pressable
              disabled={!isAccepted && !patient.doctor_unlinked}
              onPress={() => onSelectPatient(patient)}
              style={[styles.row, (!isAccepted && !patient.doctor_unlinked) && styles.rowDisabled]}
            >
              <View style={styles.rowLeft}>
                {isAccepted ? <View style={[styles.dot, { backgroundColor: semaforo.color }]} /> : <Text style={styles.dash}>—</Text>}
              </View>
              <View style={[styles.avatar, { backgroundColor: isAccepted ? D.primary : D.text }]}>
                <Text style={styles.avatarText}>{patientInitial(patient)}</Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{patientLabel(patient)}</Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {isAccepted && patient.lastEntryDate
                    ? `${patient.daysSinceLast === 0 ? 'Hoy' : `hace ${patient.daysSinceLast} día${patient.daysSinceLast !== 1 ? 's' : ''}`} · ${shortDate(patient.lastEntryDate)}`
                    : isAccepted ? 'Sin registros' : patient.doctor_unlinked ? 'Desvinculado' : 'Invitación pendiente'}
                </Text>
                {(patient.tags || []).length > 0 && (
                  <View style={styles.tagRow}>
                    {(patient.tags || []).map((t) => (
                      <Text key={t} style={[styles.miniTag, { backgroundColor: tagColor(t) + '20', color: tagColor(t) }]}>{t}</Text>
                    ))}
                  </View>
                )}
              </View>
              <Text style={[styles.statusBadge, {
                backgroundColor: isAccepted ? '#E7F5EC' : patient.doctor_unlinked ? D.chip : '#FCF4E7',
                color: isAccepted ? D.success : patient.doctor_unlinked ? D.textMuted : '#C0832B',
              }]}>
                {isAccepted ? 'Vinculado' : patient.doctor_unlinked ? 'Desvinc.' : 'Pendiente'}
              </Text>
            </Pressable>
          );
        }}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  body: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: D.text },
  subtitle: { fontSize: 12, color: D.textMuted, marginTop: 2 },
  pillsList: { flexGrow: 0 },
  pillsRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  pill: { height: 30, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 12, lineHeight: 15 },
  tagPill: { height: 28, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tagPillText: { fontSize: 11, fontWeight: '700', lineHeight: 14 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  toolbarLabel: { fontSize: 11, fontWeight: '800', color: D.textMuted },
  sortButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: D.chip },
  sortButtonActive: { backgroundColor: D.text },
  sortButtonText: { fontSize: 11, fontWeight: '700', color: D.textMuted },
  sortButtonTextActive: { color: '#fff' },
  search: { marginHorizontal: 20, marginTop: 8, marginBottom: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: D.card, borderWidth: 1, borderColor: D.border, fontSize: 14, color: D.text },
  listContainer: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  emptyText: { textAlign: 'center', color: D.textMuted, fontSize: 13, paddingTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: D.card, borderRadius: 14, padding: 12, marginBottom: 8 },
  rowDisabled: { opacity: 0.7 },
  rowLeft: { width: 14, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dash: { fontSize: 12, color: D.textMuted },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: '700', color: D.text },
  rowMeta: { fontSize: 11, color: D.textMuted, marginTop: 1 },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  miniTag: { fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 20 },
  statusBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
});
