import { useState } from 'react';
import { formatDateForDisplay, formatTime } from '../lib/dates';
import { saveEntry, type PoopEntry } from '../lib/storage';

interface EditScreenProps {
  entry: PoopEntry;
  onClose: () => void;
}

export default function EditScreen({ entry, onClose }: EditScreenProps) {
  const [h, m] = entry.time.split(':').map(Number);
  const [hours, setHours] = useState(h);
  const [minutes, setMinutes] = useState(m);
  const [notes, setNotes] = useState(entry.notes);
  const [editingTime, setEditingTime] = useState(false);

  const dayText = formatDateForDisplay(entry.date);
  const timeText = formatTime(hours, minutes);

  const handleSave = () => {
    const [y, mo, d] = entry.date.split('-').map(Number);
    saveEntry({
      date: entry.date,
      time: timeText,
      notes,
      timestamp: new Date(y, mo - 1, d, hours, minutes).getTime(),
    });
    window.dispatchEvent(new Event('cacalendario-updated'));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-salmon flex flex-col min-h-screen z-50">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#231f20"/>
          <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Logo */}
      <div className="flex justify-center pt-12 pb-6">
        <img src="/logo.svg" alt="Cacalendario" className="w-20 h-[71px]" />
      </div>

      <div className="flex-1 px-10 overflow-auto pb-32">
        {/* Day */}
        <p className="text-sm font-black text-black">DÍA</p>
        <p className="text-3xl text-black mt-1">{dayText}</p>

        {/* Time */}
        <p className="text-sm font-black text-black mt-4">HORA</p>
        <div className="flex items-center gap-4 mt-1">
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
              className="text-3xl text-black bg-transparent border-b-2 border-black outline-none w-28"
            />
          ) : (
            <p className="text-3xl text-black">{timeText}</p>
          )}
          <button
            onClick={() => setEditingTime(true)}
            className="bg-black rounded-full px-6 py-2 text-white text-xl"
          >
            cambiar
          </button>
        </div>

        {/* Notes */}
        <p className="text-sm font-black text-black mt-6">NOTAS</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe tus notas aquí..."
          className="w-full mt-2 rounded-lg p-4 text-black text-base resize-none outline-none"
          style={{ minHeight: '220px', backgroundColor: 'rgba(255,255,255,0.28)' }}
        />
      </div>

      {/* Edit button */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center px-10">
        <button
          onClick={handleSave}
          className="bg-black rounded-full px-12 py-4 active:scale-95 transition-transform"
        >
          <span className="text-white text-3xl">editar</span>
        </button>
      </div>
    </div>
  );
}
