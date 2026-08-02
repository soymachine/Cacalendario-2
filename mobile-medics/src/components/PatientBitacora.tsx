import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import type { ClinicalNote } from '../lib/patientDetail';
import { D } from '../lib/design';

const NOTES_PER_PAGE = 10;

interface PatientBitacoraProps {
  notes: ClinicalNote[];
  onAddNote: (note: string) => Promise<void>;
}

export default function PatientBitacora({ notes, onAddNote }: PatientBitacoraProps) {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);

  const sorted = [...notes].sort((a, b) => sortDesc
    ? b.created_at.localeCompare(a.created_at)
    : a.created_at.localeCompare(b.created_at));
  const totalPages = Math.max(1, Math.ceil(sorted.length / NOTES_PER_PAGE));
  const paged = sorted.slice(page * NOTES_PER_PAGE, (page + 1) * NOTES_PER_PAGE);

  const handleAdd = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    await onAddNote(draft);
    setDraft('');
    setPage(0);
    setSaving(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Bitácora</Text>
        <Pressable onPress={() => { setSortDesc((s) => !s); setPage(0); }} style={styles.sortButton}>
          <Text style={styles.sortButtonText}>{sortDesc ? '↓ Más reciente' : '↑ Más antigua'}</Text>
        </Pressable>
      </View>

      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Añadir nota clínica…"
        placeholderTextColor={D.textMuted}
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      <Pressable onPress={handleAdd} disabled={saving || !draft.trim()} style={[styles.addButton, (saving || !draft.trim()) && styles.addButtonDisabled]}>
        <Text style={styles.addButtonText}>{saving ? 'Guardando…' : 'Agregar nota'}</Text>
      </Pressable>

      {paged.length === 0 ? (
        <Text style={styles.emptyText}>Sin notas todavía.</Text>
      ) : (
        <View style={styles.notesList}>
          {paged.map((n) => (
            <View key={n.id} style={styles.noteRow}>
              <Text style={styles.noteText}>{n.note}</Text>
              <Text style={styles.noteDate}>
                {new Date(n.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {sorted.length > NOTES_PER_PAGE && (
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '800', color: D.text },
  sortButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: D.border },
  sortButtonText: { fontSize: 11, color: D.textMuted, fontWeight: '600' },
  input: { backgroundColor: D.chip, borderRadius: 10, padding: 10, fontSize: 13, color: D.text, minHeight: 64, textAlignVertical: 'top', marginBottom: 8 },
  addButton: { paddingVertical: 10, borderRadius: 99, backgroundColor: D.primary, alignItems: 'center', marginBottom: 12 },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: D.primaryText, fontSize: 13, fontWeight: '700' },
  emptyText: { fontSize: 13, color: D.textMuted, textAlign: 'center', paddingVertical: 12 },
  notesList: { gap: 0 },
  noteRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: D.border },
  noteText: { fontSize: 13, color: D.textMuted, lineHeight: 19 },
  noteDate: { fontSize: 11, color: D.textMuted, marginTop: 4, opacity: 0.7 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: D.border },
  pageButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: D.border },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { fontSize: 12, color: D.text },
  pageInfo: { fontSize: 11, color: D.textMuted },
});
