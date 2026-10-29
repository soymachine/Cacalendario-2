import { useState } from 'react';
import { View, Pressable, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersIcon } from './icons';
import { D, CONTENT_MAX_WIDTH, centered } from '../lib/design';

export type Tab = 'pacientes' | 'config';

// Mismo degradado que la topbar de src/components/MedicsPanel.tsx (web).
// Invitar ya no es una pestaña: es un botón en la lista de pacientes (InvitePatientModal).
// La sección de pacientes no tiene icono: la abre el logo (como la píldora
// blanca de la topbar de MW, que lleva a la lista de pacientes).
const TABS: { id: Tab; label: string; Icon: typeof SlidersIcon }[] = [
  { id: 'config', label: 'Ajustes', Icon: SlidersIcon },
];

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  /** Imagen del centro subida por el profesional; si no hay (o no carga), el logo de Fluxia. */
  logoUrl: string | null;
}

export default function BottomNav({ active, onChange, logoUrl }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const customLogo = logoUrl && logoUrl !== failedUrl ? logoUrl : null;
  const patientsActive = active === 'pacientes';
  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={['#3E78B5', '#539D9F', '#78AD89', '#78AD89', '#D8DA56']}
        locations={[0, 0.3, 0.58, 0.88, 1]}
        start={{ x: 0.017, y: 0.371 }}
        end={{ x: 0.983, y: 0.629 }}
        style={[styles.nav, centered(CONTENT_MAX_WIDTH), { paddingBottom: Math.max(10, insets.bottom + 6) }]}
      >
        <Pressable
          onPress={() => onChange('pacientes')}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Pacientes"
          accessibilityState={{ selected: patientsActive }}
        >
          <View style={[styles.logoPill, patientsActive && styles.logoPillActive]}>
            <Image
              source={customLogo ? { uri: customLogo } : require('../assets/fluxia-logo.png')}
              onError={() => setFailedUrl(logoUrl)}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <View style={[styles.activeBar, patientsActive && styles.activeBarOn]} />
        </Pressable>
        {TABS.map(({ id, label, Icon }) => {
          const isActive = id === active;
          return (
            <Pressable key={id} onPress={() => onChange(id)} style={styles.button}>
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Icon size={18} weight={isActive ? 'fill' : 'regular'} color={isActive ? '#fff' : 'rgba(255,255,255,0.85)'} />
              </View>
              <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>{label}</Text>
            </Pressable>
          );
        })}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: D.bg,
  },
  nav: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    transform: [{ translateY: '20%' }],
  },
  // Píldora blanca con el logo, como en la topbar de MW. Mide lo mismo que
  // icono + etiqueta (28 + 4 + 13) para que la fila quede alineada.
  logoPill: {
    height: 38,
    width: 104,
    paddingHorizontal: 10,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  logoPillActive: {
    opacity: 1,
  },
  logo: {
    width: '100%',
    height: 26,
  },
  activeBar: {
    width: 18,
    height: 3,
    borderRadius: 1.5,
  },
  activeBarOn: {
    backgroundColor: '#fff',
  },
  // Radio exacto (mitad del alto: icono 18 + 2×5): con borderRadius 999,
  // Android puede pintar la píldora con esquinas rectas.
  iconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: '#fff',
    fontWeight: '800',
  },
  labelInactive: {
    color: 'rgba(255,255,255,0.85)',
  },
});
