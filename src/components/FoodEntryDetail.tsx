import { useEffect } from 'react';
import { mealTypeLabel, portionLabel, FOOD_FIELD_LABEL } from '../lib/food';
import { tagColor } from '../lib/tags';
import EntryTypeIcon from './EntryTypeIcon';
import FoodPhoto from './FoodPhoto';

// Detalle de un registro de comida en MW (se abre al pulsar la fila).

export interface FoodEntryDetailData {
  date: string;
  time: string;
  notes: string;
  food_meal_type: string | null;
  food_description: string | null;
  food_portion: string | null;
  food_tags: string[];
  food_photo_path: string | null;
  doctor_note?: string;
}

interface FoodEntryDetailProps {
  entry: FoodEntryDetailData;
  formatDay: (date: string) => string;
  onClose: () => void;
}

export default function FoodEntryDetail({ entry, formatDay, onClose }: FoodEntryDetailProps) {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const meal = mealTypeLabel(entry.food_meal_type) ?? 'Comida';
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-3 py-2 border-b border-fx-border-soft last:border-b-0">
      <dt className="w-[118px] flex-shrink-0 text-xs font-bold text-fx-text-tertiary">{label}</dt>
      <dd className="m-0 flex-1 min-w-0 text-[13px] text-fx-text leading-snug">{value}</dd>
    </div>
  );

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[300] bg-black/45" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${meal}, ${formatDay(entry.date)} ${entry.time}`}
        className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-[520px] max-h-[90vh] overflow-y-auto bg-fx-surface rounded-fx-lg shadow-fx-sm border border-fx-border-soft font-fx"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-fx-border-soft">
          <span className="flex items-center gap-2 text-[15px] font-bold text-fx-text">
            <EntryTypeIcon kind="food" size={20} />
            {meal}
            <span className="text-[13px] font-semibold text-fx-text-tertiary">· {formatDay(entry.date)} · {entry.time}</span>
          </span>
          <button onClick={onClose} aria-label="Cerrar" className="bg-transparent border-none text-[22px] leading-none cursor-pointer px-1 text-fx-text-secondary">×</button>
        </div>
        {entry.food_photo_path && (
          <FoodPhoto path={entry.food_photo_path} alt={`Foto: ${meal}`} className="w-full block text-xs" style={{ maxHeight: 360, minHeight: 140 }} verbose />
        )}
        <dl className="px-5 py-2 m-0">
          {row(FOOD_FIELD_LABEL.description, entry.food_description || <span className="text-fx-ink-300">—</span>)}
          {row(FOOD_FIELD_LABEL.portion, portionLabel(entry.food_portion) ?? <span className="text-fx-ink-300">—</span>)}
          {row(FOOD_FIELD_LABEL.tags, entry.food_tags.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {entry.food_tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-[20px] font-bold" style={{ backgroundColor: `${tagColor(t)}22`, color: tagColor(t) }}>{t}</span>
              ))}
            </span>
          ) : <span className="text-fx-ink-300">—</span>)}
          {row(FOOD_FIELD_LABEL.notes, entry.notes || <span className="text-fx-ink-300">—</span>)}
          {entry.doctor_note && row('Tu anotación', <span style={{ color: 'var(--fx-warning-700)' }}>{entry.doctor_note}</span>)}
        </dl>
      </div>
    </>
  );
}
