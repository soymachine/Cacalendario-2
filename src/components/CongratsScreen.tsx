import { formatDateForDisplay } from '../lib/dates';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getBristolType, getBristolHealthLabel, getBristolHealthColor } from '../lib/bristol';
import { D } from '../lib/design';

interface CongratsScreenProps {
  date: string;
  time: string;
  entryType: 'poop' | 'urine';
  onClose: () => void;
}

export default function CongratsScreen({ date, time, entryType, onClose }: CongratsScreenProps) {
  const { emoji } = usePreferences();
  const dayText = formatDateForDisplay(date);
  const isPoop = entryType === 'poop';

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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 32px 48px' }}>
          {/* Title */}
          <div>
            <p style={{ fontSize: 32, fontWeight: 900, color: D.text, lineHeight: 1.2, margin: 0 }}>
              {isPoop ? <>¡Enhorabuena,<br />has obrado!</> : <>¡Registro<br />guardado!</>}
            </p>
          </div>

          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            {isPoop ? (
              emoji.char === 'svg' ? (
                <img src={asset('/poop-big.svg')} alt="Happy poop" style={{ width: 160, height: 160 }} />
              ) : (
                <span style={{ fontSize: 120, lineHeight: 1 }}>{emoji.char}</span>
              )
            ) : (
              <span style={{ fontSize: 120, lineHeight: 1 }}>💧</span>
            )}
          </div>

          {/* Summary card */}
          <div style={{ backgroundColor: D.card, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Date & Time */}
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, margin: '0 0 2px', letterSpacing: 0.5 }}>DÍA</p>
                <p style={{ fontSize: 18, color: D.text, margin: 0 }}>{dayText}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, margin: '0 0 2px', letterSpacing: 0.5 }}>HORA</p>
                <p style={{ fontSize: 18, color: D.text, margin: 0 }}>{time}</p>
              </div>
            </div>

            {/* Type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: D.bg, borderRadius: 10, padding: '8px 12px' }}>
              <span style={{ fontSize: 20 }}>{isPoop ? '💩' : '💧'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: D.text }}>
                {isPoop ? 'Deposición registrada' : 'Micción registrada'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
