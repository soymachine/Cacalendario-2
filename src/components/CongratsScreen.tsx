import { formatDateForDisplay } from '../lib/dates';
import { asset } from '../lib/config';

interface CongratsScreenProps {
  date: string;
  time: string;
  onClose: () => void;
}

export default function CongratsScreen({ date, time, onClose }: CongratsScreenProps) {
  const dayText = formatDateForDisplay(date);

  return (
    <div className="fixed inset-0 bg-salmon flex flex-col min-h-screen z-50">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#231f20"/>
          <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      <div className="flex-1 flex flex-col justify-between px-10 pt-24 pb-16">
        {/* Title */}
        <div>
          <p className="text-3xl text-black leading-tight">
            ¡Enhorabuena,<br />has obrado!
          </p>
        </div>

        {/* Big poop emoji */}
        <div className="flex justify-center py-8">
          <img src={asset('/poop-big.svg')} alt="Happy poop" className="w-64 h-64" />
        </div>

        {/* Date and time */}
        <div>
          <p className="text-sm font-black text-black">DÍA</p>
          <p className="text-3xl text-black mt-1">{dayText}</p>
          <p className="text-sm font-black text-black mt-4">HORA</p>
          <p className="text-3xl text-black mt-1">{time}</p>
        </div>
      </div>
    </div>
  );
}
