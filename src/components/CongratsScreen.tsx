import { useState } from 'react';
import { formatDateForDisplay } from '../lib/dates';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { D } from '../lib/design';

interface CongratsScreenProps {
  date: string;
  time: string;
  entryType: 'poop' | 'urine';
  entryId: string;
  onUpdateDateTime: (newDate: string, newTime: string) => void;
  onClose: () => void;
}

function EditIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill={D.chip} />
      <path d="M13 23L14.5 19L22 11.5L24.5 14L17 21.5L13 23Z" stroke={D.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M20.5 13L23 15.5" stroke={D.text} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export default function CongratsScreen({ date, time, entryType, entryId: _entryId, onUpdateDateTime, onClose }: CongratsScreenProps) {
  const { emoji } = usePreferences();
  const isPoop = entryType === 'poop';

  const [currentDate, setCurrentDate] = useState(date);
  const [currentTime, setCurrentTime] = useState(time);
  const [editingDate, setEditingDate] = useState(false);
  const [editingTime, setEditingTime] = useState(false);

  const dayText = formatDateForDisplay(currentDate);

  const handleDateChange = (val: string) => {
    if (!val) return;
    setCurrentDate(val);
    setEditingDate(false);
    onUpdateDateTime(val, currentTime);
  };

  const handleTimeChange = (val: string) => {
    if (!val) return;
    setCurrentTime(val);
    setEditingTime(false);
    onUpdateDateTime(currentDate, val);
  };

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
              {/* Day */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, margin: '0 0 4px', letterSpacing: 0.5 }}>DÍA</p>
                {editingDate ? (
                  <input
                    type="date"
                    defaultValue={currentDate}
                    max={new Date().toISOString().slice(0, 10)}
                    autoFocus
                    onBlur={(e) => handleDateChange(e.target.value || currentDate)}
                    onChange={(e) => { if (e.target.value) handleDateChange(e.target.value); }}
                    style={{
                      fontSize: 16, background: 'transparent', border: 'none',
                      borderBottom: `2px solid ${D.primary}`, outline: 'none',
                      color: D.text, fontFamily: 'inherit', fontWeight: 700, width: '100%',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: 0 }}>{dayText}</p>
                    <button
                      onClick={() => setEditingDate(true)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    >
                      <EditIcon />
                    </button>
                  </div>
                )}
              </div>

              {/* Time */}
              <div style={{ flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, margin: '0 0 4px', letterSpacing: 0.5 }}>HORA</p>
                {editingTime ? (
                  <input
                    type="time"
                    defaultValue={currentTime}
                    autoFocus
                    onBlur={(e) => handleTimeChange(e.target.value || currentTime)}
                    onChange={(e) => { if (e.target.value) handleTimeChange(e.target.value); }}
                    style={{
                      fontSize: 16, background: 'transparent', border: 'none',
                      borderBottom: `2px solid ${D.primary}`, outline: 'none',
                      color: D.text, fontFamily: 'inherit', fontWeight: 700,
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: 0 }}>{currentTime}</p>
                    <button
                      onClick={() => setEditingTime(true)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    >
                      <EditIcon />
                    </button>
                  </div>
                )}
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
