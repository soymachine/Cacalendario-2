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
import { setDoctorColor, clearDoctorColor, setDoctorHiddenFields, clearDoctorHiddenFields, setDoctorImage, clearDoctorImage } from '../lib/preferences';
import { registerPushSubscription } from '../lib/push';
import { type PoopEntry } from '../lib/storage';
import { D } from '../lib/design';

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
    date: string; time: string; entryType: 'poop' | 'urine';
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
      });
      registerPushSubscription(user.id);
    } else {
      clearDoctorColor();
      clearDoctorHiddenFields();
      clearDoctorImage();
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

  const handleRegisterSuccess = (date: string, time: string, entryType: 'poop' | 'urine') => {
    setCongratsData({ date, time, entryType });
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: D.text, margin: 0 }}>Estadísticas</h1>
              {syncing && <span style={{ fontSize: 11, color: D.textMuted }}>Sincronizando…</span>}
            </div>
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
