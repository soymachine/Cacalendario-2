import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Switch, Modal, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import type { DoctorInfo } from '../lib/doctor';
import type { PatientLink } from '../lib/patients';
import { savePatientConfig, savePatientTags } from '../lib/patientDetail';
import { saveGlobalTags } from '../lib/config';
import { tagColor } from '../lib/tags';
import { ENTRY_TYPE_FIELDS } from '../lib/entryLabels';
import { D } from '../lib/design';

interface PatientConfigModalProps {
  doctor: DoctorInfo;
  patient: PatientLink;
  onClose: () => void;
  onSaved: (patch: Partial<PatientLink>) => void;
  onGlobalTagsUpdated: (tags: string[]) => void;
}

export default function PatientConfigModal({ doctor, patient, onClose, onSaved, onGlobalTagsUpdated }: PatientConfigModalProps) {
  const [semaforoOverride, setSemaforoOverride] = useState(patient.semaforo_override ?? false);
  const [green, setGreen] = useState(patient.semaforo_green_override ?? doctor.semaforo_green);
  const [red, setRed] = useState(patient.semaforo_red_override ?? doctor.semaforo_red);
  const [entryTypeMode, setEntryTypeMode] = useState(patient.entry_type_mode || 'both');
  const [hiddenFields, setHiddenFields] = useState<string[]>(patient.hidden_fields || []);
  const [tags, setTags] = useState<string[]>(patient.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const globalTags = doctor.global_tags || [];

  const toggleField = (fieldId: string) => {
    setHiddenFields((prev) => prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]);
  };

  const toggleTag = async (tag: string) => {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    setTags(next);
    await savePatientTags(patient.id, next);
  };

  const handleCreateAndAssignTag = async () => {
    const v = newTagInput.trim();
    if (!v) return;
    setNewTagInput('');
    if (!globalTags.includes(v)) {
      const newGlobal = [...globalTags, v];
      await saveGlobalTags(doctor.id, newGlobal);
      onGlobalTagsUpdated(newGlobal);
    }
    if (!tags.includes(v)) {
      const nextTags = [...tags, v];
      setTags(nextTags);
      await savePatientTags(patient.id, nextTags);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await savePatientConfig(patient.id, {
      semaforoOverride, semaforoGreen: green, semaforoRed: red, hiddenFields, entryTypeMode, tags,
    });
    setSaving(false);
    if (err) { setError(err); return; }
    onSaved({
      semaforo_override: semaforoOverride,
      semaforo_green_override: semaforoOverride ? green : null,
      semaforo_red_override: semaforoOverride ? red : null,
      hidden_fields: hiddenFields,
      entry_type_mode: entryTypeMode,
      tags,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const visibleFields = ENTRY_TYPE_FIELDS.filter((f) => {
    if (entryTypeMode === 'urine_only' && f.section === 'poop') return false;
    if (entryTypeMode === 'poop_only' && f.section === 'urine') return false;
    return true;
  });

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>Configuración — {patient.display_name || patient.patient_email}</Text>
          <Pressable onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Switch value={semaforoOverride} onValueChange={setSemaforoOverride} trackColor={{ true: D.primary, false: D.chipDark }} thumbColor="#fff" />
              <Text style={styles.switchLabel}>Semáforo personalizado</Text>
              {!semaforoOverride && <Text style={styles.switchHint}>usa valores generales</Text>}
            </View>
            {semaforoOverride && (
              <>
                <Text style={[styles.thresholdLabel, { color: D.success }]}>Al día: ≤ {green} día{green !== 1 ? 's' : ''}</Text>
                <Slider
                  minimumValue={0} maximumValue={Math.max(red - 1, 1)} step={1} value={green}
                  onValueChange={(v) => { setGreen(v); if (v >= red) setRed(v + 1); }}
                  minimumTrackTintColor={D.success} maximumTrackTintColor={D.chipDark} thumbTintColor={D.success}
                />
                <Text style={[styles.thresholdLabel, { color: D.danger, marginTop: 10 }]}>Inactivo: &gt; {red} días</Text>
                <Slider
                  minimumValue={Math.max(green + 1, 1)} maximumValue={30} step={1} value={red}
                  onValueChange={(v) => { setRed(v); if (v <= green) setGreen(v - 1); }}
                  minimumTrackTintColor={D.danger} maximumTrackTintColor={D.chipDark} thumbTintColor={D.danger}
                />
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Etiquetas</Text>
            <View style={styles.tagsRow}>
              {globalTags.length === 0 ? (
                <Text style={styles.mutedItalic}>Sin etiquetas. Escribe una nueva abajo para crearla.</Text>
              ) : globalTags.map((t) => {
                const assigned = tags.includes(t);
                return (
                  <Pressable key={t} onPress={() => toggleTag(t)} style={[styles.tagChip, { backgroundColor: assigned ? tagColor(t) + '22' : 'transparent', borderWidth: assigned ? 0 : 1, borderColor: tagColor(t) + '40' }]}>
                    <Text style={[styles.tagChipText, { color: assigned ? tagColor(t) : D.textMuted, fontWeight: assigned ? '800' : '500' }]}>{assigned ? '✓ ' : ''}{t}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.tagInputRow}>
              <TextInput value={newTagInput} onChangeText={setNewTagInput} placeholder="Nueva etiqueta global…" placeholderTextColor={D.textMuted} onSubmitEditing={handleCreateAndAssignTag} style={styles.tagInput} />
              <Pressable onPress={handleCreateAndAssignTag} style={styles.tagCreateButton}>
                <Text style={styles.tagCreateButtonText}>Crear y asignar</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Campos del formulario</Text>
            <Text style={styles.fieldsSubtitle}>Tipo de registro permitido</Text>
            <View style={styles.modeRow}>
              {[{ value: 'both', label: 'Ambas' }, { value: 'poop_only', label: 'Solo deposición' }, { value: 'urine_only', label: 'Solo micción' }].map((opt) => (
                <Pressable key={opt.value} onPress={() => setEntryTypeMode(opt.value)} style={[styles.modeButton, entryTypeMode === opt.value && styles.modeButtonActive]}>
                  <Text style={[styles.modeButtonText, entryTypeMode === opt.value && styles.modeButtonTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hint}>Campos visibles para este paciente al registrar. La fecha/hora y las notas siempre aparecen.</Text>
            {visibleFields.map((field, i) => (
              <View key={field.id}>
                {field.group && <Text style={styles.groupHeader}>{field.group}</Text>}
                <View style={[styles.fieldRow, i < visibleFields.length - 1 && styles.fieldRowBorder]}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Switch
                    value={!hiddenFields.includes(field.id)}
                    onValueChange={() => toggleField(field.id)}
                    trackColor={{ true: D.primary, false: D.chipDark }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            ))}
          </View>

          {saved && <Text style={styles.saved}>✅ Configuración guardada</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={handleSave} disabled={saving} style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar configuración'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: D.text },
  headerTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700', marginRight: 12 },
  closeText: { color: '#fff', fontSize: 24, lineHeight: 24 },
  content: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: D.card, borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: D.text, marginBottom: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  switchLabel: { fontSize: 13, fontWeight: '600', color: D.textMuted },
  switchHint: { fontSize: 11, color: D.textMuted, opacity: 0.7 },
  thresholdLabel: { fontSize: 12, fontWeight: '800' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  mutedItalic: { fontSize: 12, color: D.textMuted, fontStyle: 'italic' },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  tagChipText: { fontSize: 12 },
  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tagInput: { flex: 1, backgroundColor: D.chip, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: D.text },
  tagCreateButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: D.chipDark },
  tagCreateButtonText: { fontSize: 11, fontWeight: '700', color: D.textMuted },
  fieldsSubtitle: { fontSize: 12, fontWeight: '700', color: D.textMuted, marginBottom: 8 },
  modeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  modeButton: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: D.chip, alignItems: 'center' },
  modeButtonActive: { backgroundColor: D.primary },
  modeButtonText: { fontSize: 11, fontWeight: '700', color: D.textMuted, textAlign: 'center' },
  modeButtonTextActive: { color: '#fff' },
  hint: { fontSize: 11, color: D.textMuted, lineHeight: 16, marginBottom: 10 },
  groupHeader: { fontSize: 10, fontWeight: '800', color: D.textMuted, textTransform: 'uppercase', marginTop: 10, marginBottom: 6 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  fieldRowBorder: { borderBottomWidth: 1, borderBottomColor: D.border },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: D.text },
  saved: { fontSize: 13, color: D.success, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  error: { fontSize: 12, color: D.danger, marginBottom: 8 },
  saveButton: { paddingVertical: 14, borderRadius: 12, backgroundColor: D.text, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
