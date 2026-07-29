import { View, Pressable, Text, StyleSheet } from 'react-native';
import { D } from '../lib/design';

export type Tab = 'inicio' | 'pacientes' | 'invitar' | 'config';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'inicio', label: 'Inicio', emoji: '🏠' },
  { id: 'pacientes', label: 'Pacientes', emoji: '👥' },
  { id: 'invitar', label: 'Invitar', emoji: '➕' },
  { id: 'config', label: 'Ajustes', emoji: '⚙️' },
];

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <View style={styles.nav}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Pressable key={tab.id} onPress={() => onChange(tab.id)} style={styles.button}>
            <Text style={styles.emoji}>{tab.emoji}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    backgroundColor: D.navBg,
    borderTopWidth: 1,
    borderTopColor: D.border,
    paddingTop: 8,
    paddingBottom: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: D.textMuted,
  },
  labelActive: {
    color: D.primary,
    fontWeight: '800',
  },
});
