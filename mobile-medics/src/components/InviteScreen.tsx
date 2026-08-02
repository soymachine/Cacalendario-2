import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DoctorInfo } from '../lib/doctor';
import type { PatientLink } from '../lib/patients';
import { invitePatient, planLimitFor, FREE_PLAN_PATIENT_LIMIT, BETA_PLAN_PATIENT_LIMIT } from '../lib/invite';
import { D, FORM_MAX_WIDTH, centered } from '../lib/design';

interface InviteScreenProps {
  doctor: DoctorInfo;
  patients: PatientLink[];
  onInvited: () => void;
}

export default function InviteScreen({ doctor, patients, onInvited }: InviteScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ emailSent: boolean; emailError: string | null } | null>(null);

  const activeCount = patients.filter((p) => !p.doctor_unlinked).length;
  const limit = planLimitFor(doctor.plan);
  const atLimit = limit !== null && activeCount >= limit;

  const handleInvite = async () => {
    setError('');
    setSuccess(null);
    if (!email.trim()) { setError('Introduce el email del paciente'); return; }
    setLoading(true);
    const result = await invitePatient(email, doctor, patients);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    setSuccess({ emailSent: result.emailSent, emailError: result.emailError });
    setEmail('');
    onInvited();
  };

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.container, centered(FORM_MAX_WIDTH)]} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Invitar paciente</Text>
          <Text style={styles.subtitle}>Envía una invitación por email a tu paciente</Text>

          {(doctor.plan === 'free' || doctor.plan === 'beta') && (
            <View style={styles.planBanner}>
              <Text style={styles.planBannerTitle}>
                {doctor.plan === 'beta'
                  ? `Plan Beta · ${activeCount}/${BETA_PLAN_PATIENT_LIMIT} pacientes`
                  : `Plan Free · ${activeCount}/${FREE_PLAN_PATIENT_LIMIT} paciente${FREE_PLAN_PATIENT_LIMIT === 1 ? '' : 's'}`}
              </Text>
              <Text style={styles.planBannerBody}>
                {atLimit
                  ? 'Has alcanzado el límite de tu plan. Pasa a Pro desde la web para añadir más pacientes.'
                  : doctor.plan === 'beta' ? 'Acceso beta · hasta 100 pacientes.' : 'El primer paciente es gratis.'}
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.label}>EMAIL DEL PACIENTE</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={atLimit ? 'Límite de pacientes alcanzado' : 'paciente@email.com'}
              placeholderTextColor={D.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!atLimit}
              onSubmitEditing={handleInvite}
              style={[styles.input, atLimit && styles.inputDisabled]}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            {success && (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>✅ Invitación enviada</Text>
                {success.emailSent && <Text style={styles.successBody}>El paciente recibirá un email con las instrucciones.</Text>}
                {success.emailError && <Text style={styles.successWarning}>{success.emailError}</Text>}
                <Text style={styles.successMuted}>El paciente verá la invitación en su cuenta al iniciar sesión.</Text>
              </View>
            )}
            <Pressable
              onPress={handleInvite}
              disabled={loading || !email.trim() || atLimit}
              style={[styles.button, (loading || !email.trim() || atLimit) && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar invitación'}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.instructionsTitle}>Instrucciones para el paciente</Text>
            <Text style={styles.instructionsBody}>
              1. Abrir la app en fluxia-health.com/user{'\n'}
              2. Iniciar sesión con el email al que le enviaste la invitación{'\n'}
              3. Ir a Configuración y aceptar la invitación del médico
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '900', color: D.text },
  subtitle: { fontSize: 13, color: D.textMuted, marginTop: 4, marginBottom: 16 },
  planBanner: { backgroundColor: '#FCF4E7', borderRadius: 14, padding: 14, marginBottom: 16 },
  planBannerTitle: { fontSize: 13, fontWeight: '800', color: '#C0832B' },
  planBannerBody: { fontSize: 12, color: '#C0832B', marginTop: 2 },
  card: { backgroundColor: D.card, borderRadius: 16, padding: 18, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '900', color: D.textMuted, letterSpacing: 0.5, marginBottom: 8 },
  input: { width: '100%', backgroundColor: D.chip, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: D.text },
  inputDisabled: { opacity: 0.5 },
  error: { fontSize: 13, color: D.danger, marginTop: 10 },
  successBox: { backgroundColor: '#E7F5EC', borderRadius: 10, padding: 14, marginTop: 12, gap: 2 },
  successTitle: { fontSize: 13, fontWeight: '800', color: D.success },
  successBody: { fontSize: 12, color: D.textMuted },
  successWarning: { fontSize: 12, color: '#C0832B' },
  successMuted: { fontSize: 11, color: D.textMuted, marginTop: 4 },
  button: { marginTop: 16, paddingVertical: 14, borderRadius: 99, backgroundColor: D.primary, alignItems: 'center' },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: D.primaryText, fontSize: 15, fontWeight: '700' },
  instructionsTitle: { fontSize: 15, fontWeight: '800', color: D.text, marginBottom: 8 },
  instructionsBody: { fontSize: 13, color: D.textMuted, lineHeight: 22 },
});
