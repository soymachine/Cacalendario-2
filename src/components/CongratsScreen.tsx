import { formatDateForDisplay } from '../lib/dates';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { D } from '../lib/design';

interface CongratsScreenProps {
  date: string;
  time: string;
  entryType: 'poop' | 'urine';
  onEdit: () => void;
  onClose: () => void;
}

export default function CongratsScreen({ date, time, entryType, onEdit, onClose }: CongratsScreenProps) {
  const { emoji } = usePreferences();
  const dayText = formatDateForDisplay(date); // "LUNES, 13 de abril"
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

        {/* Title */}
        <div style={{ padding: '88px 24px 0' }}>
          <p style={{ fontSize: 54, fontWeight: 900, color: D.text, lineHeight: 1.05, margin: 0 }}>
            Registro<br />correcto
          </p>
        </div>

        {/* Summary card */}
        <div style={{
          margin: '32px 16px 0',
          backgroundColor: D.card,
          borderRadius: 20,
          padding: '20px 20px 16px',
        }}>
          {/* Date & Time row */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, margin: '0 0 4px', letterSpacing: 0.8 }}>DÍA</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: D.text, margin: 0 }}>{dayText}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, margin: '0 0 4px', letterSpacing: 0.8 }}>HORA</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: D.text, margin: 0 }}>{time}</p>
            </div>
          </div>

          {/* Type badge row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            backgroundColor: D.chip, borderRadius: 12,
            padding: '12px 16px', marginBottom: 14,
          }}>
            {isPoop ? (
              emoji.char === 'svg'
                ? <img src={asset('/poop-small.svg')} alt="" style={{ width: 28, height: 28 }} />
                : <span style={{ fontSize: 22 }}>{emoji.char}</span>
            ) : (
              <span style={{ fontSize: 22 }}>💧</span>
            )}
            <span style={{ fontSize: 15, fontWeight: 800, color: D.text }}>
              {isPoop ? 'Deposición registrada' : 'Micción registrada'}
            </span>
          </div>

          {/* Edit button */}
          <button
            onClick={onEdit}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 99,
              border: `2px solid ${D.primary}`,
              backgroundColor: 'transparent', color: D.primary,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
            }}
          >
            Editar registro
          </button>
        </div>
      </div>
    </div>
  );
}
