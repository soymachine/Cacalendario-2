import { useState, useEffect } from 'react';
import { computeStats, type Stats } from '../lib/stats';
import { asset } from '../lib/config';

interface StatsScreenProps {
  onClose: () => void;
}

export default function StatsScreen({ onClose }: StatsScreenProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(computeStats());
  }, []);

  if (!stats) return null;

  const weekMax = Math.max(...stats.weeklyData.map((w) => w.count), 1);
  const dayMax = Math.max(...stats.dayOfWeek.map((d) => d.count), 1);
  const timeMax = Math.max(...stats.timeOfDay.map((t) => t.count), 1);

  const monthDiff = stats.thisMonth - stats.lastMonth;
  const monthArrow = monthDiff > 0 ? '↑' : monthDiff < 0 ? '↓' : '=';
  const monthColor = monthDiff > 0 ? 'text-green-800' : monthDiff < 0 ? 'text-red-800' : 'text-black/50';

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-salmon">
      <div className="w-full max-w-md flex flex-col h-screen relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#231f20" />
            <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center pt-12 pb-4 shrink-0">
          <img src={asset('/logo.svg')} alt="Cacalendario" className="w-20 h-[71px]" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto px-6 pb-8">
          {/* Title */}
          <h2 className="text-sm font-black text-black mb-6">ESTADÍSTICAS</h2>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard label="Total" value={String(stats.total)} emoji="💩" />
            <StatCard
              label="Este mes"
              value={String(stats.thisMonth)}
              extra={
                <span className={`text-xs font-bold ${monthColor}`}>
                  {monthArrow} {Math.abs(monthDiff)} vs anterior
                </span>
              }
            />
            <StatCard label="Media/sem" value={String(stats.avgPerWeek)} emoji="📊" />
          </div>

          {/* Streaks */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}>
              <p className="text-xs font-black text-black/60">RACHA ACTUAL</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-black">{stats.currentStreak}</span>
                <span className="text-sm text-black">días</span>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}>
              <p className="text-xs font-black text-black/60">MEJOR RACHA</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-black">{stats.bestStreak}</span>
                <span className="text-sm text-black">días 🏆</span>
              </div>
            </div>
          </div>

          {/* Weekly chart */}
          <div className="mb-8">
            <p className="text-xs font-black text-black/60 mb-3">FRECUENCIA SEMANAL</p>
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}
            >
              <div className="flex items-end justify-between gap-1" style={{ height: '120px' }}>
                {stats.weeklyData.map((week, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                    <span className="text-xs font-bold text-black mb-1">{week.count}</span>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${Math.max((week.count / weekMax) * 80, 4)}px`,
                        backgroundColor: '#231f20',
                      }}
                    />
                    <span className="text-[9px] text-black/50 mt-1 truncate w-full text-center">
                      {week.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day of week */}
          <div className="mb-8">
            <p className="text-xs font-black text-black/60 mb-3">DÍA FAVORITO</p>
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}
            >
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
                          backgroundColor: isMax ? '#231f20' : 'rgba(35,31,32,0.4)',
                        }}
                      />
                      <span className="text-[10px] font-bold text-black/60 mt-1">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time of day */}
          <div className="mb-4">
            <p className="text-xs font-black text-black/60 mb-3">HORA FAVORITA</p>
            <div className="space-y-2">
              {stats.timeOfDay.map((slot, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}
                >
                  <span className="text-xl">{slot.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-black">{slot.label}</span>
                      <span className="text-xs font-bold text-black">{slot.count}</span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${timeMax > 0 ? (slot.count / timeMax) * 100 : 0}%`,
                          backgroundColor: '#231f20',
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
              <p className="text-lg text-black/60">
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
}: {
  label: string;
  value: string;
  emoji?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}>
      <p className="text-xs font-black text-black/60">{label}</p>
      <p className="text-2xl font-black text-black mt-1">
        {value} {emoji}
      </p>
      {extra && <div className="mt-1">{extra}</div>}
    </div>
  );
}
