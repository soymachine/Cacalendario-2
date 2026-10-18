import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Switch, Modal, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { DoctorInfo } from '../lib/doctor';
import type { PatientLink } from '../lib/patients';
import { invitePatient, planLimitFor, BETA_PLAN_PATIENT_LIMIT } from '../lib/invite';
import { saveFoodTagCatalog } from '../lib/config';
import { linkFoodConfig, enableFoodConfig, addTag, localDateKey, type FoodTrackingConfig } from '../lib/food';
import { ENTRY_TYPE_FIELDS } from '../lib/entryLabels';
import FoodConfigCard from './FoodConfigCard';
import { D, FORM_MAX_WIDTH, centered } from '../lib/design';

// Invitar a un paciente en dos pasos, con su pauta ya configurada.
// Portado de src/components/InvitePatientModal.tsx (MW) — mantener sincronizado a mano.
//  1. ¿Registra comidas? → pauta de comidas (deshabilitada hasta decir que sí).
//  2. ¿Registra deposiciones / micciones? → tipo de registro y campos.

interface InvitePatientModalProps {
  doctor: DoctorInfo;
  patients: PatientLink[];
  onClose: () => void;
  onInvited: () => void;
  onFoodTagCatalogUpdated: (tags: string[]) => void;
}

type CoreMode = 'both' | 'poop_only' | 'urine_only' | 'none';

const CORE_OPTIONS: { value: CoreMode; label: string; desc?: string }[] = [
  { value: 'both', label: 'Ambas', desc: 'Deposiciones y micciones' },
  { value: 'poop_only', label: 'Solo deposiciones' },
  { value: 'urine_only', label: 'Solo micciones' },
  { value: 'none', label: 'No', desc: 'Solo registrará comidas' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InvitePatientModal({ doctor, patients, onClose, onInvited, onFoodTagCatalogUpdated }: InvitePatientModalProps) {
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [email, setEmail] = useState('');
  const [foodChoice, setFoodChoice] = useState<'yes' | 'no' | null>(null);
  const [foodConfig, setFoodConfig] = useState<FoodTrackingConfig>(() => linkFoodConfig(null));
  const [foodCatalog, setFoodCatalog] = useState<string[]>(doctor.food_tag_catalog || []);
  const [coreChoice, setCoreChoice] = useState<CoreMode | null>(null);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ email: string; emailSent: boolean; emailError: string | null } | null>(null);

  const activeCount = patients.filter((p) => !p.doctor_unlinked).length;
  const limit = planLimitFor(doctor.plan);
  const atLimit = limit !== null && activeCount >= limit;

  const emailOk = EMAIL_RE.test(email.trim());
  const canNext = emailOk && foodChoice !== null && !atLimit;
  const canFinish = coreChoice !== null && !sending;
  const coreOptions = CORE_OPTIONS.filter((o) => o.value !== 'none' || foodChoice === 'yes');
  const fields = ENTRY_TYPE_FIELDS.filter((f) =>
    !(coreChoice === 'urine_only' && f.section === 'poop') && !(coreChoice === 'poop_only' && f.section === 'urine'));

  const chooseFood = (choice: 'yes' | 'no') => {
    setFoodChoice(choice);
    if (choice === 'no' && coreChoice === 'none') setCoreChoice(null);
  };

  const handleCreateFoodTag = async (tag: string) => {
    if (foodCatalog.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    const next = addTag(foodCatalog, tag);
    setFoodCatalog(next);
    const { error: err } = await saveFoodTagCatalog(doctor.id, next);
    if (!err) onFoodTagCatalogUpdated(next);
  };

  const reset = () => {
    setStep(1); setEmail(''); setFoodChoice(null); setFoodConfig(linkFoodConfig(null));
    setCoreChoice(null); setHiddenFields([]); setError(''); setResult(null);
  };

  const finish = async () => {
    if (!coreChoice || !foodChoice) return;
    setSending(true);
    setError('');
    const res = await invitePatient({
      email: email.trim(),
      entryTypeMode: coreChoice,
      hiddenFields: coreChoice === 'none' ? [] : hiddenFields,
      foodConfig: foodChoice === 'yes' ? enableFoodConfig(foodConfig, localDateKey()) : { ...foodConfig, enabled: false },
    }, doctor, patients);
    setSending(false);
    if (!res.success) { setError(res.error); return; }
    setResult({ email: email.trim(), emailSent: res.emailSent, emailError: res.emailError });
    setStep('done');
    onInvited();
  };

  const option = (active: boolean) => [styles.option, active && styles.optionActive];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <SafeAreaView edges={['top', 'bottom']} style={styles.safe} pointerEvents="box-none">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.sheet, centered(FORM_MAX_WIDTH + 80)]}>
            {/* Cabecera */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Invitar a un paciente</Text>
                {step !== 'done' && (
                  <View style={styles.stepsRow}>
                    {[1, 2].map((n) => <View key={n} style={[styles.stepBar, { backgroundColor: n <= step ? D.primary : D.chipDark }]} />)}
                    <Text style={styles.stepText}>Paso {step} de 2</Text>
                  </View>
                )}
              </View>
              <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Cerrar"><Text style={styles.close}>×</Text></Pressable>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
              {step === 1 && (
                <>
                  {doctor.plan === 'beta' && atLimit && (
                    <View style={styles.planBanner}>
                      <Text style={styles.planBannerTitle}>{`Plan Beta · ${activeCount}/${BETA_PLAN_PATIENT_LIMIT} pacientes`}</Text>
                      <Text style={styles.planBannerBody}>Has alcanzado el límite de tu plan. Archiva pacientes o pasa a Pro desde la web para invitar a más.</Text>
                    </View>
                  )}
                  <Text style={styles.label}>EMAIL DEL PACIENTE</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="paciente@email.com"
                    placeholderTextColor={D.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!atLimit}
                    style={[styles.input, atLimit && styles.disabled]}
                  />

                  <Text style={styles.question}>¿Quieres que registre sus comidas?</Text>
                  <View style={styles.optionsRow}>
                    {([['yes', 'Sí', 'Configura la pauta abajo'], ['no', 'No', 'Sin seguimiento de comidas']] as const).map(([value, label, desc]) => (
                      <Pressable key={value} onPress={() => chooseFood(value)} style={[option(foodChoice === value), styles.optionHalf]}
                        accessibilityRole="radio" accessibilityState={{ checked: foodChoice === value }}>
                        <Text style={styles.optionLabel}>{label}</Text>
                        <Text style={styles.optionDesc}>{desc}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={foodChoice !== 'yes' && styles.disabled} pointerEvents={foodChoice === 'yes' ? 'auto' : 'none'}>
                    <FoodConfigCard
                      value={foodConfig}
                      onChange={setFoodConfig}
                      catalog={foodCatalog}
                      onCreateTag={handleCreateFoodTag}
                      today={localDateKey()}
                      hideToggle
                    />
                  </View>
                </>
              )}

              {step === 2 && (
                <>
                  <Text style={[styles.question, { marginTop: 0 }]}>¿Registrará también deposiciones y micciones?</Text>
                  <View style={styles.optionsRow}>
                    {coreOptions.map((o) => (
                      <Pressable key={o.value} onPress={() => setCoreChoice(o.value)} style={[option(coreChoice === o.value), styles.optionHalf]}
                        accessibilityRole="radio" accessibilityState={{ checked: coreChoice === o.value }}>
                        <Text style={styles.optionLabel}>{o.label}</Text>
                        {!!o.desc && <Text style={styles.optionDesc}>{o.desc}</Text>}
                      </Pressable>
                    ))}
                  </View>

                  {coreChoice !== 'none' && (
                    <View style={[styles.card, coreChoice === null && styles.disabled]} pointerEvents={coreChoice === null ? 'none' : 'auto'}>
                      <Text style={styles.hint}>Campos visibles para el paciente al registrar. La fecha, la hora y las notas siempre aparecen.</Text>
                      {fields.map((field, i) => (
                        <View key={field.id}>
                          {field.group && <Text style={styles.groupHeader}>{field.group}</Text>}
                          <View style={[styles.fieldRow, i < fields.length - 1 && styles.fieldRowBorder]}>
                            <Text style={styles.fieldLabel}>{field.label}</Text>
                            <Switch
                              value={!hiddenFields.includes(field.id)}
                              disabled={coreChoice === null}
                              onValueChange={(on) => setHiddenFields((prev) => on ? prev.filter((id) => id !== field.id) : [...prev, field.id])}
                              trackColor={{ true: D.primary, false: D.chipDark }}
                              thumbColor="#fff"
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  {!!error && <Text style={styles.error}>{error}</Text>}
                </>
              )}

              {step === 'done' && result && (
                <>
                  <View style={styles.successBox}>
                    <Text style={styles.successTitle}>✅ Invitación enviada</Text>
                    <Text style={styles.successEmail}>{result.email}</Text>
                  </View>
                  {result.emailSent && <Text style={styles.bodyText}>El paciente recibirá un email con los pasos para descargar la app y aceptar tu invitación.</Text>}
                  {!!result.emailError && <Text style={styles.warning}>{result.emailError}</Text>}
                  <Text style={styles.stepsTitle}>Qué tiene que hacer el paciente</Text>
                  <Text style={styles.bodyText}>
                    1. Descargar la app Fluxia (App Store o Google Play).{'\n'}
                    2. Crear su cuenta o iniciar sesión con el email al que le has invitado.
                  </Text>
                  <Text style={styles.muted}>La pauta que has elegido se aplicará en cuanto entre en la app.</Text>
                </>
              )}
            </ScrollView>

            {/* Pie */}
            <View style={styles.footer}>
              {step === 1 && (
                <>
                  <Text style={styles.footerHint} numberOfLines={2}>
                    {!canNext && !atLimit ? (!emailOk ? 'Introduce el email del paciente' : 'Elige si registrará comidas') : ''}
                  </Text>
                  <Pressable onPress={() => canNext && setStep(2)} disabled={!canNext} style={[styles.primary, !canNext && styles.primaryDisabled]}>
                    <Text style={styles.primaryText}>Siguiente</Text>
                  </Pressable>
                </>
              )}
              {step === 2 && (
                <>
                  <Pressable onPress={() => setStep(1)} disabled={sending} style={styles.secondary}><Text style={styles.secondaryText}>← Atrás</Text></Pressable>
                  <Pressable onPress={finish} disabled={!canFinish} style={[styles.primary, !canFinish && styles.primaryDisabled]}>
                    <Text style={styles.primaryText}>{sending ? 'Enviando…' : 'Finalizar'}</Text>
                  </Pressable>
                </>
              )}
              {step === 'done' && (
                <>
                  <Pressable onPress={reset} style={styles.secondary}><Text style={styles.secondaryText}>Invitar a otro</Text></Pressable>
                  <Pressable onPress={onClose} style={styles.primary}><Text style={styles.primaryText}>Cerrar</Text></Pressable>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28, 36, 40, 0.55)' },
  safe: { flex: 1, justifyContent: 'center', paddingHorizontal: 12 },
  sheet: { maxHeight: '100%', backgroundColor: D.bg, borderRadius: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, backgroundColor: D.card, borderBottomWidth: 1, borderBottomColor: D.border },
  title: { fontSize: 18, fontWeight: '900', color: D.text },
  stepsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  stepBar: { width: 36, height: 5, borderRadius: 3 },
  stepText: { fontSize: 11, fontWeight: '700', color: D.textMuted, marginLeft: 4 },
  close: { fontSize: 28, lineHeight: 28, color: D.textMuted, paddingHorizontal: 4 },
  body: { flexGrow: 0 },
  bodyContent: { padding: 16, paddingBottom: 20 },
  planBanner: { backgroundColor: D.warningSoft, borderRadius: 12, padding: 12, marginBottom: 14 },
  planBannerTitle: { fontSize: 13, fontWeight: '800', color: D.warningText },
  planBannerBody: { fontSize: 12, color: D.warningText, marginTop: 2 },
  label: { fontSize: 11, fontWeight: '900', color: D.textMuted, letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: D.card, borderRadius: 12, borderWidth: 1, borderColor: D.border, paddingVertical: 13, paddingHorizontal: 14, fontSize: 15, color: D.text },
  question: { fontSize: 15, fontWeight: '800', color: D.text, marginTop: 18, marginBottom: 10 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  option: { backgroundColor: D.card, borderRadius: 12, borderWidth: 1.5, borderColor: D.border, paddingVertical: 12, paddingHorizontal: 14 },
  optionActive: { borderColor: D.primary, backgroundColor: '#EEF4FA' },
  optionHalf: { flexBasis: '47%', flexGrow: 1 },
  optionLabel: { fontSize: 14, fontWeight: '800', color: D.text },
  optionDesc: { fontSize: 11, color: D.textMuted, marginTop: 2 },
  disabled: { opacity: 0.4 },
  card: { backgroundColor: D.card, borderRadius: 16, padding: 14 },
  hint: { fontSize: 11, color: D.textMuted, lineHeight: 16, marginBottom: 6 },
  groupHeader: { fontSize: 10, fontWeight: '800', color: D.textMuted, textTransform: 'uppercase', marginTop: 10, marginBottom: 6 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  fieldRowBorder: { borderBottomWidth: 1, borderBottomColor: D.border },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: D.text },
  error: { fontSize: 13, color: D.danger, marginTop: 12 },
  successBox: { backgroundColor: '#E7F5EC', borderRadius: 12, padding: 14, marginBottom: 12 },
  successTitle: { fontSize: 14, fontWeight: '800', color: D.success },
  successEmail: { fontSize: 13, color: D.textMuted, marginTop: 2 },
  stepsTitle: { fontSize: 13, fontWeight: '800', color: D.text, marginTop: 10, marginBottom: 4 },
  bodyText: { fontSize: 13, color: D.textMuted, lineHeight: 20 },
  warning: { fontSize: 12, color: D.warningText, marginBottom: 6 },
  muted: { fontSize: 12, color: D.textMuted, marginTop: 8, opacity: 0.8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: D.card, borderTopWidth: 1, borderTopColor: D.border },
  footerHint: { flex: 1, fontSize: 11, color: D.textMuted },
  primary: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 99, backgroundColor: D.text },
  primaryDisabled: { opacity: 0.4 },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondary: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 99, borderWidth: 1, borderColor: D.border, backgroundColor: D.card },
  secondaryText: { color: D.textMuted, fontSize: 14, fontWeight: '700' },
});
