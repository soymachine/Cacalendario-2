import { View, Text, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { PoopEntry } from '../lib/storage';
import { D } from '../lib/design';
import { CloseIcon } from './icons';
import FoodEntryForm from './FoodEntryForm';

interface FoodEditScreenProps {
  entry: PoopEntry;
  onClose: () => void;
}

/** Edición de una comida (mismo formulario que el alta). */
export default function FoodEditScreen({ entry, onClose }: FoodEditScreenProps) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
        <View style={styles.closeRow}>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8} accessibilityLabel="Cerrar">
            <CloseIcon size={24} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Editar comida</Text>
          <FoodEntryForm entry={entry} onSaved={onClose} onDeleted={onClose} />
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8, paddingRight: 16 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: D.secondary, marginBottom: 14 },
});
