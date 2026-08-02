import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getBristolHealthLabel, getBristolHealthColor } from '../lib/bristol';
import { D } from '../lib/design';
import Fluxia1 from '../assets/fluxia_1.svg';
import Fluxia2 from '../assets/fluxia_2.svg';
import Fluxia3 from '../assets/fluxia_3.svg';
import Fluxia4 from '../assets/fluxia_4.svg';
import Fluxia5 from '../assets/fluxia_5.svg';
import Fluxia6 from '../assets/fluxia_6.svg';
import Fluxia7 from '../assets/fluxia_7.svg';

const BRISTOL_ICONS = [Fluxia1, Fluxia2, Fluxia3, Fluxia4, Fluxia5, Fluxia6, Fluxia7];

interface BristolPickerProps {
  value: number | null;
  onChange: (type: number | null) => void;
  restrictedTypes?: number[];
}

export default function BristolPicker({ value, onChange, restrictedTypes }: BristolPickerProps) {
  return (
    <View>
      <View style={styles.grid}>
        {[1, 2, 3, 4, 5, 6, 7].map((type) => {
          const isSelected = value === type;
          const isLocked = restrictedTypes ? !restrictedTypes.includes(type) : false;
          const Icon = BRISTOL_ICONS[type - 1];
          return (
            <Pressable
              key={type}
              onPress={() => !isLocked && onChange(isSelected ? null : type)}
              style={[
                styles.cell,
                { borderColor: isSelected ? D.primary : 'transparent', opacity: isLocked ? 0.3 : 1 },
              ]}
            >
              <Icon width={68} height={68} />
            </Pressable>
          );
        })}
      </View>

      {value != null && (
        <View style={styles.selectedRow}>
          <View style={styles.selectedInfo}>
            {(() => {
              const Icon = BRISTOL_ICONS[value - 1];
              return <Icon width={40} height={40} />;
            })()}
            <Text style={styles.selectedLabel}>Tipo {value}</Text>
          </View>
          <Text style={[styles.healthBadge, { backgroundColor: getBristolHealthColor(value) }]}>
            {getBristolHealthLabel(value)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderWidth: 2,
    backgroundColor: D.navBg,
  },
  selectedRow: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: D.navBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: D.text,
  },
  healthBadge: {
    fontSize: 10,
    fontWeight: '900',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    color: '#fff',
    overflow: 'hidden',
  },
});
