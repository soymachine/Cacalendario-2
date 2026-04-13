import { useState, useEffect } from 'react';
import { formatDateForDisplay } from '../lib/dates';
import { getEntriesForDate, type PoopEntry } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getBristolType, getBristolHealthColor } from '../lib/bristol';
import { D } from '../lib/design';

interface DayDetailScreenProps {
  date: string;
  onClose: () => void;
  onAddEntry: (date: string) => void;
  onEditEntry: (entry: PoopEntry) => void;
}

export default function DayDetailScreen({ date, onClose, onAddEntry, onEditEntry }: DayDetailScreenProps) {
  const { emoji } = usePreferences();
  const [entries, setEntries] = useState<PoopEntry[]>([]);

  const refresh = () => setEntries(getEntriesForDate(date));

  useEffect(() => {
    refresh();
    window.addEventListener('fluxia-updated', refresh);
    return () => window.removeEventListener('fluxia-updated', refresh);
  }, [date]);

  const dayText = formatDateForDisplay(date);

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

        {/* Day header */}
        <div style={{ padding: '60px 24px 12px', flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, letterSpacing: 0.5, margin: '0 0 4px' }}>DÍA</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: D.secondary, margin: '0 0 4px' }}>{dayText}</p>
          <p style={{ fontSize: 13, color: D.textMuted, margin: 0 }}>
            {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>

        {/* Entries list */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map((entry) => {
              const bristolType = getBristolType(entry.bristol);
              return (
                <button
                  key={entry.id}
                  onClick={() => onEditEntry(entry)}
                  style={{
                    width: '100%', backgroundColor: D.card, borderRadius: 14,
                    padding: 14, border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Icon */}
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      {entry.entry_type === 'urine' ? (
                        <span style={{ fontSize: 26 }}>💧</span>
                      ) : emoji.char === 'svg' ? (
                        <img src={asset('/poop-small.svg')} alt="poop" style={{ width: 28, height: 28 }} />
                      ) : (
                        <span style={{ fontSize: 26 }}>{emoji.char}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: D.primary }}>{entry.time}</span>
                        {entry.entry_type === 'urine' ? (
                          <>
                            {entry.urine_type === 'voluntary' && (
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 99, backgroundColor: '#dbeafe', color: '#1d4ed8' }}>Voluntaria</span>
                            )}
                            {entry.urine_type === 'involuntary_escape' && (
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 99, backgroundColor: '#ffedd5', color: '#c2410c' }}>Escape</span>
                            )}
                            {entry.urine_type === 'involuntary_drip' && (
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 99, backgroundColor: '#ffedd5', color: '#c2410c' }}>Goteo</span>
                            )}
                            {entry.urine_quantity != null && entry.urine_quantity > 0 && (
                              <span style={{ fontSize: 12, color: D.textMuted }}>{entry.urine_quantity} ml</span>
                            )}
                          </>
                        ) : (
                          <>
                            {bristolType && (
                              <span style={{
                                fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 99,
                                backgroundColor: getBristolHealthColor(entry.bristol!),
                                color: 'white',
                              }}>
                                {bristolType.emoji} Tipo {entry.bristol}
                              </span>
                            )}
                            {entry.floats === true && <span style={{ fontSize: 12 }}>🫧</span>}
                          </>
                        )}
                      </div>

                      {entry.notes && (
                        <p style={{ fontSize: 12, color: D.textMuted, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.notes}
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" style={{ flexShrink: 0, marginTop: 6 }}>
                      <path d="M1 1L7 7L1 13" stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add entry button */}
        <div style={{ flexShrink: 0, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={() => onAddEntry(date)}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 50, border: 'none',
              cursor: 'pointer', backgroundColor: D.primary, color: D.primaryText,
              fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}
          >
            <span>+ añadir registro</span>
            {emoji.char === 'svg' ? (
              <img src={asset('/poop-button.svg')} alt="" style={{ width: 24, height: 24 }} />
            ) : (
              <span style={{ fontSize: 18 }}>{emoji.char}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
