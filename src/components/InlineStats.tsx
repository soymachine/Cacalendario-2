import { useState, useEffect } from 'react';
import { computeStats, type Stats } from '../lib/stats';
import { getEntries } from '../lib/storage';
import { asset } from '../lib/config';
import { D } from '../lib/design';

function EntryIcons({ hasPoop, hasUrine, size = 32 }: { hasPoop: boolean; hasUrine: boolean; size?: number }) {
  const imgStyle: React.CSSProperties = { width: size, height: size, filter: 'brightness(0) opacity(0.55)', display: 'block' };
  if (hasPoop && hasUrine) {
    const s = Math.round(size * 0.72);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <img src={asset('/Switch-Caca-Icono.svg')} alt="" style={{ ...imgStyle, width: s, height: s }} />
        <span style={{ fontSize: Math.round(size * 0.38), fontWeight: 900, color: D.textMuted, lineHeight: 1 }}>+</span>
        <img src={asset('/Switch-Miccion-Icono.svg')} alt="" style={{ ...imgStyle, width: s, height: s }} />
      </div>
    );
  }
  if (hasUrine) return <img src={asset('/Switch-Miccion-Icono.svg')} alt="" style={imgStyle} />;
  return <img src={asset('/Switch-Caca-Icono.svg')} alt="" style={imgStyle} />;
}

export default function InlineStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [totalPoop, setTotalPoop] = useState(0);
  const [totalUrine, setTotalUrine] = useState(0);
  const [lastWeekPoop, setLastWeekPoop] = useState(0);
  const [lastWeekUrine, setLastWeekUrine] = useState(0);

  const refresh = () => {
    setStats(computeStats(Infinity));
    const entries = getEntries();
    setTotalPoop(entries.filter(e => e.entry_type !== 'urine').length);
    setTotalUrine(entries.filter(e => e.entry_type === 'urine').length);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    const lastWeek = entries.filter(e => e.date >= cutoffStr);
    setLastWeekPoop(lastWeek.filter(e => e.entry_type !== 'urine').length);
    setLastWeekUrine(lastWeek.filter(e => e.entry_type === 'urine').length);
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
            <span style={{ fontSize: 36, fontWeight: 900, color: D.secondary, lineHeight: 1 }}>{stats.total}</span>
            <EntryIcons hasPoop={totalPoop > 0} hasUrine={totalUrine > 0} size={32} />
          </div>
        </div>

        {/* Última sem. card */}
        <div style={{ backgroundColor: D.card, borderRadius: 16, padding: '14px 16px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: '0 0 8px' }}>Última sem.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: D.secondary, lineHeight: 1 }}>{lastWeekCount}</span>
            <EntryIcons hasPoop={lastWeekPoop > 0} hasUrine={lastWeekUrine > 0} size={32} />
          </div>
        </div>
      </div>

      {/* Hora — vertical bar chart */}
      <div style={sectionCard}>
        <p style={{ fontSize: 15, fontWeight: 700, color: D.secondary, margin: '0 0 14px' }}>Hora</p>
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
                  backgroundColor: isMax ? D.secondary : D.chip,
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
