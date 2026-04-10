import { getBristolHealthLabel, getBristolHealthColor } from '../lib/bristol';
import { D } from '../lib/design';

interface BristolPickerProps {
  value: number | null;
  onChange: (type: number | null) => void;
  restrictedTypes?: number[];
}

// SVG illustrations for each Bristol type
function BristolIcon({ type, inverted }: { type: number; inverted: boolean }) {
  const fill = inverted ? D.primaryText : D.text;
  const whiteLine = inverted ? 'rgba(0,0,0,0.35)' : D.card;

  switch (type) {
    case 1:
      return (
        <svg width="34" height="26" viewBox="0 0 34 26" fill={fill}>
          <circle cx="7" cy="9" r="6"/>
          <circle cx="19" cy="7" r="6"/>
          <circle cx="29" cy="11" r="5"/>
          <circle cx="13" cy="20" r="5.5"/>
          <circle cx="25" cy="20" r="4.5"/>
        </svg>
      );
    case 2:
      return (
        <svg width="34" height="20" viewBox="0 0 34 20" fill={fill}>
          <path d="M4 13 Q7 7 10 13 Q13 7 17 13 Q21 7 24 13 Q27 7 30 13 C31 15 31 17 30 17 C21 18 13 18 4 17 C3 17 3 15 4 13Z"/>
        </svg>
      );
    case 3:
      return (
        <svg width="34" height="20" viewBox="0 0 34 20" fill={fill}>
          <path d="M3 7 Q17 2 31 7 L31 14 Q17 19 3 14Z"/>
          <line x1="12" y1="7" x2="10" y2="14" stroke={whiteLine} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="22" y1="7" x2="20" y2="14" stroke={whiteLine} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      );
    case 4:
      return (
        <svg width="34" height="18" viewBox="0 0 34 18" fill={fill}>
          <path d="M3 7 C11 3 23 3 31 7 L31 12 C23 16 11 16 3 12Z"/>
        </svg>
      );
    case 5:
      return (
        <svg width="34" height="26" viewBox="0 0 34 26" fill={fill}>
          <ellipse cx="9" cy="10" rx="7.5" ry="9"/>
          <ellipse cx="25" cy="10" rx="7.5" ry="9"/>
          <ellipse cx="17" cy="21" rx="6.5" ry="5"/>
        </svg>
      );
    case 6:
      return (
        <svg width="34" height="26" viewBox="0 0 34 26" fill={fill}>
          <path d="M3 13 Q5 5 11 8 Q15 2 21 7 Q26 2 31 8 Q35 14 31 19 Q27 24 21 23 Q16 26 11 23 Q5 22 2 17Z"/>
        </svg>
      );
    case 7:
      return (
        <svg width="34" height="24" viewBox="0 0 34 24" fill="none"
          stroke={fill} strokeWidth="2.5" strokeLinecap="round">
          <path d="M3 5 Q9 1 17 5 Q25 9 31 5"/>
          <path d="M3 12 Q9 8 17 12 Q25 16 31 12"/>
          <path d="M3 19 Q9 15 17 19 Q25 23 31 19"/>
        </svg>
      );
    default:
      return null;
  }
}

const DESCRIPTIONS = [
  'Trozos duros',
  'Salchicha grumosa',
  'Grietas en superficie',
  'Lisa y suave',
  'Trozos blandos',
  'Pastosa',
  'Líquida',
];

export default function BristolPicker({ value, onChange, restrictedTypes }: BristolPickerProps) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((type) => {
          const isSelected = value === type;
          const isLocked = restrictedTypes ? !restrictedTypes.includes(type) : false;
          return (
            <button
              key={type}
              onClick={() => !isLocked && onChange(isSelected ? null : type)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 4,
                borderRadius: 10, padding: '8px 4px 6px',
                border: 'none', cursor: isLocked ? 'default' : 'pointer',
                backgroundColor: isSelected ? D.primary : D.chip,
                opacity: isLocked ? 0.3 : 1,
                transition: 'all 0.15s',
              }}
            >
              <BristolIcon type={type} inverted={isSelected} />
              <span style={{
                fontSize: 9, fontWeight: 900, lineHeight: 1,
                color: isSelected ? D.primaryText : D.textMuted,
              }}>
                {type}
              </span>
            </button>
          );
        })}
      </div>

      {value && (
        <div style={{
          marginTop: 8, borderRadius: 10, padding: '8px 12px',
          backgroundColor: D.chip,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BristolIcon type={value} inverted={false} />
            <span style={{ fontSize: 12, fontWeight: 700, color: D.text }}>
              Tipo {value} — {DESCRIPTIONS[value - 1]}
            </span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 900, padding: '3px 8px',
            borderRadius: 99, color: 'white',
            backgroundColor: getBristolHealthColor(value),
          }}>
            {getBristolHealthLabel(value)}
          </span>
        </div>
      )}
    </div>
  );
}
