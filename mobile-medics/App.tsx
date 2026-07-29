import { Component, useEffect, useState, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthScreen from './src/components/AuthScreen';
import GoogleProfileScreen from './src/components/GoogleProfileScreen';
import DoctorApp from './src/components/DoctorApp';
import { AuthProvider, useAuth } from './src/lib/auth';
import { bootstrapDoctor, type DoctorInfo, type DoctorBootstrapResult } from './src/lib/doctor';
import { D } from './src/lib/design';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [bootstrap, setBootstrap] = useState<DoctorBootstrapResult | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  useEffect(() => {
    if (!user) { setBootstrap(null); return; }
    setBootstrapping(true);
    bootstrapDoctor(user)
      .then(setBootstrap)
      .finally(() => setBootstrapping(false));
  }, [user]);

  if (authLoading) {
    return <View style={styles.fill} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (bootstrapping || !bootstrap) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Buscando tu perfil médico…</Text>
      </View>
    );
  }

  if (bootstrap.status === 'ready') {
    return <DoctorApp doctor={bootstrap.doctor} />;
  }

  if (bootstrap.status === 'google_profile_needed') {
    return (
      <GoogleProfileScreen
        userId={user.id}
        suggestedName={bootstrap.suggestedName}
        onComplete={(doctor: DoctorInfo) => setBootstrap({ status: 'ready', doctor })}
      />
    );
  }

  // 'activating' or 'no_profile' — show the message with a retry action.
  return (
    <View style={styles.center}>
      <Text style={styles.messageEmoji}>{bootstrap.status === 'activating' ? '⏳' : '⚠️'}</Text>
      <Text style={styles.messageText}>{bootstrap.message}</Text>
      <Pressable
        onPress={() => {
          setBootstrapping(true);
          bootstrapDoctor(user).then(setBootstrap).finally(() => setBootstrapping(false));
        }}
        style={styles.retryButton}
      >
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[app] Uncaught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.center}>
          <Text style={styles.messageEmoji}>⚠️</Text>
          <Text style={styles.messageText}>Algo ha ido mal. Cierra y vuelve a abrir la app.</Text>
          <Pressable onPress={() => this.setState({ hasError: false })} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="dark" />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: D.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: D.bg },
  loadingText: { fontSize: 14, color: D.textMuted },
  messageEmoji: { fontSize: 40, marginBottom: 16 },
  messageText: { fontSize: 15, color: D.text, textAlign: 'center', lineHeight: 21 },
  retryButton: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 99, backgroundColor: D.primary },
  retryButtonText: { color: D.primaryText, fontSize: 15, fontWeight: '700' },
});
