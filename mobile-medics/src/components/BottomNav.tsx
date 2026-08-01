import { View, Pressable, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HouseIcon, UserIcon, UserPlusIcon, SlidersIcon } from './icons';

export type Tab = 'inicio' | 'pacientes' | 'invitar' | 'config';

// Mismos iconos y degradado que la topbar de src/components/MedicsPanel.tsx
// (web) — mantener sincronizado a mano.
const TABS: { id: Tab; label: string; Icon: typeof HouseIcon }[] = [
  { id: 'inicio', label: 'Inicio', Icon: HouseIcon },
  { id: 'pacientes', label: 'Pacientes', Icon: UserIcon },
  { id: 'invitar', label: 'Invitar', Icon: UserPlusIcon },
  { id: 'config', label: 'Ajustes', Icon: SlidersIcon },
];

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['#3E78B5', '#539D9F', '#78AD89', '#78AD89', '#D8DA56']}
      locations={[0, 0.3, 0.58, 0.88, 1]}
      start={{ x: 0.017, y: 0.371 }}
      end={{ x: 0.983, y: 0.629 }}
      style={[styles.nav, { paddingBottom: Math.max(10, insets.bottom + 6) }]}
    >
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
  );
}

const styles = StyleSheet.create({
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
  iconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
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
