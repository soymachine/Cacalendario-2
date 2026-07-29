import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { completeGoogleDoctorProfile, type DoctorInfo } from '../lib/doctor';
import { D } from '../lib/design';

interface GoogleProfileScreenProps {
  userId: string;
  suggestedName: string;
  onComplete: (doctor: DoctorInfo) => void;
}

export default function GoogleProfileScreen({ userId, suggestedName, onComplete }: GoogleProfileScreenProps) {
  const [name, setName] = useState(suggestedName);
  const [centerName, setCenterName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Introduce tu nombre'); return; }
    if (!centerName.trim()) { setError('Introduce el nombre de tu consulta o centro'); return; }
    setLoading(true);
    const { doctor, error: err } = await completeGoogleDoctorProfile(userId, name, centerName, specialty || null);
    setLoading(false);
    if (err || !doctor) { setError(err || 'Error al crear tu perfil'); return; }
    onComplete(doctor);
  };

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Completa tu perfil</Text>
          <Text style={styles.subheading}>Un último paso para activar tu cuenta médica</Text>

          <Text style={styles.label}>TU NOMBRE</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Dr. García" placeholderTextColor={D.textMuted} style={styles.input} />

          <Text style={styles.label}>CONSULTA O CENTRO</Text>
          <TextInput value={centerName} onChangeText={setCenterName} placeholder="Consulta Dr. García" placeholderTextColor={D.textMuted} style={styles.input} />

          <Text style={styles.label}>ESPECIALIDAD (OPCIONAL)</Text>
          <TextInput
            value={specialty}
            onChangeText={setSpecialty}
            placeholder="Gastroenterología..."
            placeholderTextColor={D.textMuted}
            onSubmitEditing={handleSubmit}
            style={styles.input}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={handleSubmit} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>
            <Text style={styles.primaryButtonText}>{loading ? '...' : 'Crear mi cuenta médica'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  container: { paddingHorizontal: 24, paddingTop: 64, flexGrow: 1 },
  heading: { fontSize: 22, fontWeight: '900', color: D.text, textAlign: 'center' },
  subheading: { fontSize: 13, color: D.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '900', color: D.textMuted, letterSpacing: 0.5, marginTop: 16 },
  input: { width: '100%', backgroundColor: D.chip, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, color: D.text, marginTop: 8 },
  error: { fontSize: 13, color: D.danger, marginTop: 12 },
  primaryButton: { width: '100%', marginTop: 24, paddingVertical: 14, borderRadius: 99, backgroundColor: D.primary, alignItems: 'center' },
  primaryButtonText: { color: D.primaryText, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
