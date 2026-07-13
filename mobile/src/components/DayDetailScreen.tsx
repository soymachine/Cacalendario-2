import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import { formatDateForDisplay } from '../lib/dates';
import { getEntriesForDate, type PoopEntry } from '../lib/storage';
import { onEvent, FLUXIA_UPDATED } from '../lib/events';
import { getBristolType, getBristolHealthColor } from '../lib/bristol';
import { D } from '../lib/design';
import { CloseIcon, ChevronSmallIcon } from './icons';
import PoopSmallIcon from '../assets/poop-small.svg';
import PoopButtonIcon from '../assets/poop-button.svg';

interface DayDetailScreenProps {
  date: string;
  onClose: () => void;
  onAddEntry: (date: string) => void;
  onEditEntry: (entry: PoopEntry) => void;
}

export default function DayDetailScreen({ date, onClose, onAddEntry, onEditEntry }: DayDetailScreenProps) {
  const [entries, setEntries] = useState<PoopEntry[]>([]);

  useEffect(() => {
    const refresh = () => setEntries(getEntriesForDate(date));
    refresh();
    return onEvent(FLUXIA_UPDATED, refresh);
  }, [date]);

  const dayText = formatDateForDisplay(date);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrapper}>
        {/* Close button */}
        <Pressable onPress={onClose} style={styles.closeButton}>
          <CloseIcon size={24} />
        </Pressable>

        {/* Day header */}
        <View style={styles.header}>
          <Text style={styles.headerKicker}>DÍA</Text>
          <Text style={styles.headerTitle}>{dayText}</Text>
          <Text style={styles.headerCount}>
            {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
          </Text>
        </View>

        {/* Entries list */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {entries.map((entry) => {
            const bristolType = getBristolType(entry.bristol);
            return (
              <Pressable key={entry.id} onPress={() => onEditEntry(entry)} style={styles.entryCard}>
                <View style={styles.entryRow}>
                  {/* Icon */}
                  <View style={styles.entryIcon}>
                    {entry.entry_type === 'urine' ? (
                      <Text style={styles.entryEmoji}>💧</Text>
                    ) : (
                      <PoopSmallIcon width={28} height={28} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.entryInfo}>
                    <View style={styles.entryBadges}>
                      <Text style={styles.entryTime}>{entry.time}</Text>
                      {entry.entry_type === 'urine' ? (
                        <>
                          {entry.urine_type === 'voluntary' && (
                            <Text style={[styles.badge, { backgroundColor: D.accentSoft, color: D.accent }]}>Voluntaria</Text>
                          )}
                          {entry.urine_type === 'involuntary_escape' && (
                            <Text style={[styles.badge, { backgroundColor: D.warningSoft, color: D.warningText }]}>Escape</Text>
                          )}
                          {entry.urine_type === 'involuntary_drip' && (
                            <Text style={[styles.badge, { backgroundColor: D.warningSoft, color: D.warningText }]}>Goteo</Text>
                          )}
                          {entry.urine_quantity != null && entry.urine_quantity > 0 && (
                            <Text style={styles.entryMeta}>{entry.urine_quantity} ml</Text>
                          )}
                        </>
                      ) : (
                        <>
                          {bristolType && (
                            <Text style={[styles.badge, { backgroundColor: getBristolHealthColor(entry.bristol!), color: '#fff' }]}>
                              {bristolType.emoji} Tipo {entry.bristol}
                            </Text>
                          )}
                          {entry.floats === 'floats' && <Text style={styles.entryMeta}>🫧</Text>}
                        </>
                      )}
                    </View>

                    {!!entry.notes && (
                      <Text style={styles.entryNotes} numberOfLines={1}>
                        {entry.notes}
                      </Text>
                    )}
                  </View>

                  {/* Chevron */}
                  <View style={styles.chevron}>
                    <ChevronSmallIcon />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Add entry button */}
        <View style={styles.footer}>
          <Pressable onPress={() => onAddEntry(date)} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ añadir registro</Text>
            <PoopButtonIcon width={24} height={24} />
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: '900',
    color: D.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: D.secondary,
    marginBottom: 4,
  },
  headerCount: {
    fontSize: 13,
    color: D.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  entryCard: {
    width: '100%',
    backgroundColor: D.card,
    borderRadius: 14,
    padding: 14,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  entryIcon: {
    flexShrink: 0,
    marginTop: 2,
  },
  entryEmoji: {
    fontSize: 26,
  },
  entryInfo: {
    flex: 1,
    minWidth: 0,
  },
  entryBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  entryTime: {
    fontSize: 18,
    fontWeight: '900',
    color: D.primary,
  },
  badge: {
    fontSize: 10,
    fontWeight: '900',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 99,
    overflow: 'hidden',
  },
  entryMeta: {
    fontSize: 12,
    color: D.textMuted,
  },
  entryNotes: {
    fontSize: 12,
    color: D.textMuted,
    marginTop: 4,
  },
  chevron: {
    flexShrink: 0,
    marginTop: 6,
  },
  footer: {
    flexShrink: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  addButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: D.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: D.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
});
