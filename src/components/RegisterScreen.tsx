import { useState } from 'react';
import { formatDateLong, formatDateForDisplay, formatTime, toDateKey } from '../lib/dates';
import { saveEntry, generateEntryId } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getDoctorHiddenFields } from '../lib/preferences';
import BristolPicker from './BristolPicker';

interface RegisterScreenProps {
  date?: string | null;
  onClose: () => void;
  onSuccess: (date: string, time: string, bristol: number | null, floats: 'floats' | 'sinks' | 'both' | null) => void;
}

const FLOAT_OPTIONS = [
  { label: '🫧 Flota', value: 'floats' as const },
  { label: '⬇️ No flota', value: 'sinks' as const },
  { label: '🫧⬇️ Ambos', value: 'both' as const },
];

const COLOR_OPTIONS = [
  { hex: '#3B1F0E', label: 'Marrón oscuro' },
  { hex: '#7B4226', label: 'Marrón' },
  { hex: '#C4844A', label: 'Marrón claro' },
  { hex: '#D4B84A', label: 'Amarillo' },
  { hex: '#C0392B', label: 'Rojo' },
];

const DURATION_OPTIONS = [
  { label: '< 3 min', value: 'short' as const },
  { label: '3 – 5 min', value: 'medium' as const },
  { label: '> 5 min', value: 'long' as const },
];

const SYMPTOMS = [
  { key: 'abdominal_pain', label: 'Dolor abdominal' },
  { key: 'bloating', label: 'Hinchazón' },
  { key: 'heartburn', label: 'Ardor' },
  { key: 'cramp', label: 'Calambre' },
  { key: 'rectal_pain', label: 'Dolor rectal' },
  { key: 'blood', label: 'Sangre' },
  { key: 'mucus', label: 'Moco' },
  { key: 'smelly', label: 'Maloliente' },
  { key: 'sticky', label: 'Pegajoso' },
  { key: 'stringy', label: 'Filamentoso' },
  { key: 'undigested', label: 'No digerido' },
];

export default function RegisterScreen({ date, onClose, onSuccess }: RegisterScreenProps) {
  const { emoji, theme } = usePreferences();
  const hiddenFields = getDoctorHiddenFields();
  const show = (field: string) => !hiddenFields.includes(field);
  const now = new Date();

  const targetDate = date || toDateKey(now);
  const [y, mo, d] = targetDate.split('-').map(Number);
  const isToday = targetDate === toDateKey(now);

  const [hours, setHours] = useState(isToday ? now.getHours() : 12);
  const [minutes, setMinutes] = useState(isToday ? now.getMinutes() : 0);
  const [notes, setNotes] = useState('');
  const [bristol, setBristol] = useState<number | null>(null);
  const [floats, setFloats] = useState<'floats' | 'sinks' | 'both' | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(50);
  const [duration, setDuration] = useState<'short' | 'medium' | 'long' | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [editingTime, setEditingTime] = useState(false);

  const dayText = isToday ? formatDateLong(now) : formatDateForDisplay(targetDate);
  const timeText = formatTime(hours, minutes);

  const toggleSymptom = (key: string) =>
    setSymptoms(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);

  const quantityLabel = quantity <= 25 ? 'Ligero' : quantity <= 50 ? 'Moderado' : quantity <= 75 ? 'Abundante' : 'Pesado';

  const handleSave = () => {
    saveEntry({
      id: generateEntryId(),
      date: targetDate,
      time: timeText,
      notes,
      timestamp: new Date(y, mo - 1, d, hours, minutes).getTime(),
      bristol,
      floats,
      color,
      quantity,
      duration,
      symptoms,
    });
    window.dispatchEvent(new Event('fluxia-updated'));
    onSuccess(targetDate, timeText, bristol, floats);
  };

  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ backgroundColor: theme.main }}>
    <div className="w-full max-w-md h-full mx-auto flex flex-col relative">
      <div className="flex-1 px-8 flex flex-col min-h-0 overflow-auto pb-4">
        {/* Header: logo + close */}
        <div className="relative flex justify-center pt-10 pb-2">
          <img src={asset('/logo.svg')} alt="Fluxia" className="w-14 h-[50px]" />
          <button onClick={onClose} className="absolute top-3 right-0 w-10 h-10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill={theme.text}/>
              <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Day */}
        <p className="text-sm font-black shrink-0" style={{ color: theme.text }}>DÍA</p>
        <p className="text-xl mt-0.5 shrink-0" style={{ color: theme.text }}>
          {dayText}
          {!isToday && <span className="text-xs ml-2 opacity-60">(registro pasado)</span>}
        </p>

        {/* Time */}
        <p className="text-sm font-black mt-3 shrink-0" style={{ color: theme.text }}>HORA</p>
        <div className="flex items-center gap-3 mt-0.5 shrink-0">
          {editingTime ? (
            <input
              type="time"
              value={timeText}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                setHours(h); setMinutes(m);
              }}
              onBlur={() => setEditingTime(false)}
              autoFocus
              className="text-xl bg-transparent border-b-2 outline-none w-24"
              style={{ color: theme.text, borderColor: theme.text }}
            />
          ) : (
            <p className="text-xl" style={{ color: theme.text }}>{timeText}</p>
          )}
          <button onClick={() => setEditingTime(true)} className="rounded-full px-4 py-1 text-sm"
            style={{ backgroundColor: theme.text, color: invertColor }}>
            cambiar
          </button>
        </div>

        {/* Bristol Scale */}
        {show('bristol') && <>
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>¿QUÉ FORMA TENÍA?</p>
          <p className="text-[10px] mt-0.5 shrink-0" style={{ color: `${theme.text}80` }}>
            Escala de Bristol — selecciona el tipo más parecido
          </p>
          <div className="mt-1.5 shrink-0">
            <BristolPicker value={bristol} onChange={setBristol} theme={theme} />
          </div>
        </>}

        {/* Color */}
        {show('color') && <>
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>COLOR</p>
          <div className="flex gap-3 mt-2 shrink-0">
            {COLOR_OPTIONS.map(opt => (
              <button key={opt.hex} onClick={() => setColor(color === opt.hex ? null : opt.hex)}
                title={opt.label}
                style={{
                  width: 36, height: 36, borderRadius: '50%', backgroundColor: opt.hex, flexShrink: 0,
                  border: color === opt.hex ? `3px solid ${theme.text}` : '3px solid transparent',
                  boxShadow: color === opt.hex ? `0 0 0 2px ${theme.main}` : 'none',
                  transition: 'transform 0.1s',
                  transform: color === opt.hex ? 'scale(1.15)' : 'scale(1)',
                }} />
            ))}
          </div>
        </>}

        {/* Floats */}
        {show('floats') && <>
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>¿FLOTA?</p>
          <div className="flex gap-2 mt-1.5 shrink-0">
            {FLOAT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setFloats(floats === opt.value ? null : opt.value)}
                className="flex-1 rounded-xl py-2 text-center transition-all active:scale-95"
                style={{
                  backgroundColor: floats === opt.value ? theme.text : theme.glass,
                  color: floats === opt.value ? invertColor : theme.text,
                }}>
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </>}

        {/* Quantity */}
        {show('quantity') && <>
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>
            CANTIDAD — <span className="font-normal">{quantityLabel} ({quantity})</span>
          </p>
          <div className="mt-2 shrink-0 px-1">
            <input type="range" min={0} max={100} value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full" style={{ accentColor: theme.text }} />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: `${theme.text}70` }}>
              <span>Ligero</span><span>Pesado</span>
            </div>
          </div>
        </>}

        {/* Duration */}
        {show('duration') && <>
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>DURACIÓN</p>
          <div className="flex gap-2 mt-1.5 shrink-0">
            {DURATION_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setDuration(duration === opt.value ? null : opt.value)}
                className="flex-1 rounded-xl py-2 text-center transition-all active:scale-95"
                style={{
                  backgroundColor: duration === opt.value ? theme.text : theme.glass,
                  color: duration === opt.value ? invertColor : theme.text,
                }}>
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </>}

        {/* Symptoms */}
        {show('symptoms') && <>
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>SÍNTOMAS</p>
          <div className="flex flex-wrap gap-2 mt-1.5 shrink-0">
            {SYMPTOMS.map(s => {
              const active = symptoms.includes(s.key);
              return (
                <button key={s.key} onClick={() => toggleSymptom(s.key)}
                  className="rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95"
                  style={{
                    backgroundColor: active ? theme.text : theme.glass,
                    color: active ? invertColor : theme.text,
                  }}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </>}

        {/* Notes */}
        <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>NOTAS</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe tus notas aquí..."
          rows={3}
          className="w-full mt-1 shrink-0 rounded-lg p-3 text-sm resize-none outline-none placeholder-white/50"
          style={{ backgroundColor: theme.glass, color: theme.text }}
        />
      </div>

      {/* Register button */}
      <div className="shrink-0 flex justify-center px-8 py-3">
        <button onClick={handleSave}
          className="w-full max-w-sm rounded-full py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          style={{ backgroundColor: theme.text }}>
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
