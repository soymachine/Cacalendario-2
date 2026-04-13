import { useState, useEffect } from 'react';
import Calendar from './Calendar';
import DaysSinceCounter from './DaysSinceCounter';
import InlineStats from './InlineStats';
import RegisterScreen from './RegisterScreen';
import EditScreen from './EditScreen';
import DayDetailScreen from './DayDetailScreen';
import CongratsScreen from './CongratsScreen';
import AccountScreen from './AccountScreen';
import AuthScreen from './AuthScreen';
import PrivacyScreen from './PrivacyScreen';
import SplashScreen from './SplashScreen';
import BottomNav, { type Tab } from './BottomNav';
import { AuthProvider, useAuth } from '../lib/auth';
import { syncOnLogin } from '../lib/sync';
import { usePreferences } from '../lib/usePreferences';
import { fetchDoctorConfig, getPaletteTheme } from '../lib/palettes';
import { setDoctorColor, clearDoctorColor, setDoctorHiddenFields, clearDoctorHiddenFields, setDoctorImage, clearDoctorImage, setDoctorEntryTypeMode, clearDoctorEntryTypeMode } from '../lib/preferences';
import { registerPushSubscription } from '../lib/push';
import { type PoopEntry, getEntryById } from '../lib/storage';
import { D } from '../lib/design';
import { initSentry, ErrorBoundary, sendTestError } from '../lib/sentry';

// Initialize Sentry once at module load (no-op in dev)
initSentry();

type Overlay = 'none' | 'edit' | 'dayDetail' | 'congrats' | 'auth' | 'privacy' | 'registerDate';

function AppContent() {
  const { user, isRecovery } = useAuth();
  const { emoji } = usePreferences();
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

  // Sync and apply doctor palette on login/logout
  useEffect(() => {
    if (user) {
      setSyncing(true);
      syncOnLogin(user.id)
        .then(() => window.dispatchEvent(new Event('fluxia-updated')))
        .finally(() => setSyncing(false));
      fetchDoctorConfig(user.id).then(config => {
        if (config.palette) setDoctorColor(getPaletteTheme(config.palette).primary);
        else clearDoctorColor();
        setDoctorHiddenFields(config.hiddenFields);
        if (config.centerImageUrl) setDoctorImage(config.centerImageUrl);
        else clearDoctorImage();
        setDoctorEntryTypeMode(config.entryTypeMode);
      });
      registerPushSubscription(user.id);
    } else {
      clearDoctorColor();
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
    if (detailDate) {
      setOverlay('dayDetail');
    } else if (registerDate) {
      setRegisterDate(null);
      setOverlay('none');
    } else {
      setOverlay('none');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: D.bg, overflow: 'hidden' }}>
      {/* ── MAIN CONTENT (tabs) ── */}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Historial tab */}
        <div style={{ height: '100%', overflowY: 'auto', display: activeTab === 'calendar' ? 'block' : 'none' }}>
          <div style={{ padding: '16px 16px 32px', maxWidth: 480, margin: '0 auto' }}>
            {/* Header */}
            {syncing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: D.textMuted }}>Sincronizando…</span>
              </div>
            )}
            {/* Calendar */}
            <div style={{ backgroundColor: D.card, borderRadius: 16, overflow: 'hidden' }}>
              <Calendar onDayClick={handleDayClick} />
            </div>
            {/* Days since counter */}
            <DaysSinceCounter />
            {/* Inline stats */}
            <InlineStats />
          </div>
        </div>

        {/* Register tab */}
        <div style={{ height: '100%', display: activeTab === 'register' ? 'block' : 'none' }}>
          <RegisterScreen
            isTab
            onSuccess={handleRegisterSuccess}
          />
        </div>

        {/* Account tab */}
        <div style={{ height: '100%', overflowY: 'auto', display: activeTab === 'account' ? 'block' : 'none' }}>
          <AccountScreen
            onShowAuth={() => setOverlay('auth')}
            onShowPrivacy={() => setOverlay('privacy')}
          />
        </div>
      </main>

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

      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {/* ── SENTRY TEST BUTTON (TEMP) ── */}
      <button
        onClick={() => sendTestError()}
        style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 9999, padding: '8px 14px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: 0.85 }}
      >
        Test Sentry
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallback={<AppCrash />}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppCrash() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: 32, textAlign: 'center', backgroundColor: '#F0F2F4' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#353435', margin: '0 0 8px' }}>Algo ha ido mal</p>
      <p style={{ fontSize: 14, color: '#9A9A9A', margin: '0 0 24px' }}>El error ha sido reportado automáticamente.</p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '12px 28px', borderRadius: 99, backgroundColor: '#353435', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
      >
        Recargar la app
      </button>
    </div>
  );
}
