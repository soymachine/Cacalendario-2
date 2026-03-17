import { useState } from 'react';
import { formatDateLong, formatDateForDisplay, formatTime, toDateKey } from '../lib/dates';
import { saveEntry, generateEntryId } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import BristolPicker from './BristolPicker';

interface RegisterScreenProps {
  date?: string | null; // Optional: YYYY-MM-DD for past date registration
  onClose: () => void;
  onSuccess: (date: string, time: string) => void;
}

export default function RegisterScreen({ date, onClose, onSuccess }: RegisterScreenProps) {
  const { emoji, theme } = usePreferences();
  const now = new Date();

  // If a specific date was passed, use it; otherwise use today
  const targetDate = date || toDateKey(now);
  const [y, mo, d] = targetDate.split('-').map(Number);
  const isToday = targetDate === toDateKey(now);

  const [hours, setHours] = useState(isToday ? now.getHours() : 12);
  const [minutes, setMinutes] = useState(isToday ? now.getMinutes() : 0);
  const [notes, setNotes] = useState('');
  const [bristol, setBristol] = useState<number | null>(null);
  const [floats, setFloats] = useState<boolean | null>(null);
  const [editingTime, setEditingTime] = useState(false);

  const dayText = isToday ? formatDateLong(now) : formatDateForDisplay(targetDate);
  const timeText = formatTime(hours, minutes);

  const handleSave = () => {
    saveEntry({
      id: generateEntryId(),
      date: targetDate,
      time: timeText,
      notes,
      timestamp: new Date(y, mo - 1, d, hours, minutes).getTime(),
      bristol,
      floats,
    });
    window.dispatchEvent(new Event('cacalendario-updated'));
    onSuccess(targetDate, timeText);
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
      <div className="flex justify-center pt-10 pb-2 shrink-0">
        <img src={asset('/logo.svg')} alt="Cacalendario" className="w-14 h-[50px]" />
      </div>

      <div className="flex-1 px-8 flex flex-col min-h-0 overflow-auto pb-2">
        {/* Day */}
        <p className="text-sm font-black shrink-0" style={{ color: theme.text }}>DÍA</p>
        <p className="text-xl mt-0.5 shrink-0" style={{ color: theme.text }}>
          {dayText}
          {!isToday && <span className="text-xs ml-2 opacity-60">(registro pasado)</span>}
        </p>

        {/* Time */}
        <p className="text-sm font-black mt-2.5 shrink-0" style={{ color: theme.text }}>HORA</p>
        <div className="flex items-center gap-3 mt-0.5 shrink-0">
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
              className="text-xl bg-transparent border-b-2 outline-none w-24"
              style={{ color: theme.text, borderColor: theme.text }}
            />
          ) : (
            <p className="text-xl" style={{ color: theme.text }}>{timeText}</p>
          )}
          <button
            onClick={() => setEditingTime(true)}
            className="rounded-full px-4 py-1 text-sm"
            style={{ backgroundColor: theme.text, color: invertColor }}
          >
            cambiar
          </button>
        </div>

        {/* Bristol Scale */}
        <p className="text-sm font-black mt-3 shrink-0" style={{ color: theme.text }}>
          ¿QUÉ FORMA TENÍA?
        </p>
        <p className="text-[10px] mt-0.5 shrink-0" style={{ color: `${theme.text}80` }}>
          Escala de Bristol — selecciona el tipo más parecido
        </p>
        <div className="mt-1.5 shrink-0">
          <BristolPicker value={bristol} onChange={setBristol} theme={theme} />
        </div>

        {/* Floats? */}
        <p className="text-sm font-black mt-3 shrink-0" style={{ color: theme.text }}>
          ¿FLOTA LA DEPOSICIÓN?
        </p>
        <div className="flex gap-2 mt-1 shrink-0">
          {[
            { label: '🫧 Sí, flota', value: true },
            { label: '⬇️ No, se hunde', value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setFloats(floats === opt.value ? null : opt.value)}
              className="flex-1 rounded-xl py-2 text-center transition-all active:scale-95"
              style={{
                backgroundColor: floats === opt.value ? theme.text : theme.glass,
                color: floats === opt.value ? invertColor : theme.text,
              }}
            >
              <span className="text-sm font-bold">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Notes */}
        <p className="text-sm font-black mt-3 shrink-0" style={{ color: theme.text }}>NOTAS</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe tus notas aquí..."
          className="w-full mt-1 flex-1 min-h-[50px] rounded-lg p-3 text-sm resize-none outline-none placeholder-white/50"
          style={{ backgroundColor: theme.glass, color: theme.text }}
        />
      </div>

      {/* Register button */}
      <div className="shrink-0 flex justify-center px-8 py-3">
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
