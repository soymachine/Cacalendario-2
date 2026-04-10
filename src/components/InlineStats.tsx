import { useState, useEffect } from 'react';
import { computeStats, type Stats } from '../lib/stats';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { D } from '../lib/design';

export default function InlineStats() {
  const { emoji } = usePreferences();
  const [stats, setStats] = useState<Stats | null>(null);

  const refresh = () => {
    setStats(computeStats(Infinity));
  };

  useEffect(() => {
    refresh();
    window.addEventListener('fluxia-updated', refresh);
    return () => window.removeEventListener('fluxia-updated', refresh);
  }, []);

  if (!stats || stats.total === 0) return null;

  // Last week = most recent week in weeklyData
  const lastWeekCount = stats.weeklyData.length > 0
    ? stats.weeklyData[stats.weeklyData.length - 1].count
    : 0;

  const timeMax = Math.max(...stats.timeOfDay.map(t => t.count), 1);

  const sectionCard: React.CSSProperties = {
    backgroundColor: D.card,
    borderRadius: 16,
    padding: '14px 16px',
    marginTop: 10,
  };

  return (
    <>
      {/* Total + Última sem. side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        {/* Total card */}
        <div style={{ backgroundColor: D.card, borderRadius: 16, padding: '14px 16px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: '0 0 8px' }}>Total</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: D.text, lineHeight: 1 }}>{stats.total}</span>
            {emoji.char === 'svg' ? (
              <img src={asset('/poop-small.svg')} alt="" style={{ width: 36, height: 36 }} />
            ) : (
              <span style={{ fontSize: 32 }}>{emoji.char}</span>
            )}
          </div>
        </div>

        {/* Última sem. card */}
        <div style={{ backgroundColor: D.card, borderRadius: 16, padding: '14px 16px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: '0 0 8px' }}>Última sem.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: D.text, lineHeight: 1 }}>{lastWeekCount}</span>
            {emoji.char === 'svg' ? (
              <img src={asset('/poop-small.svg')} alt="" style={{ width: 36, height: 36 }} />
            ) : (
              <span style={{ fontSize: 32 }}>{emoji.char}</span>
            )}
          </div>
        </div>
      </div>

      {/* Hora — vertical bar chart */}
      <div style={sectionCard}>
        <p style={{ fontSize: 15, fontWeight: 700, color: D.text, margin: '0 0 14px' }}>Hora</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 90 }}>
          {stats.timeOfDay.map((slot, i) => {
            const barHeight = timeMax > 0 ? Math.max((slot.count / timeMax) * 60, slot.count > 0 ? 8 : 4) : 4;
            const isMax = slot.count === timeMax && slot.count > 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {slot.count > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{slot.count}</span>
                )}
                <div style={{
                  width: '100%',
                  height: `${barHeight}px`,
                  borderRadius: '6px 6px 0 0',
                  backgroundColor: isMax ? D.text : D.chip,
                  transition: 'height 0.3s ease',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 600, color: D.textMuted,
                  textAlign: 'center', lineHeight: 1.2, marginTop: 2,
                }}>
                  {slot.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
