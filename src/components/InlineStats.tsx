import { useState, useEffect } from 'react';
import { computeStats, type Stats } from '../lib/stats';
import { getEntries } from '../lib/storage';
import { formatDateForDisplay } from '../lib/dates';
import { D } from '../lib/design';

export default function InlineStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastEntry, setLastEntry] = useState<{ date: string; time: string; type: string } | null>(null);

  const refresh = () => {
    setStats(computeStats(Infinity));
    const entries = getEntries();
    if (entries.length > 0) {
      const last = entries[entries.length - 1];
      setLastEntry({
        date: last.date,
        time: last.time,
        type: last.entry_type ?? 'poop',
      });
    } else {
      setLastEntry(null);
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener('fluxia-updated', refresh);
    return () => window.removeEventListener('fluxia-updated', refresh);
  }, []);

  if (!stats || stats.total === 0) return null;

  const timeMax = Math.max(...stats.timeOfDay.map(t => t.count), 1);

  const sectionCard: React.CSSProperties = {
    backgroundColor: D.card,
    borderRadius: 16,
    padding: '14px 16px',
    marginTop: 10,
  };

  return (
    <>
      {/* Totals */}
      <div style={sectionCard}>
        <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, letterSpacing: 0.5, marginBottom: 12 }}>
          TOTALES
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: D.text, lineHeight: 1 }}>{stats.total}</p>
            <p style={{ fontSize: 11, color: D.textMuted, marginTop: 2 }}>Total</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: D.text, lineHeight: 1 }}>{stats.thisMonth}</p>
            <p style={{ fontSize: 11, color: D.textMuted, marginTop: 2 }}>Este mes</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: D.text, lineHeight: 1 }}>{stats.avgPerWeek}</p>
            <p style={{ fontSize: 11, color: D.textMuted, marginTop: 2 }}>Media/sem</p>
          </div>
        </div>
      </div>

      {/* Last entry */}
      {lastEntry && (
        <div style={{ ...sectionCard, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>{lastEntry.type === 'urine' ? '💧' : '💩'}</span>
          <div>
            <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, letterSpacing: 0.5, marginBottom: 2 }}>
              ÚLTIMO REGISTRO
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>
              {formatDateForDisplay(lastEntry.date)} · {lastEntry.time}
            </p>
          </div>
        </div>
      )}

      {/* Time of day */}
      <div style={sectionCard}>
        <p style={{ fontSize: 11, fontWeight: 900, color: D.textMuted, letterSpacing: 0.5, marginBottom: 12 }}>
          MEDIA POR HORAS
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stats.timeOfDay.map((slot, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{slot.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: D.text }}>{slot.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: D.text }}>{slot.count}</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, backgroundColor: D.chip, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%', borderRadius: 99,
                      width: `${timeMax > 0 ? (slot.count / timeMax) * 100 : 0}%`,
                      backgroundColor: D.primary,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
