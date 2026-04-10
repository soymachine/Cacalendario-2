import { useState } from 'react';
import { formatDateForDisplay, formatTime, toDateKey } from '../lib/dates';
import { saveEntry, generateEntryId } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getDoctorHiddenFields } from '../lib/preferences';
import BristolPicker from './BristolPicker';
import { D } from '../lib/design';

interface RegisterScreenProps {
  date?: string | null;
  isTab?: boolean;
  onClose?: () => void;
  onSuccess: (date: string, time: string, entryType: 'poop' | 'urine') => void;
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

export default function RegisterScreen({ date, isTab, onClose, onSuccess }: RegisterScreenProps) {
  const { emoji } = usePreferences();
  const hiddenFields = getDoctorHiddenFields();
  const show = (field: string) => !hiddenFields.includes(field);

  const now = new Date();
  const [entryType, setEntryType] = useState<'poop' | 'urine'>('poop');
  const [hours, setHours] = useState(now.getHours());
  const [minutes, setMinutes] = useState(now.getMinutes());
  const [editingTime, setEditingTime] = useState(false);
  const [notes, setNotes] = useState('');

  // Poop fields
  const [bristol, setBristol] = useState<number | null>(null);
  const [floats, setFloats] = useState<'floats' | 'sinks' | 'both' | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(50);
  const [duration, setDuration] = useState<'short' | 'medium' | 'long' | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);

  // Urine fields
  const [urineType, setUrineType] = useState<'voluntary' | 'involuntary_escape' | 'involuntary_drip' | null>(null);
  const [urineQuantity, setUrineQuantity] = useState(0);
  const [urineColor, setUrineColor] = useState<string | null>(null);
  const [urineCharacteristics, setUrineCharacteristics] = useState<string[]>([]);

  const targetDate = date ?? toDateKey(now);
  const dayText = formatDateForDisplay(targetDate);
  const timeText = formatTime(hours, minutes);
  const quantityLabel = quantity <= 25 ? 'Ligero' : quantity <= 50 ? 'Moderado' : quantity <= 75 ? 'Abundante' : 'Pesado';
  const isUrine = entryType === 'urine';

  const toggleSymptom = (key: string) =>
    setSymptoms(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  const toggleUrineChar = (key: string) =>
    setUrineCharacteristics(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);

  const handleSave = () => {
    const [y, mo, d] = targetDate.split('-').map(Number);
    saveEntry({
      id: generateEntryId(),
      date: targetDate,
      time: timeText,
      notes,
      timestamp: new Date(y, mo - 1, d, hours, minutes).getTime(),
      entry_type: entryType,
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
    onSuccess(targetDate, timeText, entryType);
  };

  const sectionCard: React.CSSProperties = {
    backgroundColor: D.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 900, color: D.textMuted,
    letterSpacing: 0.5, display: 'block', marginBottom: 8,
  };

  const chipActive: React.CSSProperties = { backgroundColor: D.primary, color: D.primaryText };
  const chipInactive: React.CSSProperties = { backgroundColor: D.chip, color: D.chipText };

  const fakeTheme = { text: D.text, glass: D.chip, main: D.bg, id: 'light' } as any;

  const content = (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: isTab ? '24px 16px 32px' : '60px 16px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: D.text, margin: 0 }}>
          {isTab ? 'Registrar' : dayText}
        </h1>
        {!isTab && onClose && (
          <button
            onClick={onClose}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill={D.primary} />
              <path d="M8 8L16 16M16 8L8 16" stroke={D.primaryText} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Entry type toggle */}
      <div style={{ ...sectionCard, padding: '6px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setEntryType('poop')}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              ...(entryType === 'poop' ? chipActive : { backgroundColor: 'transparent', color: D.textMuted }),
            }}
          >
            {emoji.char === 'svg'
              ? <img src={asset('/poop-small.svg')} alt="" style={{ width: 20, height: 20 }} />
              : <span>{emoji.char}</span>}
            Deposición
          </button>
          <button
            onClick={() => setEntryType('urine')}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              ...(entryType === 'urine' ? chipActive : { backgroundColor: 'transparent', color: D.textMuted }),
            }}
          >
            <span>💧</span>
            Micción
          </button>
        </div>
      </div>

      {/* Date (only in modal mode) */}
      {!isTab && (
        <div style={sectionCard}>
          <span style={sectionLabel}>DÍA</span>
          <p style={{ fontSize: 18, fontWeight: 700, color: D.text, margin: 0 }}>{dayText}</p>
        </div>
      )}

      {/* Time */}
      <div style={sectionCard}>
        <span style={sectionLabel}>HORA</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              style={{
                fontSize: 20, background: 'transparent', border: 'none',
                borderBottom: `2px solid ${D.primary}`, outline: 'none',
                color: D.text, width: 96,
              }}
            />
          ) : (
            <span style={{ fontSize: 20, fontWeight: 700, color: D.text }}>{timeText}</span>
          )}
          <button
            onClick={() => setEditingTime(true)}
            style={{
              padding: '6px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
              backgroundColor: D.primary, color: D.primaryText, fontSize: 13, fontWeight: 700,
            }}
          >
            cambiar
          </button>
        </div>
      </div>

      {/* ── POOP FORM ── */}
      {!isUrine && <>
        {show('bristol') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>¿QUÉ FORMA TENÍA?</span>
            <p style={{ fontSize: 11, color: D.textMuted, marginBottom: 10, marginTop: -4 }}>
              Escala de Bristol — selecciona el tipo más parecido
            </p>
            <BristolPicker value={bristol} onChange={setBristol} theme={fakeTheme} />
          </div>
        )}

        {show('color') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>COLOR</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.hex}
                  onClick={() => setColor(color === opt.hex ? null : opt.hex)}
                  title={opt.label}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', backgroundColor: opt.hex,
                    border: color === opt.hex ? `3px solid ${D.primary}` : '3px solid transparent',
                    boxShadow: color === opt.hex ? `0 0 0 2px ${D.bg}` : 'none',
                    transform: color === opt.hex ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.1s', cursor: 'pointer', flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {show('floats') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>¿FLOTA?</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {FLOAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFloats(floats === opt.value ? null : opt.value)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.1s',
                    ...(floats === opt.value ? chipActive : chipInactive),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {show('quantity') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>CANTIDAD — <span style={{ fontWeight: 400 }}>{quantityLabel} ({quantity})</span></span>
            <input
              type="range" min={0} max={100} value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              style={{ width: '100%', accentColor: D.primary }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: D.textMuted, marginTop: 4 }}>
              <span>Ligero</span><span>Pesado</span>
            </div>
          </div>
        )}

        {show('duration') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>DURACIÓN</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(duration === opt.value ? null : opt.value)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.1s',
                    ...(duration === opt.value ? chipActive : chipInactive),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {show('symptoms') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>SÍNTOMAS</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SYMPTOMS.map(s => {
                const active = symptoms.includes(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleSymptom(s.key)}
                    style={{
                      padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, transition: 'all 0.1s',
                      ...(active ? chipActive : chipInactive),
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </>}

      {/* ── URINE FORM ── */}
      {isUrine && <>
        {show('urine_type') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>TIPO DE MICCIÓN</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {URINE_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setUrineType(urineType === opt.value ? null : opt.value)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, textAlign: 'left', transition: 'all 0.1s',
                    ...(urineType === opt.value ? chipActive : chipInactive),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {show('urine_quantity') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>CANTIDAD — <span style={{ fontWeight: 400 }}>{urineQuantity} ml</span></span>
            <input
              type="range" min={0} max={500} step={10} value={urineQuantity}
              onChange={e => setUrineQuantity(Number(e.target.value))}
              style={{ width: '100%', accentColor: D.primary }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: D.textMuted, marginTop: 4 }}>
              <span>0 ml</span><span>500 ml</span>
            </div>
          </div>
        )}

        {show('urine_color') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>COLOR</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {URINE_COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.hex}
                  onClick={() => setUrineColor(urineColor === opt.hex ? null : opt.hex)}
                  title={opt.label}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', backgroundColor: opt.hex,
                    border: urineColor === opt.hex ? `3px solid ${D.primary}` : '3px solid #00000030',
                    boxShadow: urineColor === opt.hex ? `0 0 0 2px ${D.bg}` : 'none',
                    transform: urineColor === opt.hex ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.1s', cursor: 'pointer', flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {show('urine_characteristics') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>CARACTERÍSTICAS</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {URINE_CHARACTERISTICS.map(c => {
                const active = urineCharacteristics.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => toggleUrineChar(c.key)}
                    style={{
                      padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, transition: 'all 0.1s',
                      ...(active ? chipActive : chipInactive),
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </>}

      {/* Notes */}
      <div style={sectionCard}>
        <span style={sectionLabel}>NOTAS</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe tus notas aquí..."
          rows={3}
          style={{
            width: '100%', borderRadius: 10, padding: '10px 12px',
            fontSize: 14, color: D.text, backgroundColor: D.bg,
            border: `1px solid ${D.border}`, outline: 'none', resize: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '15px 0', borderRadius: 50, border: 'none',
          cursor: 'pointer', backgroundColor: D.primary, color: D.primaryText,
          fontSize: 17, fontWeight: 700, marginTop: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <span>Guardar registro</span>
        {isUrine ? (
          <span style={{ fontSize: 20 }}>💧</span>
        ) : emoji.char === 'svg' ? (
          <img src={asset('/poop-button.svg')} alt="" style={{ width: 24, height: 24 }} />
        ) : (
          <span style={{ fontSize: 20 }}>{emoji.char}</span>
        )}
      </button>
    </div>
  );

  if (isTab) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', backgroundColor: D.bg }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: D.bg, overflowY: 'auto' }}>
      {content}
    </div>
  );
}
