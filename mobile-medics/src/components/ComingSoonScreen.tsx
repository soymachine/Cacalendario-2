import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { D } from '../lib/design';

interface ComingSoonScreenProps {
  title: string;
  body: string;
  onBack?: () => void;
}

export default function ComingSoonScreen({ title, body, onBack }: ComingSoonScreenProps) {
  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.emoji}>🚧</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {onBack && (
          <Pressable onPress={onBack} style={styles.button}>
            <Text style={styles.buttonText}>Volver</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 40, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: D.text, marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 14, color: D.textMuted, textAlign: 'center', lineHeight: 20 },
  button: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 99, backgroundColor: D.primary },
  buttonText: { color: D.primaryText, fontSize: 15, fontWeight: '700' },
});
