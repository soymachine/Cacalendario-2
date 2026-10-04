import { useState } from 'react';
import Switch from 'rc-switch';
import {
  FOOD_FIELDS, FOOD_FIELD_LABEL, FIELD_MODE_LABEL, FREQUENCY_TYPES, FREQUENCY_LABEL,
  MEAL_TYPES, MEAL_TYPE_LABEL, expectedMeals, normalizeTagList, addTag,
  type FieldMode, type FoodTrackingConfig, type MealType,
} from '../lib/food';
import { tagColor } from '../lib/tags';

// Pauta de seguimiento de comidas de un paciente (panel de configuración del
// paciente en MW). Edita un borrador; se guarda con "Guardar configuración"
// junto al resto de la pauta (patient_links.food_config).

interface FoodConfigEditorProps {
  value: FoodTrackingConfig;
  onChange: (next: FoodTrackingConfig) => void;
  /** Catálogo de etiquetas de comida del profesional (doctors.food_tag_catalog). */
  catalog: string[];
  /** Crea una etiqueta en el catálogo (se guarda al momento). */
  onCreateTag: (tag: string) => void;
  accent: string;
  today: string;
}

const MODES: FieldMode[] = ['required', 'optional', 'hidden'];
const GRACE_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: '30 min' }, { value: 60, label: '1 h' }, { value: 90, label: '1 h 30 min' }, { value: 120, label: '2 h' },
];

export default function FoodConfigEditor({ value: cfg, onChange, catalog, onCreateTag, accent, today }: FoodConfigEditorProps) {
  const [tagInput, setTagInput] = useState('');
  const patch = (p: Partial<FoodTrackingConfig>) => onChange({ ...cfg, ...p });
  const sectionTitle = (t: string) => (
    <div className="text-[10px] font-extrabold text-fx-ink-300 tracking-wide uppercase pt-3 pb-1.5 border-t border-fx-border-soft">{t}</div>
  );
  const pill = (active: boolean) => ({
    backgroundColor: active ? accent : 'var(--fx-ink-100)',
    color: active ? '#fff' : 'var(--text-secondary)',
  });

  const reminderMeals: MealType[] = cfg.frequency.type === 'daily_target' ? [] : expectedMeals(cfg);
  const allTags = normalizeTagList([...catalog, ...cfg.tags]);

  return (
    <div className="medics-patient-config__food bg-fx-surface rounded-fx-lg shadow-fx-sm border border-fx-border-soft px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <Switch
          checked={cfg.enabled}
          onChange={(checked) => patch({ enabled: checked, enabled_at: cfg.enabled_at ?? (checked ? today : null) })}
          style={{ backgroundColor: cfg.enabled ? accent : undefined }}
        />
        <span className="text-[13px] font-semibold text-fx-text-secondary">Seguimiento de comidas</span>
      </div>
      <p className="text-[11px] text-fx-ink-300 leading-relaxed mt-1.5 mb-0">
        Seguimiento clínico, no nutricional: sin calorías ni gramos. El paciente solo verá los campos que actives.
      </p>

      {cfg.enabled && (
        <div className="flex flex-col">
          {/* Campos */}
          {sectionTitle('Campos')}
          <p className="text-[11px] text-fx-ink-400 mt-0 mb-1.5">La fecha y la hora se registran siempre.</p>
          {FOOD_FIELDS.map((f) => (
            <div key={f} className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-[13px] font-medium text-fx-text">{FOOD_FIELD_LABEL[f]}</span>
              <div className="flex gap-1" role="radiogroup" aria-label={FOOD_FIELD_LABEL[f]}>
                {MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={cfg.fields[f] === m}
                    onClick={() => patch({ fields: { ...cfg.fields, [f]: m } })}
                    className="py-1 px-2 rounded-md border-none cursor-pointer text-[10px] font-bold"
                    style={pill(cfg.fields[f] === m)}
                  >
                    {FIELD_MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Objetivo de registro */}
          {sectionTitle('Objetivo de registro')}
          <div className="flex flex-col gap-1" role="radiogroup" aria-label="Objetivo de registro">
            {FREQUENCY_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-[13px] text-fx-text cursor-pointer py-0.5">
                <input
                  type="radio"
                  name="food-frequency"
                  checked={cfg.frequency.type === t}
                  onChange={() => patch({ frequency: { ...cfg.frequency, type: t } })}
                  style={{ accentColor: accent }}
                />
                {FREQUENCY_LABEL[t]}
                {t === 'all_meals' && <span className="text-[10px] text-fx-ink-300">(desayuno, comida y cena)</span>}
              </label>
            ))}
          </div>
          {cfg.frequency.type === 'daily_target' && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number" min={1} max={12}
                value={cfg.frequency.daily_target}
                onChange={(e) => patch({ frequency: { ...cfg.frequency, daily_target: Math.max(1, Math.min(12, Number(e.target.value) || 1)) } })}
                className="py-1.5 px-2.5 rounded-lg border border-fx-border text-[13px] text-fx-text text-center"
                style={{ width: 60 }}
                aria-label="Registros al día"
              />
              <span className="text-xs text-fx-text-secondary">registros al día</span>
            </div>
          )}
          {cfg.frequency.type === 'specific_meals' && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {MEAL_TYPES.filter((m) => m !== 'other').map((m) => {
                const on = cfg.frequency.meals.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patch({ frequency: { ...cfg.frequency, meals: on ? cfg.frequency.meals.filter((x) => x !== m) : MEAL_TYPES.filter((x) => x === m || cfg.frequency.meals.includes(x)) } })}
                    className="py-1 px-2.5 rounded-[20px] border-none cursor-pointer text-[11px] font-bold"
                    style={pill(on)}
                  >
                    {on ? '✓ ' : ''}{MEAL_TYPE_LABEL[m]}
                  </button>
                );
              })}
            </div>
          )}
          {cfg.frequency.type === 'none' && (
            <p className="text-[11px] text-fx-ink-300 mt-1.5 mb-0">El paciente registra cuando lo considere. No afecta al semáforo ni genera recordatorios.</p>
          )}

          {/* Periodo */}
          {sectionTitle('Periodo de seguimiento')}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-[11px] font-semibold text-fx-text-tertiary flex items-center gap-1.5">
              Inicio
              <input
                type="date"
                value={cfg.period.start_date ?? ''}
                onChange={(e) => patch({ period: { ...cfg.period, start_date: e.target.value || null } })}
                className="text-xs px-2 py-1 rounded-md border border-fx-border text-fx-text-secondary"
              />
            </label>
            <label className="text-[11px] font-semibold text-fx-text-tertiary flex items-center gap-1.5">
              Fin
              <input
                type="date"
                value={cfg.period.end_date ?? ''}
                min={cfg.period.start_date ?? undefined}
                onChange={(e) => patch({ period: { ...cfg.period, end_date: e.target.value || null } })}
                className="text-xs px-2 py-1 rounded-md border border-fx-border text-fx-text-secondary"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-fx-text-secondary mt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={cfg.period.end_date == null}
              onChange={(e) => patch({ period: { ...cfg.period, end_date: e.target.checked ? null : (cfg.period.start_date ?? today) } })}
              style={{ accentColor: accent }}
            />
            Sin fecha de fin
          </label>

          {/* Etiquetas */}
          {sectionTitle('Etiquetas')}
          <p className="text-[11px] text-fx-ink-400 mt-0 mb-1.5">
            El paciente las verá como opciones al registrar. Actívalas solo si son relevantes para su seguimiento.
          </p>
          {allTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allTags.map((t) => {
                const on = cfg.tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patch({ tags: on ? cfg.tags.filter((x) => x !== t) : [...cfg.tags, t] })}
                    title={on ? `Desactivar "${t}"` : `Activar "${t}"`}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-[3px] rounded-[20px] cursor-pointer"
                    style={{
                      border: on ? 'none' : `1px solid ${tagColor(t)}40`,
                      backgroundColor: on ? `${tagColor(t)}22` : 'transparent',
                      color: on ? tagColor(t) : 'var(--fx-ink-400)',
                      fontWeight: on ? 700 : 400,
                    }}
                  >
                    {on && <span className="text-[9px] leading-none">✓</span>}
                    {t}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-fx-ink-300 mb-2 italic mt-0">Sin etiquetas. Ejemplos: Lácteos, Gluten, Café, Alcohol, Picante, Legumbres, Fritos.</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = tagInput.trim();
              if (!v) return;
              setTagInput('');
              onCreateTag(v);
              patch({ tags: addTag(cfg.tags, v) });
            }}
            className="flex gap-1.5 items-center"
          >
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Nueva etiqueta de comida…"
              maxLength={40}
              className="px-2.5 py-1 rounded-[20px] border border-fx-border text-[11px] outline-none flex-1 min-w-0"
            />
            <button type="submit" className="px-3 py-1 rounded-[20px] border-none bg-fx-surface-2 text-[11px] text-fx-text-secondary cursor-pointer font-semibold whitespace-nowrap">
              Crear y activar
            </button>
          </form>

          {/* Recordatorios */}
          {sectionTitle('Recordatorios')}
          <div className="flex items-center gap-2.5">
            <Switch
              checked={cfg.reminders.enabled}
              disabled={cfg.frequency.type === 'none'}
              onChange={(checked) => patch({ reminders: { ...cfg.reminders, enabled: checked } })}
              style={{ backgroundColor: cfg.reminders.enabled && cfg.frequency.type !== 'none' ? accent : undefined }}
            />
            <span className="text-[13px] font-semibold text-fx-text-secondary">
              {cfg.frequency.type === 'none' ? 'Requiere un objetivo de registro' : cfg.reminders.enabled ? 'Activados' : 'Desactivados'}
            </span>
          </div>
          {cfg.reminders.enabled && cfg.frequency.type !== 'none' && (
            <div className="flex flex-col gap-1.5 mt-2">
              {cfg.frequency.type === 'daily_target' ? (
                <label className="flex items-center justify-between text-xs text-fx-text-secondary">
                  Avisar si no llega al objetivo a las
                  <input
                    type="time"
                    value={cfg.reminders.daily_target_time}
                    onChange={(e) => e.target.value && patch({ reminders: { ...cfg.reminders, daily_target_time: e.target.value } })}
                    className="text-xs px-2 py-1 rounded-md border border-fx-border text-fx-text-secondary"
                  />
                </label>
              ) : reminderMeals.length === 0 ? (
                <p className="text-[11px] text-fx-ink-300 m-0">Elige al menos una comida en el objetivo.</p>
              ) : (
                reminderMeals.map((m) => (
                  <label key={m} className="flex items-center justify-between text-xs text-fx-text-secondary">
                    {MEAL_TYPE_LABEL[m]} — hora habitual
                    <input
                      type="time"
                      value={cfg.reminders.meal_times[m]}
                      onChange={(e) => e.target.value && patch({ reminders: { ...cfg.reminders, meal_times: { ...cfg.reminders.meal_times, [m]: e.target.value } } })}
                      className="text-xs px-2 py-1 rounded-md border border-fx-border text-fx-text-secondary"
                    />
                  </label>
                ))
              )}
              {cfg.frequency.type !== 'daily_target' && (
                <label className="flex items-center justify-between text-xs text-fx-text-secondary">
                  Margen antes de avisar
                  <select
                    value={cfg.reminders.grace_minutes}
                    onChange={(e) => patch({ reminders: { ...cfg.reminders, grace_minutes: Number(e.target.value) } })}
                    className="text-xs px-2 py-1 rounded-md border border-fx-border text-fx-text-secondary bg-fx-surface"
                  >
                    {GRACE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </label>
              )}
              <p className="text-[11px] text-fx-ink-300 m-0 leading-relaxed">
                Ejemplo: «Todavía no has registrado la comida.» Como máximo un aviso por comida y {cfg.reminders.max_per_day} al día, nunca entre las 23:00 y las 08:00. Respeta el interruptor de notificaciones del paciente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
