import { useState } from 'react';
import { formatDateForDisplay, formatTime } from '../lib/dates';
import { saveEntry, deleteEntry, type PoopEntry } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getDoctorHiddenFields } from '../lib/preferences';
import BristolPicker from './BristolPicker';

interface EditScreenProps {
  entry: PoopEntry;
  onClose: () => void;
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

const URINE_COLOR_OPTIONS = [
  { hex: '#FDFBEA', label: 'Muy clara' },
  { hex: '#FFF59D', label: 'Pálida' },
  { hex: '#FFE033', label: 'Amarillo claro' },
  { hex: '#FFC107', label: 'Amarillo' },
  { hex: '#FF8F00', label: 'Ámbar' },
  { hex: '#5D4037', label: 'Marrón oscuro' },
];

const URINE_TYPE_OPTIONS = [
  { label: 'Voluntaria', value: 'voluntary' as const },
  { label: 'Escape sin aviso', value: 'involuntary_escape' as const },
  { label: 'Goteo continuo', value: 'involuntary_drip' as const },
];

const URINE_CHARACTERISTICS = [
  { key: 'blood', label: 'Sangre' },
  { key: 'aspect', label: 'Aspecto' },
  { key: 'odor', label: 'Olor' },
  { key: 'pain', label: 'Dolor' },
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

export default function EditScreen({ entry, onClose }: EditScreenProps) {
  const { emoji, theme } = usePreferences();
  const hiddenFields = getDoctorHiddenFields();
  const show = (field: string) => !hiddenFields.includes(field);
  const [h, m] = entry.time.split(':').map(Number);
  const [hours, setHours] = useState(h);
  const [minutes, setMinutes] = useState(m);
  const [notes, setNotes] = useState(entry.notes);
  const [editingTime, setEditingTime] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isUrine = entry.entry_type === 'urine';

  // Poop fields
  const [bristol, setBristol] = useState<number | null>(entry.bristol ?? null);
  const [floats, setFloats] = useState<'floats' | 'sinks' | 'both' | null>(
    entry.floats === true ? 'floats' : entry.floats === false ? 'sinks' : (entry.floats ?? null)
  );
  const [color, setColor] = useState<string | null>(entry.color ?? null);
  const [quantity, setQuantity] = useState<number>(entry.quantity ?? 50);
  const [duration, setDuration] = useState<'short' | 'medium' | 'long' | null>(entry.duration ?? null);
  const [symptoms, setSymptoms] = useState<string[]>(entry.symptoms ?? []);

  // Urine fields
  const [urineType, setUrineType] = useState<'voluntary' | 'involuntary_escape' | 'involuntary_drip' | null>(entry.urine_type ?? null);
  const [urineQuantity, setUrineQuantity] = useState<number>(entry.urine_quantity ?? 0);
  const [urineColor, setUrineColor] = useState<string | null>(entry.urine_color ?? null);
  const [urineCharacteristics, setUrineCharacteristics] = useState<string[]>(entry.urine_characteristics ?? []);

  const dayText = formatDateForDisplay(entry.date);
  const timeText = formatTime(hours, minutes);
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  const toggleSymptom = (key: string) =>
    setSymptoms(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);

  const toggleUrineChar = (key: string) =>
    setUrineCharacteristics(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);

  const quantityLabel = quantity <= 25 ? 'Ligero' : quantity <= 50 ? 'Moderado' : quantity <= 75 ? 'Abundante' : 'Pesado';

  const handleSave = () => {
    const [y, mo, d] = entry.date.split('-').map(Number);
    saveEntry({
      id: entry.id,
      date: entry.date,
      time: timeText,
      notes,
      timestamp: new Date(y, mo - 1, d, hours, minutes).getTime(),
      entry_type: entry.entry_type ?? 'poop',
      bristol: isUrine ? null : bristol,
      floats: isUrine ? null : floats,
      color: isUrine ? null : color,
      quantity: isUrine ? null : quantity,
      duration: isUrine ? null : duration,
      symptoms: isUrine ? [] : symptoms,
      urine_type: isUrine ? urineType : null,
      urine_quantity: isUrine ? urineQuantity : null,
      urine_color: isUrine ? urineColor : null,
      urine_characteristics: isUrine ? urineCharacteristics : [],
    });
    window.dispatchEvent(new Event('fluxia-updated'));
    onClose();
  };

  const handleDelete = () => {
    deleteEntry(entry.id);
    window.dispatchEvent(new Event('fluxia-updated'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ backgroundColor: theme.main }}>
    <div className="w-full max-w-md h-full mx-auto flex flex-col relative">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill={theme.text}/>
          <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Logo */}
      <div className="flex justify-center pt-10 pb-2 shrink-0">
        <img src={asset('/logo.svg')} alt="Fluxia" className="w-14 h-[50px]" />
      </div>

      <div className="flex-1 px-8 flex flex-col min-h-0 overflow-auto pb-4">

        {/* Day */}
        <p className="text-sm font-black shrink-0" style={{ color: theme.text }}>DÍA</p>
        <p className="text-xl mt-0.5 shrink-0" style={{ color: theme.text }}>{dayText}</p>

        {/* Entry type badge */}
        <div className="mt-2 shrink-0">
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ backgroundColor: theme.glass, color: theme.text }}>
            {isUrine ? '💧 Micción' : '💩 Deposición'}
          </span>
        </div>

        {/* Time */}
        <p className="text-sm font-black mt-3 shrink-0" style={{ color: theme.text }}>HORA</p>
        <div className="flex items-center gap-3 mt-0.5 shrink-0">
          {editingTime ? (
            <input
              type="time"
              value={timeText}
              onChange={(e) => {
                const [newH, newM] = e.target.value.split(':').map(Number);
                setHours(newH); setMinutes(newM);
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

        {/* ── POOP FORM ── */}
        {!isUrine && <>
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
        </>}

        {/* ── URINE FORM ── */}
        {isUrine && <>
          {/* Urine type */}
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>TIPO DE MICCIÓN</p>
          <div className="flex flex-col gap-2 mt-1.5 shrink-0">
            {URINE_TYPE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setUrineType(urineType === opt.value ? null : opt.value)}
                className="rounded-xl py-2.5 px-4 text-left transition-all active:scale-95"
                style={{
                  backgroundColor: urineType === opt.value ? theme.text : theme.glass,
                  color: urineType === opt.value ? invertColor : theme.text,
                }}>
                <span className="text-sm font-bold">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Urine quantity */}
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>
            CANTIDAD — <span className="font-normal">{urineQuantity} ml</span>
          </p>
          <div className="mt-2 shrink-0 px-1">
            <input type="range" min={0} max={500} step={10} value={urineQuantity}
              onChange={e => setUrineQuantity(Number(e.target.value))}
              className="w-full" style={{ accentColor: theme.text }} />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: `${theme.text}70` }}>
              <span>0 ml</span><span>500 ml</span>
            </div>
          </div>

          {/* Urine color */}
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>COLOR</p>
          <div className="flex gap-3 mt-2 shrink-0">
            {URINE_COLOR_OPTIONS.map(opt => (
              <button key={opt.hex} onClick={() => setUrineColor(urineColor === opt.hex ? null : opt.hex)}
                title={opt.label}
                style={{
                  width: 36, height: 36, borderRadius: '50%', backgroundColor: opt.hex, flexShrink: 0,
                  border: urineColor === opt.hex ? `3px solid ${theme.text}` : '3px solid #00000030',
                  boxShadow: urineColor === opt.hex ? `0 0 0 2px ${theme.main}` : 'none',
                  transition: 'transform 0.1s',
                  transform: urineColor === opt.hex ? 'scale(1.15)' : 'scale(1)',
                }} />
            ))}
          </div>

          {/* Urine characteristics */}
          <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>CARACTERÍSTICAS</p>
          <div className="flex flex-wrap gap-2 mt-1.5 shrink-0">
            {URINE_CHARACTERISTICS.map(c => {
              const active = urineCharacteristics.includes(c.key);
              return (
                <button key={c.key} onClick={() => toggleUrineChar(c.key)}
                  className="rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95"
                  style={{
                    backgroundColor: active ? theme.text : theme.glass,
                    color: active ? invertColor : theme.text,
                  }}>
                  {c.label}
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

      {/* Action buttons */}
      <div className="shrink-0 px-8 py-3">
        {confirmDelete ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-center" style={{ color: theme.text }}>
              ¿Seguro que quieres eliminar este registro?
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-full py-2 active:scale-95 transition-transform border-2"
                style={{ borderColor: theme.text }}>
                <span className="text-sm" style={{ color: theme.text }}>cancelar</span>
              </button>
              <button onClick={handleDelete}
                className="flex-1 rounded-full py-2 active:scale-95 transition-transform"
                style={{ backgroundColor: '#c0392b' }}>
                <span className="text-sm text-white font-bold">eliminar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(true)}
              className="rounded-full px-5 py-2.5 active:scale-95 transition-transform"
              style={{ backgroundColor: '#c0392b' }}>
              <span className="text-sm font-bold text-white">🗑️ eliminar</span>
            </button>
            <button onClick={handleSave}
              className="flex-1 rounded-full py-2.5 active:scale-95 transition-transform"
              style={{ backgroundColor: theme.text }}>
              <span className="text-lg" style={{ color: invertColor }}>guardar</span>
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
