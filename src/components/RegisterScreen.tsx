import { useState } from 'react';
import { formatDateLong, formatTime, toDateKey } from '../lib/dates';
import { saveEntry } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import BristolPicker from './BristolPicker';

interface RegisterScreenProps {
  onClose: () => void;
  onSuccess: (date: string, time: string) => void;
}

export default function RegisterScreen({ onClose, onSuccess }: RegisterScreenProps) {
  const { emoji, theme } = usePreferences();
  const now = new Date();
  const [hours, setHours] = useState(now.getHours());
  const [minutes, setMinutes] = useState(now.getMinutes());
  const [notes, setNotes] = useState('');
  const [bristol, setBristol] = useState<number | null>(null);
  const [editingTime, setEditingTime] = useState(false);

  const dateKey = toDateKey(now);
  const dayText = formatDateLong(now);
  const timeText = formatTime(hours, minutes);

  const handleSave = () => {
    saveEntry({
      date: dateKey,
      time: timeText,
      notes,
      timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).getTime(),
      bristol,
    });
    window.dispatchEvent(new Event('cacalendario-updated'));
    onSuccess(dateKey, timeText);
  };

  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  return (
    <div className="fixed inset-0 z-50 flex justify-center" style={{ backgroundColor: theme.main }}>
    <div className="w-full max-w-md flex flex-col h-screen relative">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill={theme.text}/>
          <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Logo */}
      <div className="flex justify-center pt-12 pb-4 shrink-0">
        <img src={asset('/logo.svg')} alt="Cacalendario" className="w-16 h-[57px]" />
      </div>

      <div className="flex-1 px-8 flex flex-col min-h-0 overflow-auto">
        {/* Day */}
        <p className="text-sm font-black shrink-0" style={{ color: theme.text }}>DÍA</p>
        <p className="text-2xl mt-1 shrink-0" style={{ color: theme.text }}>{dayText}</p>

        {/* Time */}
        <p className="text-sm font-black mt-3 shrink-0" style={{ color: theme.text }}>HORA</p>
        <div className="flex items-center gap-4 mt-1 shrink-0">
          {editingTime ? (
            <input
              type="time"
              value={timeText}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                setHours(h);
                setMinutes(m);
              }}
              onBlur={() => setEditingTime(false)}
              autoFocus
              className="text-2xl bg-transparent border-b-2 outline-none w-28"
              style={{ color: theme.text, borderColor: theme.text }}
            />
          ) : (
            <p className="text-2xl" style={{ color: theme.text }}>{timeText}</p>
          )}
          <button
            onClick={() => setEditingTime(true)}
            className="rounded-full px-5 py-1.5 text-base"
            style={{ backgroundColor: theme.text, color: invertColor }}
          >
            cambiar
          </button>
        </div>

        {/* Bristol Scale */}
        <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>
          ESCALA DE BRISTOL
        </p>
        <div className="mt-2 shrink-0">
          <BristolPicker value={bristol} onChange={setBristol} theme={theme} />
        </div>

        {/* Notes */}
        <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>NOTAS</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe tus notas aquí..."
          className="w-full mt-2 flex-1 min-h-[60px] rounded-lg p-3 text-base resize-none outline-none placeholder-white/50"
          style={{ backgroundColor: theme.glass, color: theme.text }}
        />
      </div>

      {/* Register button */}
      <div className="shrink-0 flex justify-center px-8 py-4">
        <button
          onClick={handleSave}
          className="w-full max-w-sm rounded-full py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          style={{ backgroundColor: theme.text }}
        >
          <span className="text-lg" style={{ color: invertColor }}>registrar</span>
          {emoji.char === 'svg' ? (
            <img src={asset('/poop-button.svg')} alt="" className="w-8 h-8" />
          ) : (
            <span className="text-2xl">{emoji.char}</span>
          )}
        </button>
      </div>
    </div>
    </div>
  );
}
