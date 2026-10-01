import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateForDisplay, formatTime, toDateKey } from '../lib/dates';
import { saveEntry, deleteEntry, generateEntryId, getFoodEntries, syncFoodPhoto, type PoopEntry } from '../lib/storage';
import { getDoctorFoodConfig } from '../lib/preferences';
import { pickFoodPhoto, deleteLocalPhoto, deleteRemoteFoodPhoto, type PhotoSource } from '../lib/foodPhotos';
import { emitEvent, FLUXIA_UPDATED } from '../lib/events';
import {
  MEAL_TYPES, MEAL_TYPE_LABEL, PORTION_SIZES, PORTION_LABEL, FOOD_FIELD_LABEL, FOOD_TEXT,
  isFieldVisible, isFieldRequired, suggestMealType, validateFoodDraft, foodDraftToColumns,
  recentMeals, repeatMealDraft, entryTimestamp, isFutureOccurrence, mealTypeLabel, portionLabel,
  type FoodField, type MealType, type PortionSize, type FoodDraft,
} from '../lib/food';
import { D } from '../lib/design';
import { CameraIcon, GalleryIcon, PortionIcon, RepeatIcon } from './icons';
import FoodPhotoView from './FoodPhotoView';

// Formulario de comida del paciente (alta y edición). Solo muestra los campos
// que el profesional ha dejado visibles en la pauta; los obligatorios se
// marcan y se validan al guardar. Pensado para personas mayores: textos
// grandes, botones de al menos 56 px y el mínimo de pasos — con la pauta
// "solo foto" basta con Hacer foto → Guardar registro.

interface FoodEntryFormProps {
  /** Registro a editar; sin él, es un alta. */
  entry?: PoopEntry;
  /** Día preseleccionado (alta desde el calendario). */
  initialDate?: string | null;
  onSaved: (entry: PoopEntry, isNew: boolean) => void;
  onDeleted?: () => void;
}

interface FormState {
  date: string;
  hours: number;
  minutes: number;
  mealType: MealType | null;
  mealTouched: boolean;
  description: string;
  portion: PortionSize | null;
  tags: string[];
  notes: string;
  /** Foto nueva elegida en este formulario (copia local). */
  newPhotoUri: string | null;
  /** El paciente ha quitado la foto que tenía el registro. */
  photoRemoved: boolean;
}

function initialState(entry: PoopEntry | undefined, initialDate: string | null | undefined, suggest: boolean): FormState {
  if (entry) {
    const [h, m] = entry.time.split(':').map(Number);
    return {
      date: entry.date, hours: h, minutes: m,
      mealType: entry.food_meal_type ?? null, mealTouched: true,
      description: entry.food_description ?? '', portion: entry.food_portion ?? null,
      tags: entry.food_tags ?? [], notes: entry.notes ?? '',
      newPhotoUri: null, photoRemoved: false,
    };
  }
  const now = new Date();
  return {
    date: initialDate ?? toDateKey(now), hours: now.getHours(), minutes: now.getMinutes(),
    mealType: suggest ? suggestMealType(now.getHours(), now.getMinutes()) : null, mealTouched: false,
    description: '', portion: null, tags: [], notes: '',
    newPhotoUri: null, photoRemoved: false,
  };
}

export default function FoodEntryForm({ entry, initialDate, onSaved, onDeleted }: FoodEntryFormProps) {
  const cfg = getDoctorFoodConfig();
  const isEdit = !!entry;
  const show = (f: FoodField) => isFieldVisible(cfg, f);
  const req = (f: FoodField) => isFieldRequired(cfg, f);

  const [s, setS] = useState<FormState>(() => initialState(entry, initialDate, show('meal_type')));
  const set = (patch: Partial<FormState>) => setS((prev) => ({ ...prev, ...patch }));
  const [picker, setPicker] = useState<'none' | 'date' | 'time'>('none');
  const [showRecent, setShowRecent] = useState(false);
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const recent = useMemo(() => (isEdit ? [] : recentMeals(getFoodEntries(), 5)), [isEdit, savedBanner]);

  const existingPhoto = entry && !s.photoRemoved && (entry.photo_local_uri || entry.food_photo_path)
    ? { localUri: entry.photo_local_uri ?? null, path: entry.food_photo_path ?? null } : null;
  const hasPhoto = !!s.newPhotoUri || !!existingPhoto;

  const timeText = formatTime(s.hours, s.minutes);

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPicker('none');
    if (event.type !== 'set' || !selected) return;
    if (picker === 'date') {
      set({ date: toDateKey(selected) });
    } else {
      const h = selected.getHours();
      const m = selected.getMinutes();
      // Si el paciente no ha elegido el tipo a mano, la sugerencia sigue a la hora
      set({ hours: h, minutes: m, ...(!s.mealTouched && show('meal_type') ? { mealType: suggestMealType(h, m) } : {}) });
    }
  };

  const takePhoto = async (source: PhotoSource) => {
    setPhotoMsg(null);
    const res = await pickFoodPhoto(source);
    if (res.status === 'ok') {
      if (s.newPhotoUri) deleteLocalPhoto(s.newPhotoUri);
      set({ newPhotoUri: res.uri, photoRemoved: false });
      setErrors([]);
    } else if (res.status === 'denied') {
      setPhotoMsg(source === 'camera'
        ? 'Fluxia no tiene permiso para usar la cámara. Puedes activarlo en los Ajustes del teléfono.'
        : 'Fluxia no tiene permiso para ver tus fotos. Puedes activarlo en los Ajustes del teléfono.');
    } else if (res.status === 'error') {
      setPhotoMsg('No se ha podido cargar la foto. Inténtalo de nuevo.');
    }
  };

  const removePhoto = () => {
    if (s.newPhotoUri) {
      deleteLocalPhoto(s.newPhotoUri);
      set({ newPhotoUri: null });
    } else {
      set({ photoRemoved: true });
    }
  };

  const applyRepeat = (source: PoopEntry) => {
    const d = repeatMealDraft(cfg, source);
    set({ mealType: d.meal_type ?? s.mealType, mealTouched: !!d.meal_type || s.mealTouched, description: d.description, portion: d.portion, tags: d.tags });
    setCopiedFrom(mealTypeLabel(source.food_meal_type) ?? source.food_description ?? 'comida anterior');
    setShowRecent(false);
    setErrors([]);
  };

  const toggleTag = (t: string) =>
    set({ tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] });

  const handleSave = () => {
    const draft: FoodDraft = {
      meal_type: s.mealType, description: s.description, portion: s.portion,
      tags: s.tags, notes: s.notes, hasPhoto,
    };
    const v = validateFoodDraft(cfg, draft);
    const errs: string[] = [];
    if (v.missing.length > 0) errs.push(`${FOOD_TEXT.missingFields}: ${v.missing.map((f) => FOOD_FIELD_LABEL[f]).join(', ')}.`);
    else if (v.empty) errs.push(FOOD_TEXT.emptyRecord);
    if (isFutureOccurrence(s.date, timeText)) errs.push('La fecha y la hora no pueden ser posteriores a ahora.');
    setErrors(errs);
    if (errs.length > 0) return;

    const cols = foodDraftToColumns(cfg, draft);
    const id = entry?.id ?? generateEntryId();

    // Foto: nueva → copia local pendiente de subir (sustituye a la anterior);
    // quitada → se borra en Storage; sin cambios → se conserva.
    let food_photo_path = entry?.food_photo_path ?? null;
    let photo_local_uri = entry?.photo_local_uri ?? null;
    if (s.newPhotoUri || s.photoRemoved) {
      if (photo_local_uri && photo_local_uri !== s.newPhotoUri) deleteLocalPhoto(photo_local_uri);
      if (s.photoRemoved && !s.newPhotoUri) deleteRemoteFoodPhoto(food_photo_path);
      food_photo_path = null;
      photo_local_uri = s.newPhotoUri;
    }

    const saved: PoopEntry = {
      id,
      date: s.date,
      time: timeText,
      timestamp: entryTimestamp(s.date, timeText),
      entry_type: 'food',
      notes: cols.notes,
      food_meal_type: cols.food_meal_type,
      food_description: cols.food_description,
      food_portion: cols.food_portion,
      food_tags: cols.food_tags,
      food_photo_path,
      photo_local_uri,
      bristol: null, floats: null, color: null, quantity: null, duration: null, feces_texture: null, symptoms: [],
      urine_type: null, urine_quantity: null, urine_color: null, urine_characteristics: [], urine_urgency: null, during_sleep: null,
    };
    saveEntry(saved);
    emitEvent(FLUXIA_UPDATED);
    if (photo_local_uri && !food_photo_path) syncFoodPhoto(id);

    if (!isEdit) {
      const label = mealTypeLabel(saved.food_meal_type) ?? FOOD_TEXT.module;
      setSavedBanner(`${FOOD_TEXT.saved}: ${label}, ${formatDateForDisplay(saved.date).toLowerCase()} a las ${saved.time}`);
      setS(initialState(undefined, initialDate, show('meal_type')));
      setCopiedFrom(null);
    }
    onSaved(saved, !isEdit);
  };

  const label = (f: FoodField, text: string = FOOD_FIELD_LABEL[f]) => (
    <Text style={styles.sectionLabel}>
      {text}
      {req(f) && <Text style={styles.requiredMark}>{`  ·  ${FOOD_TEXT.required}`}</Text>}
    </Text>
  );

  return (
    <View>
      {savedBanner && (
        <Pressable onPress={() => setSavedBanner(null)} style={styles.successBanner} accessibilityRole="alert">
          <Text style={styles.successText}>✓ {savedBanner}</Text>
        </Pressable>
      )}

      {/* Repetir comida */}
      {!isEdit && recent.length > 0 && (
        <View style={styles.block}>
          <Pressable
            onPress={() => setShowRecent((v) => !v)}
            style={styles.repeatButton}
            accessibilityRole="button"
            accessibilityState={{ expanded: showRecent }}
          >
            <RepeatIcon color={D.primary} />
            <Text style={styles.repeatText}>{FOOD_TEXT.repeatMeal}</Text>
          </Pressable>
          {showRecent && (
            <View style={styles.recentList}>
              {recent.map((r) => (
                <Pressable key={r.id} onPress={() => applyRepeat(r)} style={styles.recentCard} accessibilityRole="button">
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {[mealTypeLabel(r.food_meal_type), r.food_description].filter(Boolean).join(' · ') || FOOD_TEXT.module}
                  </Text>
                  <Text style={styles.recentMeta} numberOfLines={1}>
                    {[formatDateForDisplay(r.date).toLowerCase(), portionLabel(r.food_portion), ...(r.food_tags ?? [])].filter(Boolean).join(' · ')}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {copiedFrom && (
            <Text style={styles.copiedNote}>
              Datos copiados de «{copiedFrom}». {show('photo') ? 'Puedes hacer una foto nueva si quieres.' : ''}
            </Text>
          )}
        </View>
      )}

      {/* Foto */}
      {show('photo') && (
        <View style={styles.sectionCard}>
          {label('photo')}
          {hasPhoto ? (
            <View>
              <FoodPhotoView
                localUri={s.newPhotoUri ?? existingPhoto?.localUri}
                path={s.newPhotoUri ? null : existingPhoto?.path}
                style={styles.photoPreview}
                accessibilityLabel="Foto de la comida"
              />
              <View style={styles.rowGap10}>
                <Pressable onPress={() => takePhoto('camera')} style={[styles.secondaryButton, styles.flex1]} accessibilityRole="button">
                  <Text style={styles.secondaryText}>Cambiar foto</Text>
                </Pressable>
                <Pressable onPress={removePhoto} style={[styles.secondaryButton, styles.flex1]} accessibilityRole="button">
                  <Text style={[styles.secondaryText, { color: D.danger }]}>Quitar foto</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.rowGap10}>
              <Pressable onPress={() => takePhoto('camera')} style={[styles.photoButton, styles.photoButtonPrimary]} accessibilityRole="button">
                <CameraIcon color={D.primaryText} size={30} />
                <Text style={[styles.photoButtonText, { color: D.primaryText }]}>{FOOD_TEXT.takePhoto}</Text>
              </Pressable>
              <Pressable onPress={() => takePhoto('library')} style={styles.photoButton} accessibilityRole="button">
                <GalleryIcon color={D.primary} size={30} />
                <Text style={styles.photoButtonText}>{FOOD_TEXT.pickFromGallery}</Text>
              </Pressable>
            </View>
          )}
          {photoMsg && <Text style={styles.inlineError}>{photoMsg}</Text>}
        </View>
      )}

      {/* Fecha y hora (siempre se registran; editables para registros a posteriori) */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>¿Cuándo?</Text>
        <Text style={styles.whenText}>{formatDateForDisplay(s.date)} · {timeText}</Text>
        <View style={styles.rowGap10}>
          <Pressable onPress={() => setPicker('date')} style={[styles.secondaryButton, styles.flex1]} accessibilityRole="button">
            <Text style={styles.secondaryText}>Cambiar día</Text>
          </Pressable>
          <Pressable onPress={() => setPicker('time')} style={[styles.secondaryButton, styles.flex1]} accessibilityRole="button">
            <Text style={styles.secondaryText}>Cambiar hora</Text>
          </Pressable>
        </View>
        {picker !== 'none' && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={picker === 'date'
                ? new Date(entryTimestamp(s.date, '12:00'))
                : new Date(2000, 0, 1, s.hours, s.minutes)}
              mode={picker}
              is24Hour
              maximumDate={picker === 'date' ? new Date() : undefined}
              display={Platform.OS === 'ios' ? (picker === 'date' ? 'inline' : 'spinner') : 'default'}
              onChange={onPickerChange}
              locale="es-ES"
            />
            {Platform.OS === 'ios' && (
              <Pressable onPress={() => setPicker('none')} style={styles.doneButton}>
                <Text style={styles.doneText}>Listo</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Tipo de comida */}
      {show('meal_type') && (
        <View style={styles.sectionCard}>
          {label('meal_type')}
          <View style={styles.grid2}>
            {MEAL_TYPES.map((m) => {
              const active = s.mealType === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => set({ mealType: active ? null : m, mealTouched: true })}
                  style={[styles.bigOption, active ? styles.optionActive : styles.optionInactive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.bigOptionText, { color: active ? D.primaryText : D.text }]}>{MEAL_TYPE_LABEL[m]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* ¿Qué has comido? */}
      {show('description') && (
        <View style={styles.sectionCard}>
          {label('description')}
          <TextInput
            value={s.description}
            onChangeText={(t) => set({ description: t })}
            placeholder={FOOD_TEXT.descriptionPlaceholder}
            placeholderTextColor={D.textMuted}
            multiline
            maxLength={500}
            style={styles.textInput}
            accessibilityLabel={FOOD_FIELD_LABEL.description}
          />
        </View>
      )}

      {/* Cantidad */}
      {show('portion') && (
        <View style={styles.sectionCard}>
          {label('portion')}
          <View style={styles.rowGap10}>
            {PORTION_SIZES.map((p, i) => {
              const active = s.portion === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => set({ portion: active ? null : p })}
                  style={[styles.portionOption, active ? styles.optionActive : styles.optionInactive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={PORTION_LABEL[p]}
                >
                  <PortionIcon level={i as 0 | 1 | 2} color={active ? D.primaryText : D.primary} />
                  <Text style={[styles.bigOptionText, { color: active ? D.primaryText : D.text }]}>{PORTION_LABEL[p]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Etiquetas definidas por el profesional */}
      {show('tags') && cfg.tags.length > 0 && (
        <View style={styles.sectionCard}>
          {label('tags')}
          <View style={styles.wrap}>
            {cfg.tags.map((t) => {
              const active = s.tags.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => toggleTag(t)}
                  style={[styles.tagChip, active ? styles.optionActive : styles.optionInactive]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <Text style={[styles.tagText, { color: active ? D.primaryText : D.text }]}>{active ? `✓ ${t}` : t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Observaciones */}
      {show('notes') && (
        <View style={styles.sectionCard}>
          {label('notes')}
          <TextInput
            value={s.notes}
            onChangeText={(t) => set({ notes: t })}
            placeholder={FOOD_TEXT.notesPlaceholder}
            placeholderTextColor={D.textMuted}
            multiline
            style={styles.textInput}
            accessibilityLabel={FOOD_FIELD_LABEL.notes}
          />
        </View>
      )}

      {errors.length > 0 && (
        <View style={styles.errorBox} accessibilityRole="alert">
          {errors.map((e) => <Text key={e} style={styles.errorText}>{e}</Text>)}
        </View>
      )}

      <Pressable onPress={handleSave} style={styles.saveButton} accessibilityRole="button">
        <Text style={styles.saveButtonText}>{FOOD_TEXT.save}</Text>
      </Pressable>

      {isEdit && onDeleted && (
        confirmDelete ? (
          <View style={styles.rowGap10}>
            <Pressable onPress={() => setConfirmDelete(false)} style={[styles.secondaryButton, styles.flex1]}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => { deleteEntry(entry!.id); emitEvent(FLUXIA_UPDATED); onDeleted(); }}
              style={[styles.secondaryButton, styles.flex1, { backgroundColor: D.dangerBg }]}
            >
              <Text style={[styles.secondaryText, { color: D.danger }]}>Sí, eliminar</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteLink}>
            <Text style={styles.deleteText}>Eliminar registro</Text>
          </Pressable>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 10 },
  flex1: { flex: 1 },
  sectionCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: D.card,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: D.secondary,
    marginBottom: 12,
  },
  requiredMark: {
    fontSize: 13,
    fontWeight: '700',
    color: D.warningText,
  },
  rowGap10: { flexDirection: 'row', gap: 10 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  successBanner: {
    backgroundColor: D.accentSoft,
    borderLeftWidth: 5,
    borderLeftColor: D.success,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  successText: { fontSize: 16, fontWeight: '700', color: D.text, lineHeight: 22 },
  repeatButton: {
    minHeight: 56,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: D.primary,
    backgroundColor: D.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  repeatText: { fontSize: 17, fontWeight: '800', color: D.primary },
  recentList: { marginTop: 10, gap: 8 },
  recentCard: {
    minHeight: 64,
    backgroundColor: D.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: D.border,
    justifyContent: 'center',
  },
  recentTitle: { fontSize: 17, fontWeight: '700', color: D.text },
  recentMeta: { fontSize: 14, color: D.textMuted, marginTop: 3 },
  copiedNote: { fontSize: 14, color: D.textMuted, marginTop: 8, lineHeight: 20 },
  photoButton: {
    flex: 1,
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: D.primary,
    backgroundColor: D.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  photoButtonPrimary: { backgroundColor: D.primary },
  photoButtonText: { fontSize: 16, fontWeight: '800', color: D.primary, textAlign: 'center' },
  photoPreview: { width: '100%', height: 220, borderRadius: 12, marginBottom: 10 },
  whenText: { fontSize: 18, fontWeight: '700', color: D.text, marginBottom: 12 },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: D.chip,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryText: { fontSize: 16, fontWeight: '700', color: D.text },
  pickerWrap: { marginTop: 12, alignItems: 'center' },
  doneButton: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 99, backgroundColor: D.primary, marginTop: 6 },
  doneText: { color: D.primaryText, fontWeight: '800', fontSize: 16 },
  bigOption: {
    width: '48%',
    flexGrow: 1,
    minHeight: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  optionActive: { backgroundColor: D.primary },
  optionInactive: { backgroundColor: D.chip },
  bigOptionText: { fontSize: 17, fontWeight: '700' },
  portionOption: {
    flex: 1,
    minHeight: 96,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tagChip: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 99,
    justifyContent: 'center',
  },
  tagText: { fontSize: 16, fontWeight: '700' },
  textInput: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: D.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 17,
    color: D.text,
    backgroundColor: D.bg,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  inlineError: { fontSize: 14, color: D.danger, marginTop: 10, lineHeight: 20 },
  errorBox: {
    backgroundColor: D.dangerBg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 4,
  },
  errorText: { fontSize: 16, fontWeight: '700', color: D.danger, lineHeight: 22 },
  saveButton: {
    width: '100%',
    minHeight: 60,
    borderRadius: 99,
    backgroundColor: D.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  saveButtonText: { fontSize: 19, fontWeight: '800', color: D.primaryText },
  deleteLink: { alignItems: 'center', paddingVertical: 14 },
  deleteText: { fontSize: 16, fontWeight: '700', color: D.danger },
});
