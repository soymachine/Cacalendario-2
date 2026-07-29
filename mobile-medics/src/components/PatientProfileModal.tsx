import { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { PatientLink } from '../lib/patients';
import { saveProfile } from '../lib/patientDetail';
import { D } from '../lib/design';

interface PatientProfileModalProps {
  patient: PatientLink;
  onClose: () => void;
  onSaved: (patch: Partial<PatientLink>) => void;
}

export default function PatientProfileModal({ patient, onClose, onSaved }: PatientProfileModalProps) {
  const [dob, setDob] = useState(patient.dob || '');
  const [height, setHeight] = useState(patient.height_cm != null ? String(patient.height_cm) : '');
  const [weight, setWeight] = useState(patient.weight_kg != null ? String(patient.weight_kg) : '');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await saveProfile(patient.id, { dob, heightCm: height, weightKg: weight });
    setSaving(false);
    if (!error) {
      onSaved({ dob: dob || null, height_cm: height ? parseInt(height, 10) : null, weight_kg: weight ? parseFloat(weight) : null });
      onClose();
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaProvider>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.centerWrap}>
          <View style={styles.card}>
            <Text style={styles.title}>👤 Datos del paciente</Text>
            <Text style={styles.subtitle}>Solo tú puedes ver y editar estos datos.</Text>

            <Text style={styles.label}>NOMBRE</Text>
            <Text style={styles.readOnly}>{patient.display_name || '—'}</Text>

            <Text style={styles.label}>EMAIL</Text>
            <Text style={styles.readOnly}>{patient.patient_email || '—'}</Text>

            <Text style={styles.label}>FECHA DE NACIMIENTO{age !== null ? ` · ${age} años` : ''}</Text>
            <Pressable onPress={() => setShowPicker(true)} style={styles.input}>
              <Text style={dob ? styles.inputText : styles.inputPlaceholder}>{dob || 'Seleccionar fecha'}</Text>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={dob ? new Date(dob) : new Date(1990, 0, 1)}
                mode="date"
                maximumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, date) => { setShowPicker(false); if (date) setDob(date.toISOString().slice(0, 10)); }}
              />
            )}

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>ESTATURA (CM)</Text>
                <TextInput value={height} onChangeText={setHeight} placeholder="175" placeholderTextColor={D.textMuted} keyboardType="numeric" style={styles.input} />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>PESO (KG)</Text>
                <TextInput value={weight} onChangeText={setWeight} placeholder="70" placeholderTextColor={D.textMuted} keyboardType="decimal-pad" style={styles.input} />
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                <Text style={styles.saveButtonText}>{saving ? '...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  safeArea: { flex: 1 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  title: { fontSize: 17, fontWeight: '900', color: D.text, marginBottom: 4 },
  subtitle: { fontSize: 12, color: D.textMuted, marginBottom: 18 },
  label: { fontSize: 11, fontWeight: '800', color: D.textMuted, marginBottom: 4, marginTop: 10 },
  readOnly: { fontSize: 14, color: D.text, backgroundColor: D.bg, borderWidth: 1, borderColor: D.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  input: { backgroundColor: D.bg, borderWidth: 1, borderColor: D.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: D.text },
  inputText: { fontSize: 14, color: D.text },
  inputPlaceholder: { fontSize: 14, color: D.textMuted },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 99, borderWidth: 1, borderColor: D.border, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: D.textMuted },
  saveButton: { flex: 1, paddingVertical: 12, borderRadius: 99, backgroundColor: D.text, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
