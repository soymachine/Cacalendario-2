import { useState, useEffect } from 'react';
import Calendar from './Calendar';
import DaysSinceCounter from './DaysSinceCounter';
import RegisterScreen from './RegisterScreen';
import EditScreen from './EditScreen';
import CongratsScreen from './CongratsScreen';
import AuthScreen from './AuthScreen';
import ProfileScreen from './ProfileScreen';
import ProfileButton from './ProfileButton';
import { AuthProvider, useAuth } from '../lib/auth';
import { syncOnLogin } from '../lib/sync';
import type { PoopEntry } from '../lib/storage';
import { asset } from '../lib/config';

type Screen = 'home' | 'register' | 'edit' | 'congrats' | 'auth' | 'profile';

function AppContent() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>('home');
  const [editEntry, setEditEntry] = useState<PoopEntry | null>(null);
  const [congratsData, setCongratsData] = useState<{ date: string; time: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

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

  const handleDayClick = (date: string, entry?: PoopEntry) => {
    if (entry) {
      setEditEntry(entry);
      setScreen('edit');
    }
  };

  const handleRegisterSuccess = (date: string, time: string) => {
    setCongratsData({ date, time });
    setScreen('congrats');
  };

  const handleAuthSuccess = () => {
    setScreen('home');
  };

  return (
    <div className="min-h-screen bg-salmon relative">
      {/* Home screen */}
      <div className="flex flex-col min-h-screen">
        {/* Profile button */}
        <ProfileButton
          onLoginClick={() => setScreen('auth')}
          onProfileClick={() => setScreen('profile')}
        />

        {/* Logo */}
        <div className="flex justify-center pt-12 pb-4">
          <img src={asset('/logo.svg')} alt="Cacalendario" className="w-20 h-[71px]" />
        </div>

        {/* Sync indicator */}
        {syncing && (
          <div className="flex justify-center">
            <span className="text-xs text-black/50">Sincronizando...</span>
          </div>
        )}

        {/* Calendar */}
        <Calendar onDayClick={handleDayClick} />

        {/* Days since counter */}
        <DaysSinceCounter />

        {/* Register button */}
        <div className="px-10 pb-10 mt-auto">
          <button
            onClick={() => setScreen('register')}
            className="w-full bg-black rounded-full py-3 flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <span className="text-white text-xl">registrar</span>
            <img src={asset('/poop-button.svg')} alt="" className="w-10 h-10" />
          </button>
        </div>
      </div>

      {/* Overlays */}
      {screen === 'register' && (
        <RegisterScreen
          onClose={() => setScreen('home')}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {screen === 'edit' && editEntry && (
        <EditScreen
          entry={editEntry}
          onClose={() => { setEditEntry(null); setScreen('home'); }}
        />
      )}

      {screen === 'congrats' && congratsData && (
        <CongratsScreen
          date={congratsData.date}
          time={congratsData.time}
          onClose={() => { setCongratsData(null); setScreen('home'); }}
        />
      )}

      {screen === 'auth' && (
        <AuthScreen
          onClose={() => setScreen('home')}
          onSuccess={handleAuthSuccess}
        />
      )}

      {screen === 'profile' && (
        <ProfileScreen onClose={() => setScreen('home')} />
      )}
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
