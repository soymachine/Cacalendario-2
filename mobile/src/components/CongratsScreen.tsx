import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { formatDateForDisplay } from '../lib/dates';
import { D } from '../lib/design';
import { CloseIcon } from './icons';
import PoopSmallIcon from '../assets/poop-small.svg';

interface CongratsScreenProps {
  date: string;
  time: string;
  entryType: 'poop' | 'urine';
  onEdit: () => void;
  onClose: () => void;
}

export default function CongratsScreen({ date, time, entryType, onEdit, onClose }: CongratsScreenProps) {
  const dayText = formatDateForDisplay(date); // "LUNES, 13 de abril"
  const isPoop = entryType === 'poop';

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrapper}>
        {/* Close button */}
        <Pressable onPress={onClose} style={styles.closeButton}>
          <CloseIcon size={24} />
        </Pressable>

        {/* Title */}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Registro{'\n'}correcto</Text>
        </View>

        {/* Summary card */}
        <View style={styles.card}>
          {/* Date & Time row */}
          <View style={styles.dateTimeRow}>
            <View>
              <Text style={styles.kicker}>DÍA</Text>
              <Text style={styles.value}>{dayText}</Text>
            </View>
            <View>
              <Text style={styles.kicker}>HORA</Text>
              <Text style={styles.value}>{time}</Text>
            </View>
          </View>

          {/* Type badge row */}
          <View style={styles.typeRow}>
            {isPoop ? (
              <PoopSmallIcon width={28} height={28} />
            ) : (
              <Text style={styles.typeEmoji}>💧</Text>
            )}
            <Text style={styles.typeText}>
              {isPoop ? 'Deposición registrada' : 'Micción registrada'}
            </Text>
          </View>

          {/* Edit button */}
          <Pressable onPress={onEdit} style={styles.editButton}>
            <Text style={styles.editButtonText}>Editar registro</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: D.bg,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    paddingTop: 88,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 54,
    fontWeight: '900',
    color: D.text,
    lineHeight: 57,
  },
  card: {
    marginTop: 32,
    marginHorizontal: 16,
    backgroundColor: D.card,
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 16,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '900',
    color: D.textMuted,
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: D.text,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: D.chip,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  typeEmoji: {
    fontSize: 22,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '800',
    color: D.text,
  },
  editButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: D.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  editButtonText: {
    color: D.primary,
    fontSize: 15,
    fontWeight: '800',
  },
});
