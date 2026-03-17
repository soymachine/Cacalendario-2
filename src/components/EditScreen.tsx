import { useState } from 'react';
import { formatDateForDisplay, formatTime } from '../lib/dates';
import { saveEntry, deleteEntry, type PoopEntry } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import BristolPicker from './BristolPicker';

interface EditScreenProps {
  entry: PoopEntry;
  onClose: () => void;
}

export default function EditScreen({ entry, onClose }: EditScreenProps) {
  const { emoji, theme } = usePreferences();
  const [h, m] = entry.time.split(':').map(Number);
  const [hours, setHours] = useState(h);
  const [minutes, setMinutes] = useState(m);
  const [notes, setNotes] = useState(entry.notes);
  const [bristol, setBristol] = useState<number | null>(entry.bristol ?? null);
  const [floats, setFloats] = useState<boolean | null>(entry.floats ?? null);
  const [editingTime, setEditingTime] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dayText = formatDateForDisplay(entry.date);
  const timeText = formatTime(hours, minutes);
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  const handleSave = () => {
    const [y, mo, d] = entry.date.split('-').map(Number);
    saveEntry({
      id: entry.id,
      date: entry.date,
      time: timeText,
      notes,
      timestamp: new Date(y, mo - 1, d, hours, minutes).getTime(),
      bristol,
      floats,
    });
    window.dispatchEvent(new Event('cacalendario-updated'));
    onClose();
  };

  const handleDelete = () => {
    deleteEntry(entry.id);
    window.dispatchEvent(new Event('cacalendario-updated'));
    onClose();
  };

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
        <p className="text-xl mt-0.5 shrink-0" style={{ color: theme.text }}>{dayText}</p>

        {/* Time */}
        <p className="text-sm font-black mt-2.5 shrink-0" style={{ color: theme.text }}>HORA</p>
        <div className="flex items-center gap-3 mt-0.5 shrink-0">
          {editingTime ? (
            <input
              type="time"
              value={timeText}
              onChange={(e) => {
                const [newH, newM] = e.target.value.split(':').map(Number);
                setHours(newH);
                setMinutes(newM);
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

      {/* Action buttons */}
      <div className="shrink-0 px-8 py-3">
        {confirmDelete ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-center" style={{ color: theme.text }}>
              ¿Seguro que quieres eliminar este registro?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-full py-2 active:scale-95 transition-transform border-2"
                style={{ borderColor: theme.text }}
              >
                <span className="text-sm" style={{ color: theme.text }}>cancelar</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-full py-2 active:scale-95 transition-transform"
                style={{ backgroundColor: '#c0392b' }}
              >
                <span className="text-sm text-white font-bold">eliminar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-full px-5 py-2.5 active:scale-95 transition-transform border-2"
              style={{ borderColor: '#c0392b' }}
            >
              <span className="text-sm" style={{ color: '#c0392b' }}>🗑️ eliminar</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-full py-2.5 active:scale-95 transition-transform"
              style={{ backgroundColor: theme.text }}
            >
              <span className="text-lg" style={{ color: invertColor }}>guardar</span>
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
