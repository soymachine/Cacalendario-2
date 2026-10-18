import { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  FOOD_FIELDS, FOOD_FIELD_LABEL, FIELD_MODE_LABEL, FREQUENCY_TYPES, FREQUENCY_LABEL,
  MEAL_TYPES, MEAL_TYPE_LABEL, expectedMeals, normalizeTagList, addTag,
  type FieldMode, type FoodTrackingConfig, type MealType,
} from '../lib/food';
import { tagColor } from '../lib/tags';
import { D } from '../lib/design';

// Pauta de seguimiento de comidas de un paciente (configuración del paciente
// en MA). Portado de src/components/FoodConfigEditor.tsx (MW) — mantener
// sincronizado a mano. Edita un borrador; se guarda con "Guardar
// configuración" junto al resto de la pauta (patient_links.food_config).

interface FoodConfigCardProps {
  value: FoodTrackingConfig;
  onChange: (next: FoodTrackingConfig) => void;
  /** Catálogo de etiquetas de comida del profesional (doctors.food_tag_catalog). */
  catalog: string[];
  /** Crea una etiqueta en el catálogo (se guarda al momento). */
  onCreateTag: (tag: string) => void;
  today: string;
  /** Sin el interruptor de activar/desactivar: se muestra la pauta como activa (modal de invitación). */
  hideToggle?: boolean;
}

const MODES: FieldMode[] = ['required', 'optional', 'hidden'];
const GRACE_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: '30 min' }, { value: 60, label: '1 h' }, { value: 90, label: '1 h 30' }, { value: 120, label: '2 h' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const dateKeyToDate = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const dateToKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmmToDate = (t: string) => { const [h, m] = t.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; };
const dateToHHMM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const formatDateKey = (k: string) => dateKeyToDate(k).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

/** Campo de fecha u hora: muestra el valor y abre el selector del sistema al pulsarlo. */
function PickerField({ mode, value, placeholder, minimumDate, onChange }: {
  mode: 'date' | 'time';
  value: string | null;
  placeholder?: string;
  minimumDate?: Date;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const shown = value ? (mode === 'date' ? formatDateKey(value) : value) : (placeholder ?? '—');
  const initial = value ? (mode === 'date' ? dateKeyToDate(value) : hhmmToDate(value)) : (minimumDate ?? new Date());
  return (
    <View>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.pickerButton}>
        <Text style={value ? styles.pickerText : styles.pickerPlaceholder}>{shown}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={initial}
          mode={mode}
          minimumDate={minimumDate}
          is24Hour
          locale="es-ES"
          display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
          onChange={(event, d) => {
            if (Platform.OS === 'android') setOpen(false);
            if (event.type === 'set' && d) onChange(mode === 'date' ? dateToKey(d) : dateToHHMM(d));
          }}
        />
      )}
      {open && Platform.OS === 'ios' && (
        <Pressable onPress={() => setOpen(false)} style={styles.pickerDone}>
          <Text style={styles.pickerDoneText}>Listo</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function FoodConfigCard({ value: cfg, onChange, catalog, onCreateTag, today, hideToggle }: FoodConfigCardProps) {
  const [tagInput, setTagInput] = useState('');
  const patch = (p: Partial<FoodTrackingConfig>) => onChange({ ...cfg, ...p });

  const reminderMeals: MealType[] = cfg.frequency.type === 'daily_target' ? [] : expectedMeals(cfg);
  const allTags = normalizeTagList([...catalog, ...cfg.tags]);
  const remindersAvailable = cfg.frequency.type !== 'none';

  const createTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    setTagInput('');
    onCreateTag(v);
    patch({ tags: addTag(cfg.tags, v) });
  };

  return (
    <View style={styles.card}>
      {!hideToggle && <>
      <View style={styles.switchRow}>
        <Switch
          value={cfg.enabled}
          onValueChange={(checked) => patch({ enabled: checked, enabled_at: cfg.enabled_at ?? (checked ? today : null) })}
          trackColor={{ true: D.primary, false: D.chipDark }}
          thumbColor="#fff"
        />
        <Text style={styles.cardTitleInline}>Seguimiento de comidas</Text>
      </View>
      <Text style={styles.hint}>Seguimiento clínico, no nutricional: sin calorías ni gramos. El paciente solo verá los campos que actives.</Text>
      </>}

      {(cfg.enabled || hideToggle) && (
        <>
          {/* Campos */}
          <Text style={styles.section}>Campos</Text>
          <Text style={styles.hint}>La fecha y la hora se registran siempre.</Text>
          {FOOD_FIELDS.map((f) => (
            <View key={f} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{FOOD_FIELD_LABEL[f]}</Text>
              <View style={styles.modeGroup}>
                {MODES.map((m) => {
                  const on = cfg.fields[f] === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => patch({ fields: { ...cfg.fields, [f]: m } })}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      style={[styles.modePill, on && styles.modePillOn]}
                    >
                      <Text style={[styles.modePillText, on && styles.modePillTextOn]}>{FIELD_MODE_LABEL[m]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Objetivo de registro */}
          <Text style={styles.section}>Objetivo de registro</Text>
          {FREQUENCY_TYPES.map((t) => {
            const on = cfg.frequency.type === t;
            return (
              <Pressable
                key={t}
                onPress={() => patch({ frequency: { ...cfg.frequency, type: t } })}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={styles.radioRow}
              >
                <View style={[styles.radioOuter, on && styles.radioOuterOn]}>{on && <View style={styles.radioInner} />}</View>
                <Text style={styles.radioLabel}>
                  {FREQUENCY_LABEL[t]}
                  {t === 'all_meals' && <Text style={styles.radioSub}>  (desayuno, comida y cena)</Text>}
                </Text>
              </Pressable>
            );
          })}
          {cfg.frequency.type === 'daily_target' && (
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => patch({ frequency: { ...cfg.frequency, daily_target: Math.max(1, cfg.frequency.daily_target - 1) } })}
                style={styles.stepperButton}
                accessibilityLabel="Un registro menos"
              >
                <Text style={styles.stepperButtonText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{cfg.frequency.daily_target}</Text>
              <Pressable
                onPress={() => patch({ frequency: { ...cfg.frequency, daily_target: Math.min(12, cfg.frequency.daily_target + 1) } })}
                style={styles.stepperButton}
                accessibilityLabel="Un registro más"
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </Pressable>
              <Text style={styles.stepperUnit}>registros al día</Text>
            </View>
          )}
          {cfg.frequency.type === 'specific_meals' && (
            <View style={styles.chipsRow}>
              {MEAL_TYPES.filter((m) => m !== 'other').map((m) => {
                const on = cfg.frequency.meals.includes(m);
                return (
                  <Pressable
                    key={m}
                    onPress={() => patch({ frequency: { ...cfg.frequency, meals: on ? cfg.frequency.meals.filter((x) => x !== m) : MEAL_TYPES.filter((x) => x === m || cfg.frequency.meals.includes(x)) } })}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{on ? '✓ ' : ''}{MEAL_TYPE_LABEL[m]}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {cfg.frequency.type === 'none' && (
            <Text style={styles.hint}>El paciente registra cuando lo considere. No afecta al semáforo ni genera recordatorios.</Text>
          )}

          {/* Periodo */}
          <Text style={styles.section}>Periodo de seguimiento</Text>
          <View style={styles.inlineRow}>
            <Text style={styles.inlineLabel}>Inicio</Text>
            <View style={styles.inlineValue}>
              <PickerField
                mode="date"
                value={cfg.period.start_date}
                placeholder="Desde que se activa"
                onChange={(v) => patch({ period: { start_date: v, end_date: cfg.period.end_date && cfg.period.end_date < v ? v : cfg.period.end_date } })}
              />
            </View>
          </View>
          {!!cfg.period.start_date && (
            <Pressable onPress={() => patch({ period: { ...cfg.period, start_date: null } })}>
              <Text style={styles.linkText}>Quitar fecha de inicio</Text>
            </Pressable>
          )}
          <View style={styles.switchRow}>
            <Switch
              value={cfg.period.end_date == null}
              onValueChange={(noEnd) => patch({ period: { ...cfg.period, end_date: noEnd ? null : (cfg.period.start_date ?? today) } })}
              trackColor={{ true: D.primary, false: D.chipDark }}
              thumbColor="#fff"
            />
            <Text style={styles.switchLabel}>Sin fecha de fin</Text>
          </View>
          {cfg.period.end_date != null && (
            <View style={styles.inlineRow}>
              <Text style={styles.inlineLabel}>Fin</Text>
              <View style={styles.inlineValue}>
                <PickerField
                  mode="date"
                  value={cfg.period.end_date}
                  minimumDate={cfg.period.start_date ? dateKeyToDate(cfg.period.start_date) : undefined}
                  onChange={(v) => patch({ period: { ...cfg.period, end_date: v } })}
                />
              </View>
            </View>
          )}

          {/* Etiquetas */}
          <Text style={styles.section}>Etiquetas</Text>
          <Text style={styles.hint}>El paciente las verá como opciones al registrar. Actívalas solo si son relevantes para su seguimiento.</Text>
          {allTags.length > 0 ? (
            <View style={styles.chipsRow}>
              {allTags.map((t) => {
                const on = cfg.tags.includes(t);
                return (
                  <Pressable
                    key={t}
                    onPress={() => patch({ tags: on ? cfg.tags.filter((x) => x !== t) : [...cfg.tags, t] })}
                    style={[styles.tagChip, { backgroundColor: on ? tagColor(t) + '22' : 'transparent', borderWidth: on ? 0 : 1, borderColor: tagColor(t) + '40' }]}
                  >
                    <Text style={[styles.tagChipText, { color: on ? tagColor(t) : D.textMuted, fontWeight: on ? '800' : '500' }]}>{on ? '✓ ' : ''}{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.mutedItalic}>Sin etiquetas. Ejemplos: Lácteos, Gluten, Café, Alcohol, Picante, Legumbres, Fritos.</Text>
          )}
          <View style={styles.tagInputRow}>
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Nueva etiqueta de comida…"
              placeholderTextColor={D.textMuted}
              maxLength={40}
              onSubmitEditing={createTag}
              style={styles.tagInput}
            />
            <Pressable onPress={createTag} style={styles.tagCreateButton}>
              <Text style={styles.tagCreateButtonText}>Crear y activar</Text>
            </Pressable>
          </View>

          {/* Recordatorios */}
          <Text style={styles.section}>Recordatorios</Text>
          <View style={styles.switchRow}>
            <Switch
              value={cfg.reminders.enabled && remindersAvailable}
              disabled={!remindersAvailable}
              onValueChange={(checked) => patch({ reminders: { ...cfg.reminders, enabled: checked } })}
              trackColor={{ true: D.primary, false: D.chipDark }}
              thumbColor="#fff"
            />
            <Text style={styles.switchLabel}>
              {!remindersAvailable ? 'Requiere un objetivo de registro' : cfg.reminders.enabled ? 'Activados' : 'Desactivados'}
            </Text>
          </View>
          {cfg.reminders.enabled && remindersAvailable && (
            <>
              {cfg.frequency.type === 'daily_target' ? (
                <View style={styles.inlineRow}>
                  <Text style={styles.inlineLabel}>Avisar si no llega al objetivo a las</Text>
                  <View style={styles.inlineValue}>
                    <PickerField
                      mode="time"
                      value={cfg.reminders.daily_target_time}
                      onChange={(v) => patch({ reminders: { ...cfg.reminders, daily_target_time: v } })}
                    />
                  </View>
                </View>
              ) : reminderMeals.length === 0 ? (
                <Text style={styles.hint}>Elige al menos una comida en el objetivo.</Text>
              ) : (
                reminderMeals.map((m) => (
                  <View key={m} style={styles.inlineRow}>
                    <Text style={styles.inlineLabel}>{MEAL_TYPE_LABEL[m]} — hora habitual</Text>
                    <View style={styles.inlineValue}>
                      <PickerField
                        mode="time"
                        value={cfg.reminders.meal_times[m]}
                        onChange={(v) => patch({ reminders: { ...cfg.reminders, meal_times: { ...cfg.reminders.meal_times, [m]: v } } })}
                      />
                    </View>
                  </View>
                ))
              )}
              {cfg.frequency.type !== 'daily_target' && (
                <>
                  <Text style={styles.inlineLabel}>Margen antes de avisar</Text>
                  <View style={styles.chipsRow}>
                    {GRACE_OPTIONS.map((g) => {
                      const on = cfg.reminders.grace_minutes === g.value;
                      return (
                        <Pressable
                          key={g.value}
                          onPress={() => patch({ reminders: { ...cfg.reminders, grace_minutes: g.value } })}
                          style={[styles.chip, on && styles.chipOn]}
                        >
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{g.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
              <Text style={styles.hint}>
                Ejemplo: «Todavía no has registrado la comida.» Como máximo un aviso por comida y {cfg.reminders.max_per_day} al día, nunca entre las 23:00 y las 08:00. Respeta el interruptor de notificaciones del paciente.
              </Text>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: D.card, borderRadius: 16, padding: 16, marginBottom: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' },
  cardTitleInline: { fontSize: 14, fontWeight: '800', color: D.text },
  switchLabel: { fontSize: 13, fontWeight: '600', color: D.textMuted },
  hint: { fontSize: 11, color: D.textMuted, lineHeight: 16, marginBottom: 8 },
  section: {
    fontSize: 10, fontWeight: '800', color: D.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 12, paddingTop: 12, marginBottom: 6, borderTopWidth: 1, borderTopColor: D.border,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: D.text, flexShrink: 1 },
  modeGroup: { flexDirection: 'row', gap: 4 },
  modePill: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, backgroundColor: D.chip },
  modePillOn: { backgroundColor: D.primary },
  modePillText: { fontSize: 10, fontWeight: '700', color: D.textMuted },
  modePillTextOn: { color: '#fff' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: D.chipDark, alignItems: 'center', justifyContent: 'center' },
  radioOuterOn: { borderColor: D.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: D.primary },
  radioLabel: { fontSize: 13, color: D.text, flexShrink: 1 },
  radioSub: { fontSize: 11, color: D.textMuted },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 },
  stepperButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: D.chip, alignItems: 'center', justifyContent: 'center' },
  stepperButtonText: { fontSize: 18, fontWeight: '700', color: D.text },
  stepperValue: { fontSize: 16, fontWeight: '800', color: D.text, minWidth: 24, textAlign: 'center' },
  stepperUnit: { fontSize: 12, color: D.textMuted },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: D.chip },
  chipOn: { backgroundColor: D.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: D.textMuted },
  chipTextOn: { color: '#fff' },
  inlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 4 },
  inlineLabel: { fontSize: 12, fontWeight: '600', color: D.textMuted, flexShrink: 1 },
  inlineValue: { alignItems: 'flex-end' },
  pickerButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: D.chip },
  pickerText: { fontSize: 13, fontWeight: '700', color: D.text },
  pickerPlaceholder: { fontSize: 13, color: D.textMuted },
  pickerDone: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12 },
  pickerDoneText: { fontSize: 13, fontWeight: '700', color: D.primary },
  linkText: { fontSize: 12, color: D.primary, fontWeight: '600', marginBottom: 6 },
  mutedItalic: { fontSize: 12, color: D.textMuted, fontStyle: 'italic', marginBottom: 8 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  tagChipText: { fontSize: 12 },
  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tagInput: { flex: 1, backgroundColor: D.chip, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: D.text },
  tagCreateButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: D.chipDark },
  tagCreateButtonText: { fontSize: 11, fontWeight: '700', color: D.textMuted },
});
