import { useState, useEffect } from 'react';
import Calendar from './Calendar';
import DaysSinceCounter from './DaysSinceCounter';
import RegisterScreen from './RegisterScreen';
import EditScreen from './EditScreen';
import DayDetailScreen from './DayDetailScreen';
import CongratsScreen from './CongratsScreen';
import StatsScreen from './StatsScreen';
import AccountScreen from './AccountScreen';
import AuthScreen from './AuthScreen';
import PrivacyScreen from './PrivacyScreen';
import SplashScreen from './SplashScreen';
import BottomNav, { type Tab } from './BottomNav';
import { AuthProvider, useAuth } from '../lib/auth';
import { syncOnLogin } from '../lib/sync';
import { usePreferences } from '../lib/usePreferences';
import { fetchDoctorConfig, getPaletteTheme } from '../lib/palettes';
import { setDoctorColor, clearDoctorColor, setDoctorHiddenFields, clearDoctorHiddenFields } from '../lib/preferences';
import { registerPushSubscription } from '../lib/push';
import { getEntriesForDate, type PoopEntry } from '../lib/storage';
import { D } from '../lib/design';

type Overlay = 'none' | 'edit' | 'dayDetail' | 'congrats' | 'auth' | 'privacy' | 'stats' | 'registerDate';

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
      });
      registerPushSubscription(user.id);
    } else {
      clearDoctorColor();
      clearDoctorHiddenFields();
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
          <div style={{ padding: '24px 16px 16px', maxWidth: 480, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: D.text, margin: 0 }}>Historial</h1>
              {syncing && <span style={{ fontSize: 11, color: D.textMuted }}>Sincronizando…</span>}
            </div>
            {/* Days since counter */}
            <DaysSinceCounter />
            {/* Calendar */}
            <div style={{ backgroundColor: D.card, borderRadius: 16, overflow: 'hidden', marginTop: 12 }}>
              <Calendar onDayClick={handleDayClick} />
            </div>
            {/* Stats button */}
            <button
              onClick={() => setOverlay('stats')}
              style={{
                marginTop: 12, width: '100%', padding: '12px 0', borderRadius: 50,
                backgroundColor: D.card, border: `1px solid ${D.border}`,
                fontSize: 14, fontWeight: 700, color: D.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <span>📊</span> Ver estadísticas
            </button>
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

      {/* Register for a specific past date */}
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

      {overlay === 'stats' && (
        <StatsScreen onClose={() => setOverlay('none')} />
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

      {/* Splash */}
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
