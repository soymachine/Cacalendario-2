import { getBristolHealthLabel, getBristolHealthColor } from '../lib/bristol';
import { D } from '../lib/design';

interface BristolPickerProps {
  value: number | null;
  onChange: (type: number | null) => void;
  restrictedTypes?: number[];
}

export default function BristolPicker({ value, onChange, restrictedTypes }: BristolPickerProps) {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
                borderRadius: 12, padding: '10px 8px 8px',
                border: 'none', cursor: isLocked ? 'default' : 'pointer',
                backgroundColor: isSelected ? D.primary : D.chip,
                opacity: isLocked ? 0.3 : 1,
                transition: 'all 0.15s',
              }}
            >
              <img
                src={`/fluxia_${type}.svg`}
                alt={`Tipo ${type}`}
                style={{ width: 56, height: 56, objectFit: 'contain' }}
              />
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
            <img
              src={`/fluxia_${value}.svg`}
              alt={`Tipo ${value}`}
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: D.text }}>
              Tipo {value}
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
