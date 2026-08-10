// Pantalla de bloqueo cuando caduca el trial de 31 días.
//
// IMPORTANTE — reglas de App Store: esta pantalla NO puede incluir botones,
// enlaces ni llamadas a la acción que lleven a pagar fuera de la app (App
// Review Guideline 3.1.1). Por eso no hay precio, ni botón de pago, ni enlace
// a fluxia-health.com: solo se informa de que la cuenta se gestiona desde el
// navegador. El cobro vive únicamente en MW.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { D, FORM_MAX_WIDTH, centered } from '../lib/design';
import { useAuth } from '../lib/auth';

export default function TrialExpiredScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.fill}>
      <View style={[styles.card, centered(FORM_MAX_WIDTH)]}>
        <Text style={styles.emoji}>🎁</Text>
        <Text style={styles.title}>Tu mes de prueba ha finalizado</Text>
        <Text style={styles.body}>
          Tus pacientes y todos tus registros siguen guardados: no se ha borrado nada.
        </Text>
        <Text style={styles.body}>
          Para seguir usando Fluxia Pro, entra en tu cuenta desde el navegador de tu
          ordenador y activa tu plan desde ahí. En cuanto lo hagas, esta app volverá a
          funcionar con normalidad.
        </Text>
        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: D.bg, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: D.card, borderRadius: 20, padding: 28, alignItems: 'center' },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 21, fontWeight: '800', color: D.text, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 14, color: D.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 12 },
  signOutButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 50,
    backgroundColor: D.dangerBg,
    alignItems: 'center',
  },
  signOutText: { color: D.danger, fontSize: 15, fontWeight: '700' },
});
