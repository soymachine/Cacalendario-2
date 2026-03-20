import { BRISTOL_SCALE, getBristolHealthLabel, getBristolHealthColor } from '../lib/bristol';

interface BristolPickerProps {
  value: number | null;
  onChange: (type: number | null) => void;
  theme: {
    text: string;
    glass: string;
    id: string;
  };
  restrictedTypes?: number[]; // If set, only these types are selectable
}

export default function BristolPicker({ value, onChange, theme, restrictedTypes }: BristolPickerProps) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {BRISTOL_SCALE.map((b) => {
          const isSelected = value === b.type;
          const isLocked = restrictedTypes ? !restrictedTypes.includes(b.type) : false;
          return (
            <button
              key={b.type}
              onClick={() => !isLocked && onChange(isSelected ? null : b.type)}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-2 px-1 transition-all active:scale-95 ${isLocked ? 'opacity-35' : ''}`}
              style={{
                backgroundColor: isSelected ? theme.text : theme.glass,
              }}
            >
              <span className="text-xl">{isLocked ? '🔒' : b.emoji}</span>
              <span
                className="text-[9px] font-black leading-tight"
                style={{
                  color: isSelected
                    ? (theme.id === 'night' ? '#1a1a2e' : 'white')
                    : theme.text,
                }}
              >
                {b.type}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected info */}
      {value && (
        <div
          className="mt-2 rounded-lg px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: theme.glass }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{BRISTOL_SCALE[value - 1].emoji}</span>
            <div>
              <span className="text-xs font-bold" style={{ color: theme.text }}>
                {BRISTOL_SCALE[value - 1].description}
              </span>
            </div>
          </div>
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: getBristolHealthColor(value),
              color: 'white',
            }}
          >
            {getBristolHealthLabel(value)}
          </span>
        </div>
      )}
    </div>
  );
}
