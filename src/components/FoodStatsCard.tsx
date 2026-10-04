import {
  computeFoodStats, addDays, MEAL_TYPES, MEAL_TYPE_LABEL, FREQUENCY_LABEL,
  type FoodEntryLike, type FoodTrackingConfig,
} from '../lib/food';
import { tagColor } from '../lib/tags';

// Estadísticas básicas de comidas (MW). Recuentos y adherencia a la pauta;
// sin calorías, puntuaciones nutricionales ni recomendaciones dietéticas.

interface FoodStatsCardProps {
  entries: FoodEntryLike[];
  config: FoodTrackingConfig;
  today: string;
  windowDays?: number;
}

export default function FoodStatsCard({ entries, config, today, windowDays = 14 }: FoodStatsCardProps) {
  const from = addDays(today, -(windowDays - 1));
  const stats = computeFoodStats(entries, config, today, { from, to: today, adherenceWindow: windowDays });
  const maxMeal = Math.max(1, ...MEAL_TYPES.map((m) => stats.byMealType[m]));
  const adherencePct = stats.adherence != null ? Math.round(stats.adherence * 100) : null;
  const adherenceColor = adherencePct == null ? 'var(--fx-ink-500)'
    : adherencePct >= 80 ? 'var(--color-success)' : adherencePct >= 50 ? 'var(--color-warning)' : 'var(--color-error)';

  return (
    <div className="medics-patient-detail__food-stats bg-fx-surface rounded-fx-lg shadow-fx-sm border border-fx-border-soft">
      <div className="px-3.5 py-2 border-b border-fx-border-soft text-xs font-bold text-fx-text flex items-center justify-between">
        <span>Comidas</span>
        <span className="text-[10px] font-semibold text-fx-text-tertiary">últimos {windowDays} días</span>
      </div>
      <div className="px-3.5 py-2.5 flex flex-col gap-3">
        <div className="flex gap-1.5">
          <div className="flex-1 text-center rounded-lg py-1.5 px-1" style={{ backgroundColor: 'var(--fx-ink-50)' }}>
            <div className="text-[17px] font-black text-fx-text leading-none">{stats.total}</div>
            <div className="text-[9px] text-fx-text-tertiary mt-[3px]">Registros</div>
          </div>
          <div className="flex-1 text-center rounded-lg py-1.5 px-1" style={{ backgroundColor: 'var(--fx-ink-50)' }}
            title={config.frequency.type === 'none' ? 'Sin objetivo de registro configurado' : `${FREQUENCY_LABEL[config.frequency.type]} · días completos, sin contar hoy`}>
            <div className="text-[17px] font-black leading-none" style={{ color: adherenceColor }}>{adherencePct != null ? `${adherencePct}%` : '—'}</div>
            <div className="text-[9px] text-fx-text-tertiary mt-[3px]">Adherencia</div>
          </div>
          <div className="flex-1 text-center rounded-lg py-1.5 px-1" style={{ backgroundColor: 'var(--fx-ink-50)' }}>
            <div className="text-[17px] font-black text-fx-text leading-none">{stats.withPhoto}</div>
            <div className="text-[9px] text-fx-text-tertiary mt-[3px]">Con foto</div>
          </div>
        </div>

        <div>
          <div className="text-[9px] font-extrabold text-fx-ink-300 tracking-wide mb-1">POR TIPO DE COMIDA</div>
          <ul className="list-none m-0 p-0 flex flex-col gap-1">
            {MEAL_TYPES.map((m) => (
              <li key={m} className="flex items-center gap-2 text-[11px]">
                <span className="w-[86px] flex-shrink-0 whitespace-nowrap text-fx-text-secondary">{MEAL_TYPE_LABEL[m]}</span>
                <span className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--fx-ink-50)' }}>
                  <span className="block h-full rounded-full" style={{ width: `${(stats.byMealType[m] / maxMeal) * 100}%`, backgroundColor: 'var(--fx-violet-400)' }} />
                </span>
                <span className="w-5 text-right font-bold text-fx-text tabular-nums">{stats.byMealType[m]}</span>
              </li>
            ))}
          </ul>
        </div>

        {stats.topTags.length > 0 && (
          <div>
            <div className="text-[9px] font-extrabold text-fx-ink-300 tracking-wide mb-1.5">ETIQUETAS MÁS FRECUENTES</div>
            <div className="flex gap-1 flex-wrap">
              {stats.topTags.map(({ tag, count }) => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: `${tagColor(tag)}18`, color: tagColor(tag) }}>
                  {tag} <span className="font-normal opacity-60">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
