import { Component, useEffect, useState, type ReactNode } from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Calendar from './src/components/Calendar';
import DaysSinceCounter from './src/components/DaysSinceCounter';
import InlineStats from './src/components/InlineStats';
import RegisterScreen from './src/components/RegisterScreen';
import EditScreen from './src/components/EditScreen';
import DayDetailScreen from './src/components/DayDetailScreen';
import CongratsScreen from './src/components/CongratsScreen';
import AccountScreen from './src/components/AccountScreen';
import InviteModal from './src/components/InviteModal';
import AuthScreen from './src/components/AuthScreen';
import PrivacyScreen from './src/components/PrivacyScreen';
import SplashScreen from './src/components/SplashScreen';
import BottomNav, { type Tab } from './src/components/BottomNav';
import { AuthProvider, useAuth } from './src/lib/auth';
import { syncOnLogin } from './src/lib/sync';
import { fetchDoctorConfig } from './src/lib/palettes';
import {
  setDoctorHiddenFields, clearDoctorHiddenFields, setDoctorImage, clearDoctorImage,
  setDoctorEntryTypeMode, clearDoctorEntryTypeMode,
} from './src/lib/preferences';
import { registerPushSubscription } from './src/lib/push';
import { hydrateLocalStore } from './src/lib/localStore';
import { emitEvent, FLUXIA_UPDATED } from './src/lib/events';
import { type PoopEntry, getEntryById } from './src/lib/storage';
import { D } from './src/lib/design';

type Overlay = 'none' | 'edit' | 'dayDetail' | 'congrats' | 'auth' | 'privacy' | 'registerDate';

function AppContent() {
  const { user, loading: authLoading, isRecovery } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('register');
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [editEntry, setEditEntry] = useState<PoopEntry | null>(null);
  const [registerDate, setRegisterDate] = useState<string | null>(null);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [congratsData, setCongratsData] = useState<{
    date: string; time: string; entryType: 'poop' | 'urine'; entryId: string;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Show auth overlay when recovery link is clicked
  useEffect(() => {
    if (isRecovery) setOverlay('auth');
  }, [isRecovery]);

  // Sync and apply doctor config (hidden fields, center image, entry type) on login/logout
  useEffect(() => {
    if (user) {
      setSyncing(true);
      syncOnLogin(user.id)
        .then(() => emitEvent(FLUXIA_UPDATED))
        .finally(() => setSyncing(false));
      fetchDoctorConfig(user.id).then(config => {
        setDoctorHiddenFields(config.hiddenFields);
        if (config.centerImageUrl) setDoctorImage(config.centerImageUrl);
        else clearDoctorImage();
        setDoctorEntryTypeMode(config.entryTypeMode);
      });
      registerPushSubscription(user.id);
    } else {
      clearDoctorHiddenFields();
      clearDoctorImage();
      clearDoctorEntryTypeMode();
    }
  }, [user]);

  const handleDayClick = (date: string, entries: PoopEntry[]) => {
    if (entries.length === 0) {
      setRegisterDate(date);
      setOverlay('registerDate');
    } else {
      setDetailDate(date);
      setOverlay('dayDetail');
    }
  };

  const handleRegisterSuccess = (date: string, time: string, entryType: 'poop' | 'urine', entryId: string) => {
    setCongratsData({ date, time, entryType, entryId });
    setOverlay('congrats');
  };

  const handleCongratsClose = () => {
    setCongratsData(null);
    setRegisterDate(null);
    setOverlay('none');
    setActiveTab('calendar');
  };

  // ── Phase 1: splash or auth not yet resolved → blank screen (splash covers it) ──
  if (showSplash || authLoading) {
    return (
      <View style={styles.fill}>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      </View>
    );
  }

  // ── Phase 2: auth resolved, no user → login gate ──
  if (!user) {
    return (
      <View style={styles.loginGate}>
        <Image source={require('./src/assets/fluxia-logo.png')} style={styles.loginLogo} resizeMode="contain" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Inicia sesión para empezar a usar la app</Text>
          <Text style={styles.loginSubtitle}>
            Guarda tus registros en la nube y accede desde cualquier dispositivo.
          </Text>
          <Pressable onPress={() => setOverlay('auth')} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Iniciar sesión / Registrarse</Text>
          </Pressable>
        </View>
        {overlay === 'auth' && (
          <AuthScreen onClose={() => setOverlay('none')} onSuccess={() => setOverlay('none')} onShowPrivacy={() => setOverlay('privacy')} />
        )}
        {overlay === 'privacy' && <PrivacyScreen onClose={() => setOverlay('none')} />}
      </View>
    );
  }

  // ── Phase 3: auth resolved, user logged in → full app ──
  return (
    <View style={styles.fill}>
      {/* ── PENDING INVITE (shown first, on top of everything) ── */}
      <InviteModal userId={user.id} />

      {/* ── MAIN CONTENT (tabs) ── */}
      <View style={styles.main}>
        {/* Historial tab */}
        <View style={[styles.tab, activeTab !== 'calendar' && styles.hidden]}>
          <ScrollView contentContainerStyle={styles.calendarContent}>
            {syncing && (
              <View style={styles.syncingRow}>
                <Text style={styles.syncingText}>Sincronizando…</Text>
              </View>
            )}
            <View style={styles.calendarCard}>
              <Calendar onDayClick={handleDayClick} />
            </View>
            <DaysSinceCounter />
            <InlineStats />
          </ScrollView>
        </View>

        {/* Register tab */}
        <View style={[styles.tab, activeTab !== 'register' && styles.hidden]}>
          <RegisterScreen isTab onSuccess={handleRegisterSuccess} />
        </View>

        {/* Account tab */}
        <View style={[styles.tab, activeTab !== 'account' && styles.hidden]}>
          <AccountScreen
            onShowAuth={() => setOverlay('auth')}
            onShowPrivacy={() => setOverlay('privacy')}
          />
        </View>
      </View>

      {/* ── BOTTOM NAV ── */}
      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* ── OVERLAYS ── */}

      {overlay === 'registerDate' && (
        <RegisterScreen
          date={registerDate}
          onClose={() => { setRegisterDate(null); setOverlay('none'); }}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {overlay === 'edit' && editEntry && (
        <EditScreen
          entry={editEntry}
          onClose={() => {
            setEditEntry(null);
            setOverlay(detailDate ? 'dayDetail' : 'none');
          }}
        />
      )}

      {overlay === 'dayDetail' && detailDate && (
        <DayDetailScreen
          date={detailDate}
          onClose={() => { setDetailDate(null); setOverlay('none'); }}
          onAddEntry={(date) => { setRegisterDate(date); setOverlay('registerDate'); }}
          onEditEntry={(entry) => { setEditEntry(entry); setOverlay('edit'); }}
        />
      )}

      {overlay === 'congrats' && congratsData && (
        <CongratsScreen
          date={congratsData.date}
          time={congratsData.time}
          entryType={congratsData.entryType}
          onEdit={() => {
            const entry = getEntryById(congratsData.entryId);
            if (entry) { setEditEntry(entry); setOverlay('edit'); }
          }}
          onClose={handleCongratsClose}
        />
      )}

      {overlay === 'auth' && (
        <AuthScreen
          onClose={() => setOverlay('none')}
          onSuccess={() => setOverlay('none')}
          onShowPrivacy={() => setOverlay('privacy')}
        />
      )}

      {overlay === 'privacy' && (
        <PrivacyScreen onClose={() => setOverlay('none')} />
      )}
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
        <View style={styles.crash}>
          <Text style={styles.crashEmoji}>⚠️</Text>
          <Text style={styles.crashTitle}>Algo ha ido mal</Text>
          <Text style={styles.crashSubtitle}>Cierra y vuelve a abrir la app si el problema persiste.</Text>
          <Pressable onPress={() => this.setState({ hasError: false })} style={styles.crashButton}>
            <Text style={styles.crashButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [storeReady, setStoreReady] = useState(false);

  // Hydrate the synchronous local store before rendering the app
  // (the splash screen covers this brief moment).
  useEffect(() => {
    hydrateLocalStore().finally(() => setStoreReady(true));
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
          <StatusBar style="dark" />
          {storeReady ? (
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          ) : (
            <View style={styles.fill} />
          )}
        </SafeAreaView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: D.bg,
  },
  main: {
    flex: 1,
  },
  tab: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    display: 'none',
  },
  calendarContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  syncingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  syncingText: {
    fontSize: 11,
    color: D.textMuted,
  },
  calendarCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.bg,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  loginLogo: {
    height: 72,
    width: 200,
    marginBottom: 48,
  },
  loginCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: D.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 13,
    color: D.textMuted,
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 99,
    backgroundColor: D.primary,
    alignItems: 'center',
  },
  loginButtonText: {
    color: D.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  crash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: D.bg,
  },
  crashEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  crashTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: D.text,
    marginBottom: 8,
  },
  crashSubtitle: {
    fontSize: 14,
    color: D.textMuted,
    marginBottom: 24,
    textAlign: 'center',
  },
  crashButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 99,
    backgroundColor: D.primary,
  },
  crashButtonText: {
    color: D.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
});
