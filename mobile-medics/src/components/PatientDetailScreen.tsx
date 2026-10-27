import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, TextInput, ActivityIndicator, Alert, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DoctorInfo } from '../lib/doctor';
import type { PatientLink } from '../lib/patients';
import { getSemaforo, resolveSemaforoThresholds } from '../lib/semaforo';
import { patientLabel } from '../lib/patients';
import {
  loadPatientDetail, loadClinicalNotes, addClinicalNote, saveEntryNote,
  savePushSettings, sendTestPush, setPatientArchived, type PatientDetail, type ClinicalNote,
} from '../lib/patientDetail';
import PatientCalendar from './PatientCalendar';
import PatientStatsCard from './PatientStatsCard';
import PatientEntriesList from './PatientEntriesList';
import PatientBitacora from './PatientBitacora';
import PatientConfigModal from './PatientConfigModal';
import PatientProfileModal from './PatientProfileModal';
import { UserCircleIcon, SlidersIcon, BellIcon, BellSlashIcon } from './icons';
import { tagColor } from '../lib/tags';
import { D, CONTENT_MAX_WIDTH, centered } from '../lib/design';
import { LIST_PANE_WIDTH, DETAIL_TWO_COLUMN_MIN_WIDTH, DETAIL_SIDEBAR_WIDTH, DETAIL_MAX_WIDTH } from '../lib/layout';

interface PatientDetailScreenProps {
  doctor: DoctorInfo;
  patient: PatientLink;
  /** Se muestra junto a la lista (iPad en horizontal): sin botón «Volver». */
  inSplit?: boolean;
  onBack: () => void;
  onPatientUpdated: (patch: Partial<PatientLink>) => void;
  onGlobalTagsUpdated: (tags: string[]) => void;
  onFoodTagCatalogUpdated: (tags: string[]) => void;
  /** Tras archivar o reactivar: recargar la lista (el semáforo dependía de la fecha de archivo). */
  onArchiveChanged: () => void;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PatientDetailScreen({ doctor, patient, inSplit = false, onBack, onPatientUpdated, onGlobalTagsUpdated, onFoodTagCatalogUpdated, onArchiveChanged }: PatientDetailScreenProps) {
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [pushMinDays, setPushMinDays] = useState(Math.round((patient.push_min_hours ?? 24) / 24));
  const [pushDisabled, setPushDisabled] = useState(patient.push_disabled ?? false);
  const [pushTestStatus, setPushTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [pushTestError, setPushTestError] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // Con espacio suficiente (iPad), la ficha se reparte en dos columnas como en MW:
  // resumen, calendario y estadísticas a la izquierda; registros y bitácora a la derecha.
  const { width } = useWindowDimensions();
  const twoColumns = (inSplit ? width - LIST_PANE_WIDTH : width) >= DETAIL_TWO_COLUMN_MIN_WIDTH;
  const maxWidth = twoColumns ? DETAIL_MAX_WIDTH : CONTENT_MAX_WIDTH;

  const load = useCallback(async () => {
    setLoading(true);
    const [d, notes] = await Promise.all([
      loadPatientDetail(patient, doctor.id),
      loadClinicalNotes(patient.id),
    ]);
    setDetail(d);
    setClinicalNotes(notes);
    setLoading(false);
  }, [patient, doctor.id]);

  useEffect(() => { load(); }, [load]);

  const { green: effectiveGreen, red: effectiveRed } = resolveSemaforoThresholds(doctor.semaforo_green, doctor.semaforo_red, {
    enabled: !!patient.semaforo_override, green: patient.semaforo_green_override, red: patient.semaforo_red_override,
  });
  const semaforo = detail ? getSemaforo(detail.daysSinceLast, effectiveGreen, effectiveRed) : null;

  const handleTogglePush = async (enabled: boolean) => {
    setPushDisabled(!enabled);
    await savePushSettings(patient.id, { pushMinHours: pushMinDays * 24, pushDisabled: !enabled });
    onPatientUpdated({ push_disabled: !enabled });
  };

  const handlePushMinDaysBlur = async () => {
    await savePushSettings(patient.id, { pushMinHours: pushMinDays * 24, pushDisabled });
    onPatientUpdated({ push_min_hours: pushMinDays * 24 });
  };

  const handleTestPush = async () => {
    setPushTestStatus('sending');
    setPushTestError('');
    const { success, error } = await sendTestPush(patient.patient_id || '');
    if (!success) {
      setPushTestStatus('error');
      setPushTestError(error || 'Error desconocido');
      setTimeout(() => setPushTestStatus('idle'), 5000);
    } else {
      setPushTestStatus('ok');
      setTimeout(() => setPushTestStatus('idle'), 4000);
    }
  };

  // Archivar / reactivar (mismos textos que MW)
  const handleToggleArchived = () => {
    const archiving = !patient.doctor_unlinked;
    Alert.alert(
      archiving ? 'Archivar paciente' : 'Reactivar paciente',
      archiving
        ? 'Dejará de aparecer en tu lista y la app le dirá que no necesitas que registre nada. Tampoco recibirá avisos. Su historial se conserva y podrás reactivarlo cuando quieras desde «Ver archivados».'
        : 'Volverá a tu lista de pacientes. Podrá registrar de nuevo desde la app, con la misma pauta que tenía, y volverá a recibir los avisos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: archiving ? 'Archivar' : 'Reactivar',
          style: archiving ? 'destructive' : 'default',
          onPress: async () => {
            const { unlinkedAt, error } = await setPatientArchived(patient.id, doctor.id, archiving);
            if (error) { Alert.alert('No se ha podido guardar', error); return; }
            onPatientUpdated({ doctor_unlinked: archiving, unlinked_at: unlinkedAt });
            onArchiveChanged();
          },
        },
      ],
    );
  };

  const handleSaveNote = async (entryId: string, note: string) => {
    await saveEntryNote(doctor.id, entryId, note);
    setDetail((prev) => prev ? { ...prev, entries: prev.entries.map((e) => e.entry_id === entryId ? { ...e, doctor_note: note.trim() } : e) } : prev);
  };

  const handleAddNote = async (note: string) => {
    const created = await addClinicalNote(patient.id, note);
    if (created) setClinicalNotes((prev) => [created, ...prev]);
  };

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <View style={[styles.header, centered(maxWidth)]}>
        {inSplit ? <View /> : <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>← Volver</Text></Pressable>}
        <Pressable onPress={() => setConfigOpen(true)} style={styles.configButton} accessibilityRole="button">
          <SlidersIcon size={16} color={D.text} />
          <Text style={styles.configButtonText}>Configuración</Text>
        </Pressable>
      </View>

      {loading || !detail ? (
        <View style={styles.loading}><ActivityIndicator color={D.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.container, centered(maxWidth), twoColumns && styles.columns]}>
          <View style={twoColumns ? styles.sideColumn : undefined}>
            {/* Ficha: nombre, datos, notificaciones, email, etiquetas y semáforo.
                Se distingue del resto con una franja de color y un fondo tintado (igual que MW). */}
            <View style={styles.patientCard}>
              <View style={styles.patientCardAccent} />
              <View style={styles.patientNameRow}>
                <Text style={styles.patientName}>{patientLabel(patient)}</Text>
                <View style={styles.patientIcons}>
                  <Pressable onPress={() => setProfileOpen(true)} hitSlop={8} accessibilityLabel="Datos del paciente" style={styles.iconButton}>
                    <UserCircleIcon size={22} color="#95A0A5" />
                  </Pressable>
                  {patient.hasPushSub === true && <View accessibilityLabel="Notificaciones activas"><BellIcon size={18} color={D.secondary} /></View>}
                  {patient.hasPushSub === false && <View accessibilityLabel="Sin notificaciones"><BellSlashIcon size={18} color="#B5BEC2" /></View>}
                </View>
              </View>
              {!!patient.patient_email && <Text style={styles.patientEmail}>{patient.patient_email}</Text>}
              {(patient.doctor_unlinked || (patient.tags || []).length > 0) && (
                <View style={styles.tagRow}>
                  {patient.doctor_unlinked && (
                    <Text style={[styles.tag, styles.archivedTag]}>
                      Archivado{patient.unlinked_at ? ` el ${shortDate(patient.unlinked_at)}` : ''}
                    </Text>
                  )}
                  {(patient.tags || []).map((t) => (
                    <Text key={t} style={[styles.tag, { backgroundColor: tagColor(t) + '22', color: tagColor(t) }]}>{t}</Text>
                  ))}
                </View>
              )}

              <View style={styles.semaforoBlock}>
                <View style={styles.semaforoRow}>
                  <View style={[styles.dot, { backgroundColor: semaforo?.color }]} />
                  <Text style={styles.semaforoText}>
                    {detail.daysSinceLast === null ? 'Sin registros'
                      : detail.daysSinceLast === 0 ? 'Último registro: hoy'
                      : `Hace ${detail.daysSinceLast} día${detail.daysSinceLast !== 1 ? 's' : ''}`}
                  </Text>
                </View>
                {detail.lastEntryDate && <Text style={styles.semaforoMeta}>Último registro: {shortDate(detail.lastEntryDate)}</Text>}
                {detail.daysSinceLast !== null && detail.daysSinceLast > 3 && (
                  <Text style={styles.semaforoWarning}>⚠️ Varios días sin registrar</Text>
                )}
              </View>
            </View>

            <View style={styles.pushCard}>
              <View style={styles.pushHeader}>
                <View style={styles.pushTitleRow}>
                  <BellIcon size={14} color={D.text} />
                  <Text style={styles.pushTitle}>Notificaciones al paciente</Text>
                </View>
                <View style={styles.pushToggle}>
                  <Switch value={!pushDisabled} onValueChange={handleTogglePush} trackColor={{ true: D.primary, false: D.chipDark }} thumbColor="#fff" />
                  <Text style={styles.pushToggleLabel}>{pushDisabled ? 'Desactivadas' : 'Activadas'}</Text>
                </View>
              </View>
              {pushDisabled && <Text style={styles.pushHint}>No se enviarán recordatorios automáticos, aunque el paciente los tenga activados.</Text>}
              <View style={[styles.pushDaysRow, pushDisabled && styles.pushRowDisabled]}>
                <Text style={styles.pushDaysLabel}>Días sin registro para notificar</Text>
                <TextInput
                  value={String(pushMinDays)}
                  onChangeText={(v) => setPushMinDays(Math.max(1, parseInt(v || '1', 10)))}
                  onBlur={handlePushMinDaysBlur}
                  editable={!pushDisabled}
                  keyboardType="number-pad"
                  style={styles.pushDaysInput}
                />
              </View>
              <View style={styles.pushTestRow}>
                <Pressable
                  onPress={handleTestPush}
                  disabled={pushTestStatus === 'sending' || !patient.hasPushSub}
                  style={[styles.testButton, !patient.hasPushSub && styles.testButtonDisabled]}
                >
                  <View style={styles.testButtonRow}>
                    {pushTestStatus !== 'sending' && <BellIcon size={13} color={D.primary} />}
                    <Text style={styles.testButtonText}>{pushTestStatus === 'sending' ? 'Enviando...' : 'Enviar notificación de prueba'}</Text>
                  </View>
                </Pressable>
                {!patient.hasPushSub && <Text style={styles.pushHint}>El paciente no tiene notificaciones activadas.</Text>}
                {pushTestStatus === 'ok' && <Text style={styles.pushSuccess}>✅ Notificación enviada</Text>}
                {pushTestStatus === 'error' && <Text style={styles.pushError}>{pushTestError}</Text>}
              </View>
            </View>

            <PatientCalendar entries={detail.entries} />
            <PatientStatsCard detail={detail} />
          </View>
          <View style={twoColumns ? styles.mainColumn : undefined}>
            <PatientEntriesList entries={detail.entries} totalEntries={detail.totalEntries} onSaveNote={handleSaveNote} />
            <PatientBitacora notes={clinicalNotes} onAddNote={handleAddNote} />

            {(patient.status === 'accepted' || patient.doctor_unlinked) && (
              <Pressable
                onPress={handleToggleArchived}
                style={[styles.archiveButton, patient.doctor_unlinked ? styles.reactivateButton : null]}
                accessibilityRole="button"
              >
                <Text style={[styles.archiveButtonText, patient.doctor_unlinked && styles.reactivateButtonText]}>
                  {patient.doctor_unlinked ? 'Reactivar paciente' : 'Archivar paciente'}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      )}

      {configOpen && (
        <PatientConfigModal
          doctor={doctor}
          patient={patient}
          onClose={() => setConfigOpen(false)}
          onSaved={(patch) => { onPatientUpdated(patch); setConfigOpen(false); }}
          onGlobalTagsUpdated={onGlobalTagsUpdated}
          onFoodTagCatalogUpdated={onFoodTagCatalogUpdated}
        />
      )}
      {profileOpen && (
        <PatientProfileModal
          patient={patient}
          onClose={() => setProfileOpen(false)}
          onSaved={onPatientUpdated}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backButton: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontSize: 14, fontWeight: '700', color: D.text },
  configButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, backgroundColor: D.card, borderWidth: 1, borderColor: D.border },
  configButtonText: { fontSize: 13, fontWeight: '700', color: D.text },
  iconButton: { padding: 2 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { paddingHorizontal: 16, paddingBottom: 32 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  sideColumn: { width: DETAIL_SIDEBAR_WIDTH },
  mainColumn: { flex: 1, minWidth: 0, marginTop: 4 },
  patientCard: { backgroundColor: '#EEF4FA', borderRadius: 16, paddingVertical: 16, paddingLeft: 20, paddingRight: 16, marginTop: 4, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#DCE7F2' },
  patientCardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: D.primary },
  patientNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  patientName: { flex: 1, fontSize: 24, lineHeight: 29, fontWeight: '900', color: D.text },
  patientIcons: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  patientEmail: { fontSize: 13, color: D.textMuted, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, overflow: 'hidden' },
  archivedTag: { backgroundColor: D.chip, color: D.textMuted },
  semaforoBlock: { borderTopWidth: 1, borderTopColor: '#D3DFEA', marginTop: 12, paddingTop: 12 },
  semaforoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  semaforoText: { fontSize: 14, fontWeight: '700', color: D.text },
  semaforoMeta: { fontSize: 11, color: D.textMuted, marginTop: 4 },
  semaforoWarning: { fontSize: 11, fontWeight: '700', color: '#B94A4A', marginTop: 4 },
  pushCard: { backgroundColor: D.card, borderRadius: 16, padding: 14, marginBottom: 12 },
  pushHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  pushTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pushTitle: { fontSize: 13, fontWeight: '800', color: D.text },
  pushToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pushToggleLabel: { fontSize: 12, fontWeight: '600', color: D.textMuted },
  pushHint: { fontSize: 11, color: D.textMuted, marginTop: 6 },
  pushDaysRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  pushRowDisabled: { opacity: 0.4 },
  pushDaysLabel: { fontSize: 12, fontWeight: '700', color: D.textMuted, flex: 1 },
  pushDaysInput: { width: 56, textAlign: 'center', backgroundColor: D.chip, borderRadius: 8, paddingVertical: 6, fontSize: 13, color: D.text },
  pushTestRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: D.border },
  testButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 2, borderColor: D.primary, alignItems: 'center' },
  testButtonDisabled: { opacity: 0.4 },
  testButtonRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  testButtonText: { fontSize: 12, fontWeight: '700', color: D.primary },
  pushSuccess: { fontSize: 12, fontWeight: '700', color: D.success, marginTop: 8 },
  pushError: { fontSize: 12, fontWeight: '700', color: D.danger, marginTop: 8 },
  archiveButton: { marginTop: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: D.warningText, backgroundColor: D.warningSoft, alignItems: 'center' },
  archiveButtonText: { fontSize: 14, fontWeight: '800', color: D.warningText },
  reactivateButton: { borderColor: D.success, backgroundColor: '#E7F5EC' },
  reactivateButtonText: { color: D.success },
});
