import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { filterEntriesByDateRange } from '../lib/entryFilters';
import type { PatientEntry } from '../lib/patientDetail';
import { FLOATS_LABEL, DURATION_LABEL, SYMPTOM_LABEL, URINE_TYPE_LABEL, URINE_CHAR_LABEL } from '../lib/entryLabels';
import { D } from '../lib/design';

const ENTRIES_PER_PAGE = 10;

interface PatientEntriesListProps {
  entries: PatientEntry[];
  totalEntries: number;
  onSaveNote: (entryId: string, note: string) => Promise<void>;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Chip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <Text style={[chipStyles.chip, { backgroundColor: bg, color }]}>{label}</Text>;
}

const chipStyles = StyleSheet.create({
  chip: { fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
});

export default function PatientEntriesList({ entries, totalEntries, onSaveNote }: PatientEntriesListProps) {
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<{ entryId: string; draft: string } | null>(null);

  const filtered = filterEntriesByDateRange(entries, filterFrom, filterTo);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ENTRIES_PER_PAGE));
  const paged = filtered.slice(page * ENTRIES_PER_PAGE, (page + 1) * ENTRIES_PER_PAGE);
  const hasFilter = !!(filterFrom || filterTo);

  const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Historial {hasFilter ? `(${filtered.length} de ${totalEntries})` : `(${totalEntries})`}
        </Text>
        {hasFilter && (
          <Pressable onPress={() => { setFilterFrom(''); setFilterTo(''); setPage(0); }}>
            <Text style={styles.clearFilter}>✕ Limpiar</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        <Pressable onPress={() => setShowFromPicker(true)} style={styles.dateButton}>
          <Text style={styles.dateButtonText}>{filterFrom ? shortDate(filterFrom) : 'Desde'}</Text>
        </Pressable>
        <Pressable onPress={() => setShowToPicker(true)} style={styles.dateButton}>
          <Text style={styles.dateButtonText}>{filterTo ? shortDate(filterTo) : 'Hasta'}</Text>
        </Pressable>
      </View>
      {showFromPicker && (
        <DateTimePicker
          value={filterFrom ? new Date(filterFrom) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, date) => { setShowFromPicker(false); if (date) { setFilterFrom(toDateKey(date)); setPage(0); } }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={filterTo ? new Date(filterTo) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, date) => { setShowToPicker(false); if (date) { setFilterTo(toDateKey(date)); setPage(0); } }}
        />
      )}

      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>
          {hasFilter ? 'No hay registros en ese rango de fechas.' : 'Este paciente no tiene registros aún.'}
        </Text>
      ) : (
        paged.map((entry, i) => {
          const isUrine = entry.entry_type === 'urine';
          const bristolColor = entry.bristol == null ? null : entry.bristol >= 3 && entry.bristol <= 5 ? D.success : entry.bristol < 3 ? '#C0832B' : D.danger;
          const bristolBg = bristolColor === D.success ? '#E7F5EC' : bristolColor === '#C0832B' ? '#FCF4E7' : D.dangerBg;
          const isEditing = editing?.entryId === entry.entry_id;
          return (
            <View key={entry.entry_id || i} style={[styles.entryRow, i < paged.length - 1 && styles.entryRowBorder]}>
              <View style={styles.entryTop}>
                <View style={[styles.dot, { backgroundColor: isUrine ? D.accent : D.secondary }]} />
                <Text style={styles.entryDate}>{shortDate(entry.date)}</Text>
                {!!entry.time && <Text style={styles.entryTime}>{entry.time}</Text>}
                <Pressable
                  onPress={() => setEditing(isEditing ? null : { entryId: entry.entry_id, draft: entry.doctor_note || '' })}
                  style={styles.noteButton}
                >
                  <Text style={[styles.noteButtonText, entry.doctor_note ? styles.noteButtonActive : styles.noteButtonInactive]}>📝</Text>
                </Pressable>
              </View>

              <View style={styles.chipsRow}>
                {isUrine ? (
                  <>
                    {entry.urine_type != null && <Chip label={URINE_TYPE_LABEL[entry.urine_type] || entry.urine_type} bg="#EAF2FB" color={D.primary} />}
                    {entry.urine_quantity != null && entry.urine_quantity > 0 && <Chip label={`${entry.urine_quantity} ml`} bg={D.accentSoft} color={D.accent} />}
                    {entry.urine_characteristics.map((c) => <Chip key={c} label={URINE_CHAR_LABEL[c] || c} bg="#FBEDED" color="#B94A4A" />)}
                    {entry.urine_urgency != null && <Chip label={`Urgencia ${entry.urine_urgency}/5`} bg="#FCF4E7" color="#C0832B" />}
                    {entry.during_sleep === true && <Chip label="Durante sueño" bg="#E7F5EC" color={D.secondary} />}
                  </>
                ) : (
                  <>
                    {entry.bristol != null && <Chip label={`T${entry.bristol}`} bg={bristolBg} color={bristolColor!} />}
                    {entry.floats != null && <Chip label={FLOATS_LABEL[entry.floats]} bg="#EAF2FB" color={D.primary} />}
                    {entry.quantity != null && <Chip label={`${entry.quantity}`} bg={D.accentSoft} color={D.accent} />}
                    {entry.duration != null && <Chip label={DURATION_LABEL[entry.duration]} bg="#FCF4E7" color="#C0832B" />}
                    {entry.symptoms.map((s) => <Chip key={s} label={SYMPTOM_LABEL[s] || s} bg="#FBEDED" color="#B94A4A" />)}
                  </>
                )}
              </View>

              {!!entry.notes && <Text style={styles.patientNote}>{entry.notes}</Text>}

              {!!entry.doctor_note && !isEditing && (
                <View style={styles.doctorNoteBox}>
                  <Text style={styles.doctorNoteText}>{entry.doctor_note}</Text>
                </View>
              )}

              {isEditing && (
                <View style={styles.editBox}>
                  <TextInput
                    value={editing.draft}
                    onChangeText={(v) => setEditing({ ...editing, draft: v })}
                    placeholder="Anotación médica (ej: inicio de omeprazol, coincide con brote...)"
                    placeholderTextColor={D.textMuted}
                    multiline
                    numberOfLines={2}
                    style={styles.editInput}
                  />
                  <View style={styles.editActions}>
                    <Pressable onPress={async () => { await onSaveNote(entry.entry_id, editing.draft); setEditing(null); }} style={styles.editSave}>
                      <Text style={styles.editSaveText}>Guardar</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditing(null)} style={styles.editCancel}>
                      <Text style={styles.editCancelText}>Cancelar</Text>
                    </Pressable>
                    {!!entry.doctor_note && (
                      <Pressable onPress={async () => { await onSaveNote(entry.entry_id, ''); setEditing(null); }} style={styles.editDelete}>
                        <Text style={styles.editDeleteText}>Eliminar</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <Pressable onPress={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}>
            <Text style={styles.pageButtonText}>← Anterior</Text>
          </Pressable>
          <Text style={styles.pageInfo}>Página {page + 1} de {totalPages}</Text>
          <Pressable onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={[styles.pageButton, page === totalPages - 1 && styles.pageButtonDisabled]}>
            <Text style={styles.pageButtonText}>Siguiente →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: D.card, borderRadius: 16, padding: 14, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '800', color: D.text },
  clearFilter: { fontSize: 11, color: D.danger, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  dateButton: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: D.chip, alignItems: 'center' },
  dateButtonText: { fontSize: 12, color: D.textMuted, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: D.textMuted, fontSize: 13, paddingVertical: 24 },
  entryRow: { paddingVertical: 10 },
  entryRowBorder: { borderBottomWidth: 1, borderBottomColor: D.border },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  entryDate: { fontSize: 13, fontWeight: '700', color: D.text },
  entryTime: { fontSize: 11, color: D.textMuted },
  noteButton: { marginLeft: 'auto', padding: 4 },
  noteButtonText: { fontSize: 14 },
  noteButtonActive: { opacity: 1 },
  noteButtonInactive: { opacity: 0.25 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  patientNote: { fontSize: 12, color: D.textMuted, marginTop: 6, lineHeight: 17 },
  doctorNoteBox: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FCF4E7', borderLeftWidth: 3, borderLeftColor: '#C0832B' },
  doctorNoteText: { fontSize: 12, color: '#8A5A1E', lineHeight: 17 },
  editBox: { marginTop: 8, gap: 6 },
  editInput: { borderWidth: 1, borderColor: '#C0832B', backgroundColor: '#FCF4E7', borderRadius: 10, padding: 10, fontSize: 12, color: D.text, minHeight: 60, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 8 },
  editSave: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#C0832B' },
  editSaveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  editCancel: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: D.border },
  editCancelText: { color: D.textMuted, fontSize: 12 },
  editDelete: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: D.dangerBg },
  editDeleteText: { color: D.danger, fontSize: 12, fontWeight: '700' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: D.border },
  pageButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: D.border },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { fontSize: 12, color: D.text },
  pageInfo: { fontSize: 11, color: D.textMuted },
});
