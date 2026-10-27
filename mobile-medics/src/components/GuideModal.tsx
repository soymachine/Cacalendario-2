// Guía de uso: los mismos pasos que el onboarding de MW (ONBOARDING_STEPS en
// src/components/MedicsPanel.tsx). Si cambian allí, replicarlos aquí a mano.
// Solo cambia lo que en la app está en otro sitio: la lista está en
// «Pacientes» y la configuración en «Ajustes» (en la web, en el menú de cuenta).
import { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { D, FORM_MAX_WIDTH, centered } from '../lib/design';
import { MODAL_ORIENTATIONS } from '../lib/layout';

const STEPS = [
  {
    color: '#EEF4FB', // --fx-blue-50
    accent: D.primary,
    title: '¡Bienvenido a Fluxia!',
    body: 'Este es tu portal médico. Desde aquí gestionarás a tus pacientes y harás un seguimiento en tiempo real de su salud digestiva.',
  },
  {
    color: '#EDF7F1', // --fx-green-50
    accent: D.secondary,
    title: 'Tus pacientes',
    body: 'En «Pacientes» verás la lista de tus pacientes. El semáforo de cada uno indica cuántos días llevan sin registrar: verde al día, naranja varios días, rojo inactivo.',
  },
  {
    color: D.accentSoft,
    accent: D.accent,
    title: 'Invita a un paciente',
    body: 'Pulsa «Invitar paciente», introduce su email y elige qué quieres que registre. Cuando descargue la app Fluxia y acepte tu invitación, quedará vinculado a tu cuenta.',
  },
  {
    color: '#EEF4FB',
    accent: D.primary,
    title: 'Revisa los registros',
    body: 'Pulsa sobre cualquier paciente para ver sus registros detallados: tipo, consistencia, color, síntomas y más. Todo ordenado cronológicamente para facilitar el seguimiento.',
  },
  {
    color: '#EDF7F1',
    accent: D.secondary,
    title: 'Personaliza tu portal',
    body: 'Desde «Ajustes» actualiza tu nombre, el nombre de tu consulta, la imagen de tu centro y los umbrales del semáforo. ¡Hazlo tuyo!',
  },
];

export default function GuideModal({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} supportedOrientations={MODAL_ORIENTATIONS}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar guía" />
        <View style={[styles.card, centered(FORM_MAX_WIDTH + 80)]}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((index + 1) / STEPS.length) * 100}%`, backgroundColor: step.accent }]} />
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="Cerrar guía">
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <ScrollView style={{ backgroundColor: step.color }} contentContainerStyle={styles.content}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.body}>{step.body}</Text>
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {STEPS.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setIndex(i)}
                  hitSlop={6}
                  accessibilityLabel={`Paso ${i + 1}`}
                  style={[styles.dot, { width: i === index ? 22 : 8, backgroundColor: i === index ? step.accent : D.chipDark }]}
                />
              ))}
            </View>
            <View style={styles.buttons}>
              {index > 0 && (
                <Pressable onPress={() => setIndex(index - 1)} style={[styles.button, styles.buttonOutline]}>
                  <Text style={styles.buttonOutlineText}>← Anterior</Text>
                </Pressable>
              )}
              <Pressable
                onPress={isLast ? onClose : () => setIndex(index + 1)}
                style={[styles.button, { backgroundColor: step.accent }]}
              >
                <Text style={styles.buttonText}>{isLast ? '¡Empezar!' : 'Siguiente →'}</Text>
              </Pressable>
            </View>
            <Text style={styles.counter}>{index + 1} de {STEPS.length}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  card: { maxHeight: '90%', backgroundColor: D.card, borderRadius: 24, overflow: 'hidden' },
  progressTrack: { height: 4, backgroundColor: D.chip },
  progressFill: { height: '100%' },
  close: { position: 'absolute', top: 14, right: 18, zIndex: 1 },
  closeText: { fontSize: 24, lineHeight: 26, color: '#95A0A5' },
  content: { paddingHorizontal: 28, paddingTop: 36, paddingBottom: 28 },
  title: { fontSize: 23, fontWeight: '900', color: D.text, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 23, color: D.textMuted, textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 22, alignItems: 'center', gap: 16 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  buttons: { flexDirection: 'row', gap: 12, width: '100%' },
  button: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  buttonOutline: { borderWidth: 1.5, borderColor: D.border, backgroundColor: D.card },
  buttonOutlineText: { color: D.textMuted, fontSize: 15, fontWeight: '700' },
  counter: { fontSize: 12, color: '#95A0A5' },
});
