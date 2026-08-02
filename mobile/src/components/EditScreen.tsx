import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Image, ScrollView, StyleSheet, Platform, Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateForDisplay, formatTime, toDateKey } from '../lib/dates';
import { saveEntry, deleteEntry, type PoopEntry } from '../lib/storage';
import { getDoctorHiddenFields } from '../lib/preferences';
import { emitEvent, FLUXIA_UPDATED } from '../lib/events';
import {
  FLOAT_OPTIONS, COLOR_OPTIONS, URINE_COLOR_OPTIONS, URINE_TYPE_OPTIONS,
  URINE_CHARACTERISTICS, DURATION_OPTIONS, FECES_TEXTURE_OPTIONS, SYMPTOMS,
} from '../lib/formOptions';
import BristolPicker from './BristolPicker';
import { D } from '../lib/design';
import { CloseIcon } from './icons';
import LigeroIcon from '../assets/Ligero-icon.svg';
import PesadoIcon from '../assets/Pesado-icon.svg';

interface EditScreenProps {
  entry: PoopEntry;
  onClose: () => void;
}

export default function EditScreen({ entry, onClose }: EditScreenProps) {
  const hiddenFields = getDoctorHiddenFields();
  const show = (field: string) => !hiddenFields.includes(field);
  const [h, m] = entry.time.split(':').map(Number);
  const [currentDate, setCurrentDate] = useState(entry.date);
  const [hours, setHours] = useState(h);
  const [minutes, setMinutes] = useState(m);
  const [notes, setNotes] = useState(entry.notes);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isUrine = entry.entry_type === 'urine';

  // Poop fields
  const [bristol, setBristol] = useState<number | null>(entry.bristol ?? null);
  const [floats, setFloats] = useState<'floats' | 'sinks' | 'both' | null>(
    (entry.floats as any) === true ? 'floats' : (entry.floats as any) === false ? 'sinks' : (entry.floats ?? null)
  );
  const [color, setColor] = useState<string | null>(entry.color ?? null);
  const [quantity, setQuantity] = useState<number>(entry.quantity ?? 50);
  const [duration, setDuration] = useState<'short' | 'medium' | 'long' | null>(entry.duration ?? null);
  const [fecesTexture, setFecesTexture] = useState<'hard' | 'normal' | 'soft' | 'loose' | 'liquid' | 'oily' | null>(entry.feces_texture ?? null);
  const [symptoms, setSymptoms] = useState<string[]>(entry.symptoms ?? []);
  const [weightLoss, setWeightLoss] = useState((entry.symptoms ?? []).includes('weight_loss'));

  // Urine fields
  const [urineType, setUrineType] = useState<'voluntary' | 'involuntary_escape' | 'involuntary_drip' | null>(entry.urine_type ?? null);
  const [urineQuantity, setUrineQuantity] = useState<number>(entry.urine_quantity ?? 0);
  const [urineColor, setUrineColor] = useState<string | null>(entry.urine_color ?? null);
  const [urineCharacteristics, setUrineCharacteristics] = useState<string[]>(entry.urine_characteristics ?? []);
  const [urineUrgency, setUrineUrgency] = useState<number | null>(entry.urine_urgency ?? null);
  const [duringSleep, setDuringSleep] = useState<boolean | null>(entry.during_sleep ?? null);

  const dayText = formatDateForDisplay(currentDate);
  const timeText = formatTime(hours, minutes);

  const toggleSymptom = (key: string) =>
    setSymptoms(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);

  const toggleUrineChar = (key: string) =>
    setUrineCharacteristics(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);

  const quantityLabel = quantity <= 25 ? 'Ligero' : quantity <= 50 ? 'Moderado' : quantity <= 75 ? 'Abundante' : 'Pesado';

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selected) setCurrentDate(toDateKey(selected));
  };

  const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'set' && selected) {
      setHours(selected.getHours());
      setMinutes(selected.getMinutes());
    }
  };

  const handleSave = () => {
    const [y, mo, d] = currentDate.split('-').map(Number);
    const finalSymptoms = [...symptoms];
    if (weightLoss && !finalSymptoms.includes('weight_loss')) {
      finalSymptoms.push('weight_loss');
    } else if (!weightLoss && finalSymptoms.includes('weight_loss')) {
      finalSymptoms.splice(finalSymptoms.indexOf('weight_loss'), 1);
    }
    saveEntry({
      id: entry.id,
      date: currentDate,
      time: timeText,
      notes,
      timestamp: new Date(y, mo - 1, d, hours, minutes).getTime(),
      entry_type: entry.entry_type ?? 'poop',
      bristol: isUrine ? null : bristol,
      floats: isUrine ? null : floats,
      color: isUrine ? null : color,
      quantity: isUrine ? null : quantity,
      duration: isUrine ? null : duration,
      feces_texture: isUrine ? null : fecesTexture,
      symptoms: isUrine ? [] : finalSymptoms,
      urine_type: isUrine ? urineType : null,
      urine_quantity: isUrine ? urineQuantity : null,
      urine_color: isUrine ? urineColor : null,
      urine_characteristics: isUrine ? urineCharacteristics : [],
      urine_urgency: isUrine ? urineUrgency : null,
      during_sleep: isUrine ? duringSleep : null,
    });
    emitEvent(FLUXIA_UPDATED);
    onClose();
  };

  const handleDelete = () => {
    deleteEntry(entry.id);
    emitEvent(FLUXIA_UPDATED);
    onClose();
  };

  const chip = (active: boolean) => [styles.chip, active ? styles.chipActive : styles.chipInactive];
  const chipText = (active: boolean) => [styles.chipLabel, { color: active ? D.primaryText : D.chipText }];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
        {/* Close button */}
        <Pressable onPress={onClose} style={styles.closeButton}>
          <CloseIcon size={24} />
        </Pressable>

        {/* Scrollable content */}
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Day */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>DÍA</Text>
            <View style={styles.editRow}>
              <Text style={styles.dayText}>{dayText}</Text>
              <Pressable onPress={() => setShowDatePicker(true)} style={styles.changeButton}>
                <Text style={styles.changeButtonText}>cambiar</Text>
              </Pressable>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={(() => { const [y, mo, d] = currentDate.split('-').map(Number); return new Date(y, mo - 1, d); })()}
                mode="date"
                maximumDate={new Date()}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{isUrine ? '💧 Micción' : '💩 Deposición'}</Text>
            </View>
          </View>

          {/* Time */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>HORA</Text>
            <View style={styles.editRow}>
              <Text style={styles.timeText}>{timeText}</Text>
              <Pressable onPress={() => setShowTimePicker(true)} style={styles.changeButton}>
                <Text style={styles.changeButtonText}>cambiar</Text>
              </Pressable>
            </View>
            {showTimePicker && (
              <DateTimePicker
                value={new Date(2000, 0, 1, hours, minutes)}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}
          </View>

          {/* ── POOP FORM ── */}
          {!isUrine && <>
            {show('bristol') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>¿QUÉ FORMA TENÍA?</Text>
                <Text style={styles.sectionHint}>Escala de Bristol — selecciona el tipo más parecido</Text>
                <BristolPicker value={bristol} onChange={setBristol} />
              </View>
            )}

            {show('color') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>COLOR</Text>
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map(opt => (
                    <Pressable
                      key={opt.hex}
                      onPress={() => setColor(color === opt.hex ? null : opt.hex)}
                      style={styles.colorCell}
                    >
                      <View style={color === opt.hex ? styles.colorSelectedRing : undefined}>
                        <View style={[
                          styles.colorSwatch,
                          { backgroundColor: opt.hex },
                          color === opt.hex && styles.colorSelected,
                        ]} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {show('floats') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>¿FLOTA?</Text>
                <View style={styles.rowGap8}>
                  {FLOAT_OPTIONS.map(opt => {
                    const isActive = floats === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setFloats(floats === opt.value ? null : opt.value)}
                        style={[styles.floatOption, { borderColor: isActive ? D.primary : 'transparent' }]}
                      >
                        <Image source={opt.img} style={styles.floatImage} resizeMode="contain" />
                        <Text style={styles.floatLabel}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>PÉRDIDA DE PESO</Text>
              <View style={styles.rowGap10}>
                {[{ label: 'No', value: false }, { label: 'Sí', value: true }].map(opt => {
                  const active = weightLoss === opt.value;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      onPress={() => setWeightLoss(opt.value)}
                      style={[styles.yesNoButton, { backgroundColor: active ? D.primary : D.chip }]}
                    >
                      <Text style={[styles.yesNoText, { color: active ? D.primaryText : D.text }]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {show('quantity') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>
                  CANTIDAD — <Text style={styles.sectionLabelLight}>{quantityLabel} ({quantity})</Text>
                </Text>
                <Slider
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={quantity}
                  onValueChange={setQuantity}
                  minimumTrackTintColor={D.primary}
                  maximumTrackTintColor={D.chipDark}
                  thumbTintColor={D.primary}
                />
                <View style={styles.quantityScale}>
                  <LigeroIcon width={20} height={20} opacity={0.5} />
                  <Text style={styles.quantityScaleText}>{quantityLabel}</Text>
                  <PesadoIcon width={20} height={20} opacity={0.5} />
                </View>
              </View>
            )}

            {show('duration') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>DURACIÓN</Text>
                <View style={styles.rowGap8}>
                  {DURATION_OPTIONS.map(opt => {
                    const active = duration === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setDuration(duration === opt.value ? null : opt.value)}
                        style={[styles.durationChip, active ? styles.chipActive : styles.chipInactive]}
                      >
                        <Text style={chipText(active)}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>TEXTURA</Text>
              <View style={styles.wrapGap8}>
                {FECES_TEXTURE_OPTIONS.map(opt => {
                  const active = fecesTexture === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setFecesTexture(fecesTexture === opt.value ? null : opt.value)}
                      style={chip(active)}
                    >
                      <Text style={chipText(active)}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {show('symptoms') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>SÍNTOMAS</Text>
                <View style={styles.wrapGap8}>
                  {SYMPTOMS.map(s => {
                    const active = symptoms.includes(s.key);
                    return (
                      <Pressable key={s.key} onPress={() => toggleSymptom(s.key)} style={chip(active)}>
                        <Text style={chipText(active)}>{s.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </>}

          {/* ── URINE FORM ── */}
          {isUrine && <>
            {show('urine_type') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>TIPO DE MICCIÓN</Text>
                <View style={styles.colGap8}>
                  {URINE_TYPE_OPTIONS.map(opt => {
                    const active = urineType === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setUrineType(urineType === opt.value ? null : opt.value)}
                        style={[styles.urineTypeButton, active ? styles.chipActive : styles.chipInactive]}
                      >
                        <Text style={[styles.urineTypeText, { color: active ? D.primaryText : D.chipText }]}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {show('urine_quantity') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>
                  CANTIDAD — <Text style={styles.sectionLabelLight}>{urineQuantity} ml</Text>
                </Text>
                <Slider
                  minimumValue={0}
                  maximumValue={500}
                  step={10}
                  value={urineQuantity}
                  onValueChange={setUrineQuantity}
                  minimumTrackTintColor={D.primary}
                  maximumTrackTintColor={D.chipDark}
                  thumbTintColor={D.primary}
                />
                <View style={styles.sliderScale}>
                  <Text style={styles.sliderScaleText}>0 ml</Text>
                  <Text style={styles.sliderScaleText}>500 ml</Text>
                </View>
              </View>
            )}

            {show('urine_color') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>COLOR</Text>
                <View style={styles.urineColorRow}>
                  {URINE_COLOR_OPTIONS.map(opt => (
                    <Pressable
                      key={opt.hex}
                      onPress={() => setUrineColor(urineColor === opt.hex ? null : opt.hex)}
                      style={styles.urineColorCell}
                    >
                      <View style={urineColor === opt.hex ? styles.colorSelectedRing : undefined}>
                        <View style={[
                          styles.urineColorSwatch,
                          { backgroundColor: opt.hex },
                          urineColor === opt.hex ? styles.colorSelected : styles.urineColorBorder,
                        ]} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {show('urine_characteristics') && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>CARACTERÍSTICAS</Text>
                <View style={styles.wrapGap8}>
                  {URINE_CHARACTERISTICS.map(c => {
                    const active = urineCharacteristics.includes(c.key);
                    return (
                      <Pressable key={c.key} onPress={() => toggleUrineChar(c.key)} style={chip(active)}>
                        <Text style={chipText(active)}>{c.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>NIVEL DE URGENCIA</Text>
              <View style={styles.rowGap8}>
                {[1, 2, 3, 4, 5].map(n => {
                  const active = urineUrgency === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setUrineUrgency(urineUrgency === n ? null : n)}
                      style={[styles.urgencyButton, active ? styles.chipActive : styles.chipInactive]}
                    >
                      <Text style={[styles.urgencyText, { color: active ? D.primaryText : D.chipText }]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.sliderScale}>
                <Text style={styles.sliderScaleText}>Sin urgencia</Text>
                <Text style={styles.sliderScaleText}>Urgencia extrema</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>¿DURANTE EL SUEÑO?</Text>
              <View style={styles.rowGap8}>
                {([{ label: 'Sí', value: true }, { label: 'No', value: false }] as const).map(({ label, value }) => {
                  const active = duringSleep === value;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => setDuringSleep(duringSleep === value ? null : value)}
                      style={[styles.urgencyButton, active ? styles.chipActive : styles.chipInactive]}
                    >
                      <Text style={[styles.yesNoText, { color: active ? D.primaryText : D.chipText }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>}

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>NOTAS</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Escribe tus notas aquí..."
              placeholderTextColor={D.textMuted}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          </View>
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actions}>
          {confirmDelete ? (
            <View style={styles.confirmDelete}>
              <Text style={styles.confirmText}>¿Seguro que quieres eliminar este registro?</Text>
              <View style={styles.rowGap8}>
                <Pressable onPress={() => setConfirmDelete(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={handleDelete} style={styles.deleteConfirmButton}>
                  <Text style={styles.deleteConfirmText}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.rowGap8}>
              <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>🗑️ eliminar</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>guardar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: D.bg,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: D.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: D.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionLabelLight: {
    fontWeight: '400',
  },
  sectionHint: {
    fontSize: 11,
    color: D.textMuted,
    marginBottom: 10,
    marginTop: -4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dayText: {
    fontSize: 18,
    fontWeight: '700',
    color: D.text,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    color: D.text,
  },
  changeButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 50,
    backgroundColor: D.primary,
  },
  changeButtonText: {
    color: D.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: D.chip,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: D.chipText,
  },
  rowGap8: {
    flexDirection: 'row',
    gap: 8,
  },
  rowGap10: {
    flexDirection: 'row',
    gap: 10,
  },
  colGap8: {
    gap: 8,
  },
  wrapGap8: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorCell: {
    width: '25%',
    padding: 5,
  },
  colorSwatch: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  colorSelectedRing: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
  },
  floatOption: {
    flex: 1,
    paddingBottom: 8,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    gap: 6,
    backgroundColor: D.chip,
  },
  floatImage: {
    width: 74,
    height: 74,
  },
  floatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: D.text,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  yesNoText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quantityScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  quantityScaleText: {
    fontSize: 11,
    fontWeight: '600',
    color: D.text,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  chipActive: {
    backgroundColor: D.primary,
  },
  chipInactive: {
    backgroundColor: D.chip,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  urineTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  urineTypeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  urineColorRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  urineColorCell: {
    flex: 1,
  },
  urineColorSwatch: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
  },
  urineColorBorder: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  sliderScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderScaleText: {
    fontSize: 10,
    color: D.textMuted,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  notesInput: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: D.text,
    backgroundColor: D.bg,
    borderWidth: 1,
    borderColor: D.border,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actions: {
    flexShrink: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  confirmDelete: {
    alignItems: 'center',
    gap: 8,
  },
  confirmText: {
    fontSize: 14,
    color: D.text,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: D.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: D.text,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: D.danger,
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: D.dangerBg,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: D.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: D.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: D.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
});
