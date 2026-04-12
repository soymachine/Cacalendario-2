import { useState } from 'react';
import { formatDateForDisplay, formatTime } from '../lib/dates';
import { saveEntry, deleteEntry, type PoopEntry } from '../lib/storage';
import { usePreferences } from '../lib/usePreferences';
import { getDoctorHiddenFields } from '../lib/preferences';
import { asset } from '../lib/config';
import BristolPicker from './BristolPicker';
import { D } from '../lib/design';

interface EditScreenProps {
  entry: PoopEntry;
  onClose: () => void;
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
  const { emoji } = usePreferences();
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

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 900, color: D.textMuted,
    letterSpacing: 0.5, display: 'block', marginBottom: 8,
  };

  const chipActive: React.CSSProperties = { backgroundColor: D.primary, color: D.primaryText };
  const chipInactive: React.CSSProperties = { backgroundColor: D.chip, color: D.chipText };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: D.bg, overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: 480, height: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 20, right: 16, zIndex: 10,
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill={D.primary} />
            <path d="M8 8L16 16M16 8L8 16" stroke={D.primaryText} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Scrollable content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '60px 16px 8px' }}>

          {/* Day */}
          <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <span style={sectionLabel}>DÍA</span>
            <p style={{ fontSize: 18, fontWeight: 700, color: D.text, margin: '0 0 6px' }}>{dayText}</p>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
              backgroundColor: D.chip, color: D.chipText,
            }}>
              {isUrine ? '💧 Micción' : '💩 Deposición'}
            </span>
          </div>

          {/* Time */}
          <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
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
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <span style={sectionLabel}>¿QUÉ FORMA TENÍA?</span>
                <p style={{ fontSize: 11, color: D.textMuted, marginBottom: 10, marginTop: -4 }}>
                  Escala de Bristol — selecciona el tipo más parecido
                </p>
                <BristolPicker value={bristol} onChange={setBristol} />
              </div>
            )}

            {show('color') && (
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <span style={sectionLabel}>COLOR</span>
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
                        transition: 'box-shadow 0.1s', cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {show('floats') && (
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <span style={sectionLabel}>¿FLOTA?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {FLOAT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFloats(floats === opt.value ? null : opt.value)}
                      style={{
                        flex: 1, padding: '10px 4px 8px', borderRadius: 10,
                        border: floats === opt.value ? `2px solid ${D.primary}` : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        fontSize: 12, fontWeight: 700, transition: 'all 0.1s',
                        backgroundColor: D.chip,
                        color: D.text,
                      }}
                    >
                      <img src={asset(opt.img)} alt={opt.label} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {show('quantity') && (
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <span style={sectionLabel}>CANTIDAD — <span style={{ fontWeight: 400 }}>{quantityLabel} ({quantity})</span></span>
                <input
                  type="range" min={0} max={100} value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: D.primary }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 8 }}>
                  <img src={asset('/Ligero-icon.svg')} alt="Ligero" style={{ width: 20, height: 20, objectFit: 'contain', opacity: 0.5 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: D.text }}>{quantityLabel}</span>
                  <img src={asset('/Pesado-icon.svg')} alt="Pesado" style={{ width: 20, height: 20, objectFit: 'contain', opacity: 0.5 }} />
                </div>
              </div>
            )}

            {show('duration') && (
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
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
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
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
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
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
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
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
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <span style={sectionLabel}>COLOR</span>
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
              <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
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
          <div style={{ backgroundColor: D.card, borderRadius: 14, padding: 14, marginBottom: 10 }}>
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
        </div>

        {/* Action buttons */}
        <div style={{ flexShrink: 0, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 14, color: D.text, margin: 0 }}>¿Seguro que quieres eliminar este registro?</p>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 50,
                    border: `2px solid ${D.border}`, backgroundColor: 'transparent',
                    color: D.text, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 50, border: 'none',
                    backgroundColor: D.danger, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  padding: '12px 16px', borderRadius: 50, border: 'none',
                  backgroundColor: D.dangerBg, color: D.danger, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                🗑️ eliminar
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 50, border: 'none',
                  backgroundColor: D.primary, color: D.primaryText, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                }}
              >
                guardar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
