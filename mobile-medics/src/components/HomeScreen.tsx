import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import type { DoctorInfo } from '../lib/doctor';
import { D } from '../lib/design';

interface HomeScreenProps {
  doctor: DoctorInfo;
}

export default function HomeScreen({ doctor }: HomeScreenProps) {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>HOLA,</Text>
        <Text style={styles.title}>{doctor.name}</Text>
        <Text style={styles.subtitle}>{doctor.center_name}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚧 Próximamente</Text>
          <Text style={styles.cardBody}>
            Lista de pacientes, detalle con calendario y bitácora, invitar
            pacientes y configuración — todo llega en las próximas versiones
            de esta app. Por ahora, usa la web para el resto de funciones.
          </Text>
        </View>

        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  container: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  kicker: { fontSize: 12, fontWeight: '900', color: D.textMuted, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '900', color: D.text, marginTop: 2 },
  subtitle: { fontSize: 14, color: D.textMuted, marginTop: 4, marginBottom: 24 },
  card: { backgroundColor: D.card, borderRadius: 16, padding: 20, marginBottom: 24 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: D.text, marginBottom: 8 },
  cardBody: { fontSize: 14, color: D.textMuted, lineHeight: 20 },
  signOutButton: { paddingVertical: 12, borderRadius: 50, backgroundColor: D.dangerBg, alignItems: 'center' },
  signOutText: { color: D.danger, fontSize: 15, fontWeight: '700' },
});
