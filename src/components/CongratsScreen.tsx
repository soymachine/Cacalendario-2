import { formatDateForDisplay } from '../lib/dates';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getBristolType, getBristolHealthLabel, getBristolHealthColor } from '../lib/bristol';

interface CongratsScreenProps {
  date: string;
  time: string;
  bristol: number | null;
  floats: boolean | null;
  onClose: () => void;
}

export default function CongratsScreen({ date, time, bristol, floats, onClose }: CongratsScreenProps) {
  const { emoji, theme } = usePreferences();
  const dayText = formatDateForDisplay(date);
  const bristolType = getBristolType(bristol);
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  return (
    <div className="fixed inset-0 z-50 flex justify-center" style={{ backgroundColor: theme.main }}>
    <div className="w-full max-w-md flex flex-col min-h-screen relative">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill={theme.text}/>
          <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      <div className="flex-1 flex flex-col justify-between px-10 pt-16 pb-12">
        {/* Title */}
        <div>
          <p className="text-3xl leading-tight" style={{ color: theme.text }}>
            ¡Enhorabuena,<br />has obrado!
          </p>
        </div>

        {/* Smaller poop emoji */}
        <div className="flex justify-center py-4">
          {emoji.char === 'svg' ? (
            <img src={asset('/poop-big.svg')} alt="Happy poop" className="w-40 h-40" />
          ) : (
            <span className="text-[120px] leading-none">{emoji.char}</span>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-3">
          {/* Date & Time row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-xs font-black" style={{ color: `${theme.text}99` }}>DÍA</p>
              <p className="text-lg mt-0.5" style={{ color: theme.text }}>{dayText}</p>
            </div>
            <div>
              <p className="text-xs font-black" style={{ color: `${theme.text}99` }}>HORA</p>
              <p className="text-lg mt-0.5" style={{ color: theme.text }}>{time}</p>
            </div>
          </div>

          {/* Bristol */}
          {bristolType && (
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: theme.glass }}
            >
              <span className="text-2xl">{bristolType.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: theme.text }}>
                  {bristolType.label} — {bristolType.description}
                </p>
                <span
                  className="inline-block text-xs font-bold mt-1 px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: getBristolHealthColor(bristolType.type) }}
                >
                  {getBristolHealthLabel(bristolType.type)}
                </span>
              </div>
            </div>
          )}

          {/* Floats */}
          {floats !== null && floats !== undefined && (
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: theme.glass }}
            >
              <span className="text-2xl">{floats ? '🫧' : '⬇️'}</span>
              <p className="text-sm font-bold" style={{ color: theme.text }}>
                {floats ? 'Flota en el agua' : 'Se hunde'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
