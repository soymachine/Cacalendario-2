import { useState } from 'react';
import { formatDateForDisplay, formatTime, toDateKey } from '../lib/dates';
import { saveEntry, generateEntryId } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getDoctorHiddenFields, getDoctorImage, getDoctorEntryTypeMode } from '../lib/preferences';
import BristolPicker from './BristolPicker';
import { D } from '../lib/design';

function PoopSwitchIcon({ color }: { color: string }) {
  return (
    <svg width="38" height="38" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.8 87.61C37.89 87.61 32.15 86.45 26.75 84.17C21.53 81.96 16.85 78.81 12.83 74.78C8.81002 70.76 5.65 66.07 3.44 60.86C1.16 55.46 0 49.72 0 43.81C0 37.9 1.16 32.16 3.44 26.76C5.65 21.54 8.80002 16.86 12.83 12.84C16.85 8.82003 21.54 5.66001 26.75 3.45001C32.15 1.17001 37.89 0.0100098 43.8 0.0100098C49.71 0.0100098 55.45 1.17001 60.85 3.45001C66.07 5.66001 70.75 8.81003 74.77 12.84C78.79 16.86 81.95 21.55 84.16 26.76C86.45 32.16 87.6 37.9 87.6 43.81C87.6 49.72 86.44 55.46 84.16 60.86C81.95 66.08 78.8 70.76 74.77 74.78C70.75 78.8 66.06 81.96 60.85 84.17C55.45 86.45 49.71 87.61 43.8 87.61ZM43.8 5.13C33.47 5.13 23.76 9.15002 16.45 16.46C9.15001 23.76 5.12003 33.48 5.12003 43.81C5.12003 54.14 9.14001 63.85 16.45 71.16C23.75 78.46 33.47 82.49 43.8 82.49C54.13 82.49 63.84 78.47 71.15 71.16C78.45 63.86 82.48 54.14 82.48 43.81C82.48 33.48 78.46 23.77 71.15 16.46C63.85 9.16002 54.13 5.13 43.8 5.13Z" fill={color}/>
      <path d="M66.73 49.18C67.47 47.75 67.87 46.15 67.87 44.5C67.87 38.94 63.39 34.4 57.86 34.3C59.62 31.9 60.52 28.96 60.37 25.93C60.18 22.05 58.28 18.4901 55.01 16.0401L45.77 10.5301C45.19 10.1801 44.46 10.17 43.87 10.51C43.28 10.84 42.91 11.47 42.91 12.15V17.4201C42.91 20.3601 40.52 22.74 37.59 22.74C35.13 22.74 32.83 23.7 31.11 25.45C29.39 27.2 28.46 29.5101 28.49 31.9701C28.5 32.7901 28.66 33.59 28.96 34.33C23.8 34.83 19.75 39.1901 19.75 44.4801C19.75 46.1401 20.14 47.7301 20.89 49.1601C16.62 50.7301 13.6 54.83 13.6 59.56C13.6 65.7 18.59 70.69 24.73 70.69H62.91C69.05 70.69 74.04 65.7 74.04 59.56C74.04 54.83 71.02 50.7301 66.75 49.1601L66.73 49.18Z" fill={color}/>
      <path d="M34.8657 48.5443C36.8638 47.9392 37.9929 45.829 37.3878 43.8309C36.7826 41.8329 34.6724 40.7038 32.6744 41.3089C30.6763 41.914 29.5472 44.0243 30.1523 46.0223C30.7575 48.0204 32.8677 49.1495 34.8657 48.5443Z" fill={color}/>
      <path d="M53.88 48.76C55.9676 48.76 57.66 47.0677 57.66 44.98C57.66 42.8924 55.9676 41.2 53.88 41.2C51.7923 41.2 50.1 42.8924 50.1 44.98C50.1 47.0677 51.7923 48.76 53.88 48.76Z" fill={color}/>
      <path d="M55.77 51.71H31.85C31.25 51.71 30.68 51.99 30.33 52.48C29.97 52.96 29.87 53.59 30.05 54.16C31.94 60.23 37.47 64.32 43.82 64.32C50.17 64.32 55.7 60.24 57.59 54.16C57.77 53.59 57.66 52.96 57.31 52.48C56.95 52 56.39 51.71 55.79 51.71H55.77Z" fill={color}/>
    </svg>
  );
}

function UrineSwitchIcon({ color }: { color: string }) {
  return (
    <svg width="38" height="38" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.8101 87.61C37.9001 87.61 32.16 86.45 26.76 84.17C21.54 81.96 16.86 78.81 12.84 74.78C8.82003 70.76 5.66001 66.07 3.45001 60.86C1.17001 55.46 0.0100098 49.72 0.0100098 43.81C0.0100098 37.9 1.17001 32.16 3.45001 26.76C5.66001 21.54 8.81003 16.86 12.84 12.84C16.86 8.82003 21.55 5.66001 26.76 3.45001C32.16 1.17001 37.9001 0.0100098 43.8101 0.0100098C49.7201 0.0100098 55.46 1.17001 60.86 3.45001C66.08 5.66001 70.76 8.81003 74.78 12.84C78.8 16.86 81.96 21.55 84.17 26.76C86.46 32.16 87.61 37.9 87.61 43.81C87.61 49.72 86.45 55.46 84.17 60.86C81.96 66.08 78.81 70.76 74.78 74.78C70.76 78.8 66.07 81.96 60.86 84.17C55.46 86.45 49.7201 87.61 43.8101 87.61ZM43.8101 5.13C33.4801 5.13 23.77 9.15002 16.46 16.46C9.16002 23.76 5.13 33.48 5.13 43.81C5.13 54.14 9.15002 63.85 16.46 71.16C23.76 78.46 33.4801 82.49 43.8101 82.49C54.1401 82.49 63.85 78.47 71.16 71.16C78.46 63.86 82.4901 54.14 82.4901 43.81C82.4901 33.48 78.47 23.77 71.16 16.46C63.86 9.16002 54.1401 5.13 43.8101 5.13Z" fill={color}/>
      <path d="M55.3101 74.21C52.5301 74.21 49.9101 73.19 47.9201 71.35L47.7501 71.19C45.5801 69.18 42.0801 69.19 39.9201 71.2C39.9201 71.2 39.92 71.2 39.91 71.21C37.92 73.08 35.2801 74.11 32.4801 74.12H32.47C29.67 74.12 27.0401 73.09 25.0401 71.23C24.0001 70.26 22.6101 69.72 21.1201 69.72C19.6301 69.72 18.2301 70.26 17.1901 71.24L17.08 71.34C16.14 72.22 15.04 72.93 13.83 73.42C12.52 73.96 11.0201 73.33 10.4801 72.02C9.94006 70.71 10.57 69.21 11.88 68.67C12.51 68.41 13.08 68.05 13.57 67.59L13.6801 67.49C15.6701 65.62 18.3101 64.59 21.1201 64.59C23.9301 64.59 26.5501 65.62 28.5501 67.48C30.7101 69.5 34.23 69.5 36.39 67.48C36.39 67.48 36.39 67.48 36.4 67.47C38.39 65.6 41.0201 64.57 43.8101 64.56H43.84C46.62 64.56 49.2401 65.58 51.2301 67.42L51.4 67.58C53.57 69.59 57.0901 69.58 59.2401 67.56C59.2401 67.56 59.25 67.55 59.26 67.54L59.32 67.49C61.32 65.62 63.96 64.59 66.76 64.59C69.56 64.59 72.1901 65.61 74.1801 67.48H74.1901C74.1901 67.48 74.2201 67.52 74.2301 67.53C74.7001 67.97 75.2501 68.33 75.8601 68.59C77.1701 69.14 77.77 70.65 77.22 71.95C76.67 73.26 75.1601 73.86 73.8601 73.31C72.7001 72.82 71.6501 72.14 70.7401 71.29H70.7301C70.7301 71.29 70.7001 71.25 70.6901 71.24C68.5201 69.2 65 69.21 62.83 71.24C62.83 71.24 62.8201 71.25 62.8101 71.26L62.7501 71.31C60.7601 73.17 58.1401 74.2 55.3501 74.21H55.32H55.3101Z" fill={color}/>
      <path d="M9.63001 60.55C7.25001 60.55 4.85001 59.78 2.88001 58.23C1.77001 57.35 1.57001 55.74 2.45001 54.63C3.33001 53.52 4.94005 53.32 6.05005 54.2C8.24005 55.92 11.5401 55.79 13.5501 53.89L13.66 53.79C15.65 51.92 18.29 50.89 21.1 50.89C23.91 50.89 26.53 51.92 28.53 53.78C30.69 55.8 34.2101 55.8 36.3701 53.78C36.3701 53.78 36.37 53.78 36.38 53.77C38.37 51.9 41 50.87 43.79 50.86H43.82C46.6 50.86 49.22 51.88 51.21 53.72L51.38 53.88C53.55 55.89 57.07 55.88 59.22 53.86C59.22 53.86 59.2301 53.85 59.2401 53.84L59.3 53.79C61.3 51.92 63.94 50.89 66.73 50.89C69.52 50.89 72.16 51.91 74.15 53.78H74.16C74.16 53.78 74.19 53.82 74.21 53.83C76.2 55.7 79.36 55.87 81.58 54.24C82.02 53.91 82.56 53.74 83.1 53.74C84.52 53.74 85.67 54.89 85.67 56.31C85.67 57.19 85.2301 57.96 84.5601 58.42C80.4001 61.44 74.47 61.09 70.72 57.6H70.71C70.71 57.6 70.68 57.56 70.66 57.55C68.49 55.51 64.97 55.52 62.8 57.55C62.8 57.55 62.79 57.56 62.78 57.57L62.72 57.62C60.73 59.48 58.11 60.51 55.32 60.52C52.53 60.53 49.89 59.51 47.89 57.66L47.72 57.5C45.55 55.49 42.04 55.5 39.89 57.51C39.89 57.51 39.89 57.51 39.88 57.52C37.89 59.39 35.25 60.42 32.45 60.43H32.4401C29.6401 60.43 27.01 59.4 25.01 57.54C23.97 56.57 22.58 56.03 21.09 56.03C19.6 56.03 18.2 56.57 17.16 57.55L17.0501 57.65C14.9901 59.58 12.3101 60.56 9.62006 60.56L9.63001 60.55Z" fill={color}/>
      <path d="M43.8101 45.78C40.5201 45.78 37.3901 44.69 35.0001 42.71C32.2801 40.46 30.7001 37.26 30.4401 33.46C29.6401 21.79 41.62 11.34 42.13 10.9C43.09 10.07 44.52 10.07 45.48 10.9C45.99 11.34 57.9701 21.79 57.1701 33.46C56.9101 37.26 55.3301 40.45 52.6101 42.71C50.2201 44.69 47.0901 45.78 43.8001 45.78H43.8101ZM35.5601 33.11C35.9201 38.32 39.9601 40.65 43.8101 40.65C47.6601 40.65 51.7001 38.32 52.0601 33.11C52.3801 28.48 49.75 23.82 47.48 20.72C46.17 18.93 44.8301 17.44 43.8101 16.4C42.8001 17.44 41.45 18.93 40.14 20.72C37.88 23.82 35.2501 28.48 35.5601 33.11Z" fill={color}/>
    </svg>
  );
}

interface RegisterScreenProps {
  date?: string | null;
  isTab?: boolean;
  onClose?: () => void;
  onSuccess: (date: string, time: string, entryType: 'poop' | 'urine', entryId: string) => void;
}

const FLOAT_OPTIONS = [
  { label: 'Flota', value: 'floats' as const, img: '/Flota_2.png' },
  { label: 'No flota', value: 'sinks' as const, img: '/Flota_1.png' },
  { label: 'Ambos', value: 'both' as const, img: '/Flota_3.png' },
];

const COLOR_OPTIONS = [
  { hex: '#1A1A1A', label: 'Negro' },
  { hex: '#3B1F0E', label: 'Marrón oscuro' },
  { hex: '#7B4226', label: 'Marrón' },
  { hex: '#C4844A', label: 'Marrón claro' },
  { hex: '#D4B84A', label: 'Amarillo' },
  { hex: '#C0392B', label: 'Rojo' },
  { hex: '#9E9E9E', label: 'Gris' },
  { hex: '#F5F5F5', label: 'Blanco' },
];

const URINE_COLOR_OPTIONS = [
  { hex: '#FDFBEA', label: 'Muy clara' },
  { hex: '#FFF59D', label: 'Pálida' },
  { hex: '#FFE033', label: 'Amarillo claro' },
  { hex: '#FFC107', label: 'Amarillo' },
  { hex: '#FF8F00', label: 'Ámbar' },
  { hex: '#5D4037', label: 'Marrón oscuro' },
  { hex: '#E53935', label: 'Rojizo' },
];

const URINE_TYPE_OPTIONS = [
  { label: 'Voluntaria', value: 'voluntary' as const },
  { label: 'Escape sin aviso', value: 'involuntary_escape' as const },
  { label: 'Goteo continuo', value: 'involuntary_drip' as const },
];

const URINE_CHARACTERISTICS = [
  { key: 'blood', label: 'Sangre' },
  { key: 'odor', label: 'Olor' },
  { key: 'pain', label: 'Dolor' },
  { key: 'turbid', label: 'Turbio' },
];

const DURATION_OPTIONS = [
  { label: '<3 min', value: 'short' as const },
  { label: '3-5 min', value: 'medium' as const },
  { label: '>5 min', value: 'long' as const },
];

const FECES_TEXTURE_OPTIONS = [
  { label: 'Dura/Seca', value: 'hard' as const },
  { label: 'Normal', value: 'normal' as const },
  { label: 'Blanda', value: 'soft' as const },
  { label: 'Suelta', value: 'loose' as const },
  { label: 'Líquida', value: 'liquid' as const },
  { label: 'Aceitosa', value: 'oily' as const },
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
  { key: 'gases', label: 'Gases' },
  { key: 'laxative_use', label: 'Uso de laxantes' },
  { key: 'astringent_agents', label: 'Agentes astringentes' },
  { key: 'fever', label: 'Fiebre' },
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
  const [fecesTexture, setFecesTexture] = useState<'hard' | 'normal' | 'soft' | 'loose' | 'liquid' | 'oily' | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [weightLoss, setWeightLoss] = useState(false);

  // Urine fields
  const [urineType, setUrineType] = useState<'voluntary' | 'involuntary_escape' | 'involuntary_drip' | null>(null);
  const [urineQuantity, setUrineQuantity] = useState(0);
  const [urineColor, setUrineColor] = useState<string | null>(null);
  const [urineCharacteristics, setUrineCharacteristics] = useState<string[]>([]);
  const [urineUrgency, setUrineUrgency] = useState<number | null>(null);
  const [duringSleep, setDuringSleep] = useState<boolean | null>(null);

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
    const entryId = generateEntryId();
    const finalSymptoms = [...symptoms];
    if (weightLoss && !finalSymptoms.includes('weight_loss')) {
      finalSymptoms.push('weight_loss');
    } else if (!weightLoss && finalSymptoms.includes('weight_loss')) {
      finalSymptoms.splice(finalSymptoms.indexOf('weight_loss'), 1);
    }
    saveEntry({
      id: entryId,
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
      feces_texture: isUrine ? null : fecesTexture,
      symptoms: isUrine ? [] : finalSymptoms,
      urine_type: isUrine ? urineType : null,
      urine_quantity: isUrine ? urineQuantity : null,
      urine_color: isUrine ? urineColor : null,
      urine_characteristics: isUrine ? urineCharacteristics : [],
      urine_urgency: isUrine ? urineUrgency : null,
      during_sleep: isUrine ? duringSleep : null,
    });
    window.dispatchEvent(new Event('fluxia-updated'));
    onSuccess(targetDate, timeText, entryType, entryId);
  };

  const sectionCard: React.CSSProperties = {
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 10,
  };

  // Figma-aligned section label: larger, dark, bold
  const sectionLabel: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: D.secondary,
    display: 'block',
    marginBottom: 12,
  };

  const chipActive: React.CSSProperties = { backgroundColor: D.primary, color: D.primaryText };
  const chipInactive: React.CSSProperties = { backgroundColor: D.navBg, color: D.chipText };

  const content = (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: isTab ? '16px 16px 32px' : '60px 16px 16px' }}>

      {/* Logo (only in tab mode) */}
      {isTab && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <img src={getDoctorImage() || asset('/fluxia-logo.png')} alt="Fluxia" style={{ height: 90, objectFit: 'contain' }} />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: D.secondary, margin: 0 }}>
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
          backgroundColor: D.primary,
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
            <PoopSwitchIcon color={entryType === 'poop' ? D.primary : '#ffffff'} />
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
            <UrineSwitchIcon color={entryType === 'urine' ? D.primary : '#ffffff'} />
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
                      flex: 1, padding: '0px 0px 8px', borderRadius: 12,
                      border: isActive ? `2px solid ${D.primary}` : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 0.1s',
                      backgroundColor: D.navBg,
                      color: D.text,
                    }}
                  >
                    <img src={asset(opt.img)} alt={opt.label} style={{ width: 74, height: 74, objectFit: 'contain' }} />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isUrine && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Pérdida de peso</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'No', value: false },
                { label: 'Sí', value: true },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setWeightLoss(opt.value)}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, textAlign: 'center', transition: 'all 0.1s',
                    ...(weightLoss === opt.value ? { backgroundColor: D.primary, color: D.primaryText } : { backgroundColor: D.navBg, color: D.text }),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {show('color') && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Color</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.hex}
                  onClick={() => setColor(color === opt.hex ? null : opt.hex)}
                  title={opt.label}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: '50%', backgroundColor: opt.hex,
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

        {!isUrine && (
          <div style={sectionCard}>
            <span style={sectionLabel}>Textura</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FECES_TEXTURE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFecesTexture(fecesTexture === opt.value ? null : opt.value)}
                  style={{
                    padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.1s',
                    ...(fecesTexture === opt.value ? chipActive : chipInactive),
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

        <div style={sectionCard}>
          <span style={sectionLabel}>Nivel de Urgencia</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setUrineUrgency(urineUrgency === n ? null : n)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 700, transition: 'all 0.1s',
                  ...(urineUrgency === n ? chipActive : chipInactive),
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: D.secondary, opacity: 0.6 }}>
            <span>Sin urgencia</span>
            <span>Urgencia extrema</span>
          </div>
        </div>

        <div style={sectionCard}>
          <span style={sectionLabel}>¿Durante el sueño?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {([{ label: 'Sí', value: true }, { label: 'No', value: false }] as const).map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setDuringSleep(duringSleep === value ? null : value)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, transition: 'all 0.1s',
                  ...(duringSleep === value ? chipActive : chipInactive),
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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
            fontSize: 14, color: D.text, backgroundColor: D.card,
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
