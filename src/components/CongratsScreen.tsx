import { formatDateForDisplay } from '../lib/dates';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';

interface CongratsScreenProps {
  date: string;
  time: string;
  onClose: () => void;
}

export default function CongratsScreen({ date, time, onClose }: CongratsScreenProps) {
  const { emoji, theme } = usePreferences();
  const dayText = formatDateForDisplay(date);

  return (
    <div className="fixed inset-0 z-50 flex justify-center" style={{ backgroundColor: theme.main }}>
    <div className="w-full max-w-md flex flex-col min-h-screen relative">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill={theme.text}/>
          <path d="M8 8L16 16M16 8L8 16" stroke={theme.id === 'night' ? '#1a1a2e' : 'white'} strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      <div className="flex-1 flex flex-col justify-between px-10 pt-24 pb-16">
        {/* Title */}
        <div>
          <p className="text-3xl leading-tight" style={{ color: theme.text }}>
            ¡Enhorabuena,<br />has obrado!
          </p>
        </div>

        {/* Big poop emoji */}
        <div className="flex justify-center py-8">
          {emoji.char === 'svg' ? (
            <img src={asset('/poop-big.svg')} alt="Happy poop" className="w-64 h-64" />
          ) : (
            <span className="text-[200px] leading-none">{emoji.char}</span>
          )}
        </div>

        {/* Date and time */}
        <div>
          <p className="text-sm font-black" style={{ color: theme.text }}>DÍA</p>
          <p className="text-3xl mt-1" style={{ color: theme.text }}>{dayText}</p>
          <p className="text-sm font-black mt-4" style={{ color: theme.text }}>HORA</p>
          <p className="text-3xl mt-1" style={{ color: theme.text }}>{time}</p>
        </div>
      </div>
    </div>
    </div>
  );
}
