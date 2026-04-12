import { useState } from 'react';
import { formatDateForDisplay, formatTime, toDateKey } from '../lib/dates';
import { saveEntry, generateEntryId } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getDoctorHiddenFields, getDoctorImage, getDoctorEntryTypeMode } from '../lib/preferences';
import BristolPicker from './BristolPicker';
import { D } from '../lib/design';

interface RegisterScreenProps {
  date?: string | null;
  isTab?: boolean;
  onClose?: () => void;
  onSuccess: (date: string, time: string, entryType: 'poop' | 'urine') => void;
}

const FLOAT_OPTIONS = [
  { label: 'Flota', value: 'floats' as const, img: '/Flota_2.png' },
  { label: 'No flota', value: 'sinks' as const, img: '/Flota_1.png' },
  { label: 'Ambos', value: 'both' as const, img: '/Flota_3.png' },
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
  { label: '<3 min', value: 'short' as const },
  { label: '3-5 min', value: 'medium' as const },
  { label: '>5 min', value: 'long' as const },
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

// Edit icon for date/time row and notes
function EditIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill={D.chip} />
      <path d="M13 23L14.5 19L22 11.5L24.5 14L17 21.5L13 23Z" stroke={D.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M20.5 13L23 15.5" stroke={D.text} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export default function RegisterScreen({ date, isTab, onClose, onSuccess }: RegisterScreenProps) {
  const { emoji } = usePreferences();
  const hiddenFields = getDoctorHiddenFields();
  const show = (field: string) => !hiddenFields.includes(field);
  const entryTypeMode = getDoctorEntryTypeMode();

  const now = new Date();
  const [entryType, setEntryType] = useState<'poop' | 'urine'>(
    entryTypeMode === 'urine_only' ? 'urine' : 'poop'
  );
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
    padding: '14px 16px',
    marginBottom: 10,
  };

  // Figma-aligned section label: larger, dark, bold
  const sectionLabel: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: D.text,
    display: 'block',
    marginBottom: 12,
  };

  const chipActive: React.CSSProperties = { backgroundColor: D.primary, color: D.primaryText };
  const chipInactive: React.CSSProperties = { backgroundColor: D.chip, color: D.chipText };

  const content = (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: isTab ? '16px 16px 32px' : '60px 16px 16px' }}>

      {/* Logo (only in tab mode) */}
      {isTab && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <img src={getDoctorImage() || asset('/fluxia-logo.png')} alt="Fluxia" style={{ height: 52, objectFit: 'contain' }} />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: D.text, margin: 0 }}>
          Registro
        </h1>
        {!isTab && onClose && (
          <button
            onClick={onClose}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill={D.primary} />
              <path d="M12 12L24 24M24 12L12 24" stroke={D.primaryText} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Date + time row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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
              fontSize: 16, background: 'transparent', border: 'none',
              borderBottom: `2px solid ${D.primary}`, outline: 'none',
              color: D.text, fontFamily: 'inherit', fontWeight: 700,
            }}
          />
        ) : (
          <span style={{ fontSize: 16, fontWeight: 700, color: D.text }}>
            {dayText} {timeText}
          </span>
        )}
        <button
          onClick={() => setEditingTime(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <EditIcon />
        </button>
      </div>

      {/* Entry type toggle — only shown when both types are allowed */}
      {entryTypeMode === 'both' && (
        <div style={{
          display: 'flex',
          backgroundColor: D.chip,
          borderRadius: 999,
          padding: 4,
          marginBottom: 10,
          gap: 4,
        }}>
          {/* Poop */}
          <button
            onClick={() => setEntryType('poop')}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 999,
              backgroundColor: entryType === 'poop' ? D.card : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: entryType === 'poop' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'background-color 0.2s, box-shadow 0.2s',
            }}
          >
            <img
              src={asset('/Switch-Caca-Icono.svg')}
              width={38}
              height={38}
              alt="Deposición"
              style={{
                display: 'block',
                filter: entryType === 'poop' ? 'brightness(0) opacity(0.45)' : 'brightness(0) invert(1)',
                transition: 'filter 0.2s',
              }}
            />
          </button>

          {/* Urine */}
          <button
            onClick={() => setEntryType('urine')}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 999,
              backgroundColor: entryType === 'urine' ? D.card : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: entryType === 'urine' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'background-color 0.2s, box-shadow 0.2s',
            }}
          >
            <img
              src={asset('/Switch-Miccion-Icono.svg')}
              width={38}
              height={38}
              alt="Micción"
              style={{
                display: 'block',
                filter: entryType === 'urine' ? 'brightness(0) opacity(0.45)' : 'brightness(0) invert(1)',
                transition: 'filter 0.2s',
              }}
            />
          </button>
        </div>
      )}

      {/* ── POOP FORM ── */}
      {!isUrine && <>
        {show('bristol') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Forma</span>
            <BristolPicker value={bristol} onChange={setBristol} />
          </div>
        )}

        {show('floats') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Flotación</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {FLOAT_OPTIONS.map(opt => {
                const isActive = floats === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFloats(floats === opt.value ? null : opt.value)}
                    style={{
                      flex: 1, padding: '10px 4px 8px', borderRadius: 12,
                      border: isActive ? `2px solid ${D.primary}` : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 0.1s',
                      backgroundColor: D.chip,
                      color: D.text,
                    }}
                  >
                    <img src={asset(opt.img)} alt={opt.label} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {show('color') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Color</span>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.hex}
                  onClick={() => setColor(color === opt.hex ? null : opt.hex)}
                  title={opt.label}
                  style={{
                    flex: 1, aspectRatio: '1', borderRadius: '50%', backgroundColor: opt.hex,
                    border: 'none',
                    boxShadow: color === opt.hex ? '0 0 0 3px white, 0 0 0 5px rgba(0,0,0,0.5)' : 'none',
                    outline: color === opt.hex ? 'none' : 'none',
                    transition: 'box-shadow 0.1s', cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {show('quantity') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Cantidad</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={asset('/Ligero-icon.svg')} alt="Ligero" style={{ width: 24, height: 24, objectFit: 'contain', opacity: 0.6 }} />
              <input
                type="range" min={0} max={100} value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                style={{ flex: 1, accentColor: D.primary }}
              />
              <img src={asset('/Pesado-icon.svg')} alt="Pesado" style={{ width: 24, height: 24, objectFit: 'contain', opacity: 0.6 }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: D.textMuted, marginTop: 4 }}>
              <span style={{ fontWeight: 600, color: D.text }}>{quantityLabel}</span>
            </div>
          </div>
        )}

        {show('duration') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Duración</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(duration === opt.value ? null : opt.value)}
                  style={{
                    flex: 1, padding: '10px 4px', borderRadius: 99, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, transition: 'all 0.1s',
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
            <span style={sectionLabel}>Síntomas</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SYMPTOMS.map(s => {
                const active = symptoms.includes(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleSymptom(s.key)}
                    style={{
                      padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.1s',
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
            <span style={sectionLabel}>Tipo de micción</span>
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
            <span style={sectionLabel}>Cantidad — <span style={{ fontWeight: 400, fontSize: 13, color: D.textMuted }}>{urineQuantity} ml</span></span>
            <input
              type="range" min={0} max={500} step={10} value={urineQuantity}
              onChange={e => setUrineQuantity(Number(e.target.value))}
              style={{ width: '100%', accentColor: D.primary }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: D.textMuted, marginTop: 4 }}>
              <span>0 ml</span><span>500 ml</span>
            </div>
          </div>
        )}

        {show('urine_color') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Color</span>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              {URINE_COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.hex}
                  onClick={() => setUrineColor(urineColor === opt.hex ? null : opt.hex)}
                  title={opt.label}
                  style={{
                    flex: 1, aspectRatio: '1', borderRadius: '50%', backgroundColor: opt.hex,
                    border: 'none',
                    boxShadow: urineColor === opt.hex ? '0 0 0 3px white, 0 0 0 5px rgba(0,0,0,0.5)' : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                    transition: 'box-shadow 0.1s', cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {show('urine_characteristics') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Características</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {URINE_CHARACTERISTICS.map(c => {
                const active = urineCharacteristics.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => toggleUrineChar(c.key)}
                    style={{
                      padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, transition: 'all 0.1s',
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
        <span style={sectionLabel}>Notas</span>
        <textarea
          id="fluxia-notes-area"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe tus notas aquí..."
          rows={3}
          style={{
            width: '100%', borderRadius: 8, padding: '8px 10px',
            fontSize: 14, color: D.text, backgroundColor: D.bg,
            border: 'none', outline: 'none', resize: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '17px 0', borderRadius: 99, border: 'none',
          cursor: 'pointer', backgroundColor: D.primary, color: D.primaryText,
          fontSize: 18, fontWeight: 800, marginTop: 6,
        }}
      >
        Registrar
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
