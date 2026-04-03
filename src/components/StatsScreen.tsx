import { useState, useEffect } from 'react';
import { computeStats, type Stats } from '../lib/stats';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getBristolHealthLabel, getBristolHealthColor, BRISTOL_SCALE } from '../lib/bristol';

interface StatsScreenProps {
  onClose: () => void;
}

export default function StatsScreen({ onClose }: StatsScreenProps) {
  const { theme } = usePreferences();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(computeStats(Infinity));
  }, []);

  if (!stats) return null;

  const weekMax = Math.max(...stats.weeklyData.map((w) => w.count), 1);
  const dayMax = Math.max(...stats.dayOfWeek.map((d) => d.count), 1);
  const timeMax = Math.max(...stats.timeOfDay.map((t) => t.count), 1);
  const bristolMax = Math.max(...stats.bristolDistribution.map((b) => b.count), 1);
  const hasBristolData = stats.bristolDistribution.some((b) => b.count > 0);

  const monthDiff = stats.thisMonth - stats.lastMonth;
  const monthArrow = monthDiff > 0 ? '↑' : monthDiff < 0 ? '↓' : '=';
  const monthColor = monthDiff > 0 ? '#27ae60' : monthDiff < 0 ? '#c0392b' : `${theme.text}80`;
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  return (
    <div className="fixed inset-0 z-50 flex justify-center" style={{ backgroundColor: theme.main }}>
      <div className="w-full max-w-md flex flex-col h-screen relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill={theme.text} />
            <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center pt-12 pb-4 shrink-0">
          <img src={asset('/logo.svg')} alt="Cacalendario" className="w-20 h-[71px]" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-auto px-6 pb-8">
          {/* Title */}
          <h2 className="text-sm font-black mb-6" style={{ color: theme.text }}>ESTADÍSTICAS</h2>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard label="Total" value={String(stats.total)} emoji="💩" theme={theme} />
            <StatCard
              label="Este mes"
              value={String(stats.thisMonth)}
              theme={theme}
              extra={
                <span className="text-xs font-bold" style={{ color: monthColor }}>
                  {monthArrow} {Math.abs(monthDiff)} vs anterior
                </span>
              }
            />
            <StatCard label="Media/sem" value={String(stats.avgPerWeek)} emoji="📊" theme={theme} />
          </div>

          {/* Streaks */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.glass }}>
              <p className="text-xs font-black" style={{ color: `${theme.text}99` }}>RACHA ACTUAL</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black" style={{ color: theme.text }}>{stats.currentStreak}</span>
                <span className="text-sm" style={{ color: theme.text }}>días</span>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.glass }}>
              <p className="text-xs font-black" style={{ color: `${theme.text}99` }}>MEJOR RACHA</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black" style={{ color: theme.text }}>{stats.bestStreak}</span>
                <span className="text-sm" style={{ color: theme.text }}>días 🏆</span>
              </div>
            </div>
          </div>

          {/* Bristol distribution */}
          {hasBristolData && (
            <div className="mb-8">
              <p className="text-xs font-black mb-3" style={{ color: `${theme.text}99` }}>ESCALA DE BRISTOL</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: theme.glass }}>
                {/* Average indicator */}
                {stats.bristolAvg && (
                  <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: `1px solid ${theme.text}15` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{BRISTOL_SCALE[Math.round(stats.bristolAvg) - 1]?.emoji}</span>
                      <span className="text-xs font-bold" style={{ color: theme.text }}>
                        Media: Tipo {stats.bristolAvg}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: getBristolHealthColor(Math.round(stats.bristolAvg)),
                        color: 'white',
                      }}
                    >
                      {getBristolHealthLabel(Math.round(stats.bristolAvg))}
                    </span>
                  </div>
                )}
                <div className="flex items-end justify-between gap-1.5" style={{ height: '100px' }}>
                  {stats.bristolDistribution.map((b, i) => {
                    const isMax = b.count === bristolMax && b.count > 0;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                        {b.count > 0 && (
                          <span className="text-[10px] font-bold mb-1" style={{ color: theme.text }}>{b.count}</span>
                        )}
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{
                            height: `${Math.max((b.count / bristolMax) * 65, b.count > 0 ? 6 : 3)}px`,
                            backgroundColor: isMax
                              ? BRISTOL_SCALE[i]?.color || theme.text
                              : `${theme.text}40`,
                          }}
                        />
                        <span className="text-sm mt-1">{b.emoji}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Weekly chart */}
          <div className="mb-8">
            <p className="text-xs font-black mb-3" style={{ color: `${theme.text}99` }}>FRECUENCIA SEMANAL</p>
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.glass }}>
              <div className="flex items-end justify-between gap-1" style={{ height: '120px' }}>
                {stats.weeklyData.map((week, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                    <span className="text-xs font-bold mb-1" style={{ color: theme.text }}>{week.count}</span>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${Math.max((week.count / weekMax) * 80, 4)}px`,
                        backgroundColor: theme.text,
                      }}
                    />
                    <span className="text-[9px] mt-1 truncate w-full text-center" style={{ color: `${theme.text}80` }}>
                      {week.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day of week */}
          <div className="mb-8">
            <p className="text-xs font-black mb-3" style={{ color: `${theme.text}99` }}>DÍA FAVORITO</p>
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.glass }}>
              <div className="flex items-end justify-between gap-1" style={{ height: '100px' }}>
                {stats.dayOfWeek.map((d, i) => {
                  const isMax = d.count === dayMax && d.count > 0;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                      {isMax && <span className="text-xs mb-1">💩</span>}
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${Math.max((d.count / dayMax) * 60, 4)}px`,
                          backgroundColor: isMax ? theme.text : `${theme.text}40`,
                        }}
                      />
                      <span className="text-[10px] font-bold mt-1" style={{ color: `${theme.text}99` }}>{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time of day */}
          <div className="mb-4">
            <p className="text-xs font-black mb-3" style={{ color: `${theme.text}99` }}>HORA FAVORITA</p>
            <div className="space-y-2">
              {stats.timeOfDay.map((slot, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ backgroundColor: theme.glass }}
                >
                  <span className="text-xl">{slot.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: theme.text }}>{slot.label}</span>
                      <span className="text-xs font-bold" style={{ color: theme.text }}>{slot.count}</span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: `${theme.text}15` }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${timeMax > 0 ? (slot.count / timeMax) * 100 : 0}%`,
                          backgroundColor: theme.text,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {stats.total === 0 && (
            <div className="text-center py-12">
              <p className="text-6xl mb-4">💩</p>
              <p className="text-lg" style={{ color: `${theme.text}99` }}>
                ¡Aún no hay registros!<br />
                Empieza a registrar para ver tus estadísticas.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  emoji,
  extra,
  theme,
}: {
  label: string;
  value: string;
  emoji?: string;
  extra?: React.ReactNode;
  theme: { text: string; glass: string };
}) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ backgroundColor: theme.glass }}>
      <p className="text-xs font-black" style={{ color: `${theme.text}99` }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color: theme.text }}>
        {value} {emoji}
      </p>
      {extra && <div className="mt-1">{extra}</div>}
    </div>
  );
}
