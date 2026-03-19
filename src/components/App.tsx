import { useState, useEffect } from 'react';
import Calendar from './Calendar';
import DaysSinceCounter from './DaysSinceCounter';
import RegisterScreen from './RegisterScreen';
import EditScreen from './EditScreen';
import DayDetailScreen from './DayDetailScreen';
import CongratsScreen from './CongratsScreen';
import StatsScreen from './StatsScreen';
import SettingsScreen from './SettingsScreen';
import AuthScreen from './AuthScreen';
import ProfileScreen from './ProfileScreen';
import ProfileButton from './ProfileButton';
import SplashScreen from './SplashScreen';
import PrivacyScreen from './PrivacyScreen';
import FeedbackScreen from './FeedbackScreen';
import { AuthProvider, useAuth } from '../lib/auth';
import { syncOnLogin } from '../lib/sync';
import { usePreferences } from '../lib/usePreferences';
import type { PoopEntry } from '../lib/storage';
import { asset } from '../lib/config';

type Screen = 'home' | 'register' | 'edit' | 'dayDetail' | 'congrats' | 'stats' | 'settings' | 'auth' | 'profile' | 'privacy' | 'feedback';

function AppContent() {
  const { user } = useAuth();
  const { emoji, theme } = usePreferences();
  const [screen, setScreen] = useState<Screen>('home');
  const [editEntry, setEditEntry] = useState<PoopEntry | null>(null);
  const [registerDate, setRegisterDate] = useState<string | null>(null);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [congratsData, setCongratsData] = useState<{ date: string; time: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [prevScreen, setPrevScreen] = useState<Screen>('home');

  // Sync when user logs in
  useEffect(() => {
    if (user) {
      setSyncing(true);
      syncOnLogin(user.id)
        .then(() => {
          window.dispatchEvent(new Event('cacalendario-updated'));
        })
        .finally(() => setSyncing(false));
    }
  }, [user]);

  const handleDayClick = (date: string, entries: PoopEntry[]) => {
    if (entries.length === 0) {
      // Empty day → register for that date
      setRegisterDate(date);
      setScreen('register');
    } else {
      // One or more entries → show day detail (edit + add more)
      setDetailDate(date);
      setScreen('dayDetail');
    }
  };

  const handleRegisterSuccess = (date: string, time: string) => {
    setCongratsData({ date, time });
    setRegisterDate(null);
    setScreen('congrats');
  };

  const handleAuthSuccess = () => {
    setScreen('home');
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme.main }}>
      {/* Home screen */}
      <div className="flex flex-col min-h-screen">
        {/* Top bar: settings + profile */}
        <div className="flex items-center justify-between px-4 pt-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScreen('settings')}
              className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform"
              style={{ backgroundColor: theme.glass }}
            >
              <span className="text-lg">⚙️</span>
            </button>
            <button
              onClick={() => setScreen('feedback')}
              className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform"
              style={{ backgroundColor: theme.glass }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H8l-4 4V6c0-1.1.9-2 2-2z" stroke={theme.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M12 11v.01M8 11v.01M16 11v.01" stroke={theme.text} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <ProfileButton
            onLoginClick={() => setScreen('auth')}
            onProfileClick={() => setScreen('profile')}
          />
        </div>

        {/* Logo */}
        <div className="flex justify-center pt-4 pb-4">
          <img src={asset('/logo.svg')} alt="Cacalendario" className="w-20 h-[71px]" />
        </div>

        {/* Sync indicator */}
        {syncing && (
          <div className="flex justify-center">
            <span className="text-xs" style={{ color: `${theme.text}80` }}>Sincronizando...</span>
          </div>
        )}

        {/* Calendar */}
        <Calendar onDayClick={handleDayClick} />

        {/* Days since counter */}
        <DaysSinceCounter />

        {/* Stats button */}
        <div className="px-10 mb-2">
          <button
            onClick={() => setScreen('stats')}
            className="w-full rounded-full py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ backgroundColor: theme.glass }}
          >
            <span className="text-base font-bold" style={{ color: theme.text }}>📊 ver estadísticas</span>
          </button>
        </div>

        {/* Register button */}
        <div className="px-10 pb-10 mt-auto">
          <button
            onClick={() => { setRegisterDate(null); setScreen('register'); }}
            className="w-full rounded-full py-3 flex items-center justify-center gap-3 active:scale-95 transition-transform"
            style={{ backgroundColor: theme.text }}
          >
            <span className="text-xl" style={{ color: theme.id === 'night' ? '#1a1a2e' : 'white' }}>registrar</span>
            {emoji.char === 'svg' ? (
              <img src={asset('/poop-button.svg')} alt="" className="w-10 h-10" />
            ) : (
              <span className="text-3xl">{emoji.char}</span>
            )}
          </button>
        </div>
      </div>

      {/* Overlays */}
      {screen === 'register' && (
        <RegisterScreen
          date={registerDate}
          onClose={() => { setRegisterDate(null); setScreen('home'); }}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {screen === 'edit' && editEntry && (
        <EditScreen
          entry={editEntry}
          onClose={() => {
            setEditEntry(null);
            // If we came from dayDetail, go back there
            if (detailDate) {
              setScreen('dayDetail');
            } else {
              setScreen('home');
            }
          }}
        />
      )}

      {screen === 'dayDetail' && detailDate && (
        <DayDetailScreen
          date={detailDate}
          onClose={() => { setDetailDate(null); setScreen('home'); }}
          onAddEntry={(date) => {
            setRegisterDate(date);
            setScreen('register');
          }}
          onEditEntry={(entry) => {
            setEditEntry(entry);
            setScreen('edit');
          }}
        />
      )}

      {screen === 'congrats' && congratsData && (
        <CongratsScreen
          date={congratsData.date}
          time={congratsData.time}
          onClose={() => {
            setCongratsData(null);
            // If registering from dayDetail, go back there
            if (detailDate) {
              setScreen('dayDetail');
            } else {
              setScreen('home');
            }
          }}
        />
      )}

      {screen === 'stats' && (
        <StatsScreen onClose={() => setScreen('home')} />
      )}

      {screen === 'settings' && (
        <SettingsScreen onClose={() => setScreen('home')} />
      )}

      {screen === 'auth' && (
        <AuthScreen
          onClose={() => setScreen('home')}
          onSuccess={handleAuthSuccess}
          onShowPrivacy={() => { setPrevScreen('auth'); setScreen('privacy'); }}
        />
      )}

      {screen === 'profile' && (
        <ProfileScreen
          onClose={() => setScreen('home')}
          onShowPrivacy={() => { setPrevScreen('profile'); setScreen('privacy'); }}
        />
      )}

      {screen === 'privacy' && (
        <PrivacyScreen onClose={() => setScreen(prevScreen)} />
      )}

      {screen === 'feedback' && (
        <FeedbackScreen onClose={() => setScreen('home')} />
      )}

      {/* Splash intro animation */}
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
