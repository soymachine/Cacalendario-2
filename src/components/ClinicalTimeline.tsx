import { buildTimeline } from '../lib/food';
import EntryTypeIcon, { type EntryKind } from './EntryTypeIcon';
import FoodPhoto from './FoodPhoto';

// Línea temporal clínica unificada (MW): todos los tipos de registro de un
// paciente en orden cronológico, agrupados por día. Solo muestra el orden de
// los hechos; Fluxia no relaciona eventos entre sí ni sugiere causas.

export interface TimelineEntry {
  entry_id: string;
  date: string;
  time: string;
  entry_type: EntryKind;
  food_photo_path?: string | null;
}

interface ClinicalTimelineProps<T extends TimelineEntry> {
  entries: T[];
  summarize: (entry: T) => { title: string; detail: string };
  onOpen?: (entry: T) => void;
  formatDay: (date: string) => string;
}

export default function ClinicalTimeline<T extends TimelineEntry>({ entries, summarize, onOpen, formatDay }: ClinicalTimelineProps<T>) {
  const days = buildTimeline(entries);
  return (
    <div className="flex flex-col">
      <p className="px-4 pt-2.5 pb-1 text-[11px] text-fx-text-tertiary m-0">
        Orden cronológico de los registros del paciente. Fluxia no establece relaciones de causa entre ellos.
      </p>
      {days.map((day) => (
        <section key={day.date} className="border-b border-fx-border-soft last:border-b-0">
          <h4 className="px-4 py-1.5 m-0 text-[11px] font-extrabold uppercase tracking-wide text-fx-text-tertiary sticky top-0" style={{ backgroundColor: 'var(--fx-ink-50)' }}>
            {formatDay(day.date)}
          </h4>
          <ol className="list-none m-0 px-4 py-1.5">
            {day.events.map((e, i) => {
              const { title, detail } = summarize(e);
              const clickable = !!onOpen;
              const body = (
                <>
                  <span className="w-[46px] flex-shrink-0 text-[13px] font-bold text-fx-text tabular-nums">{e.time || '—'}</span>
                  <span className="relative flex flex-col items-center w-6 flex-shrink-0 self-stretch">
                    <span className="mt-0.5"><EntryTypeIcon kind={e.entry_type} size={18} /></span>
                    {i < day.events.length - 1 && (
                      <span className="flex-1 w-px mt-1" style={{ backgroundColor: 'var(--fx-ink-200)' }} aria-hidden />
                    )}
                  </span>
                  <span className="flex-1 min-w-0 pb-2">
                    <span className="block text-[13px] font-bold text-fx-text">{title}</span>
                    {detail && <span className="block text-xs text-fx-text-secondary leading-snug truncate">{detail}</span>}
                  </span>
                  {e.entry_type === 'food' && e.food_photo_path && (
                    <FoodPhoto path={e.food_photo_path} alt={`Foto: ${title}`} className="w-9 h-9 rounded-md flex-shrink-0" />
                  )}
                </>
              );
              return (
                <li key={e.entry_id || `${e.date}-${e.time}-${i}`}>
                  {clickable ? (
                    <button
                      type="button"
                      onClick={() => onOpen!(e)}
                      className="w-full flex items-start gap-2 text-left bg-transparent border-none p-0 pt-1 cursor-pointer rounded hover:bg-fx-ink-50 font-fx"
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="flex items-start gap-2 pt-1">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
