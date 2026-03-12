import { useState } from 'react';
import Calendar from './Calendar';
import DaysSinceCounter from './DaysSinceCounter';
import RegisterScreen from './RegisterScreen';
import EditScreen from './EditScreen';
import CongratsScreen from './CongratsScreen';
import type { PoopEntry } from '../lib/storage';

type Screen = 'home' | 'register' | 'edit' | 'congrats';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [editEntry, setEditEntry] = useState<PoopEntry | null>(null);
  const [congratsData, setCongratsData] = useState<{ date: string; time: string } | null>(null);

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

  return (
    <div className="min-h-screen bg-salmon relative">
      {/* Home screen */}
      <div className="flex flex-col min-h-screen">
        {/* Logo */}
        <div className="flex justify-center pt-12 pb-4">
          <img src="/logo.svg" alt="Cacalendario" className="w-20 h-[71px]" />
        </div>

        {/* Calendar */}
        <Calendar onDayClick={handleDayClick} />

        {/* Days since counter */}
        <DaysSinceCounter />

        {/* Register button */}
        <div className="px-10 pb-10 mt-auto">
          <button
            onClick={() => setScreen('register')}
            className="w-full bg-black rounded-full py-5 flex items-center justify-center gap-4 active:scale-95 transition-transform"
          >
            <span className="text-white text-3xl">registrar</span>
            <img src="/poop-button.svg" alt="" className="w-16 h-16" />
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
    </div>
  );
}
