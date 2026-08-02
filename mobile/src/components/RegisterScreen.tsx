import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Image, ScrollView, StyleSheet, Platform, Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDateForDisplay, formatTime, toDateKey } from '../lib/dates';
import { saveEntry, generateEntryId } from '../lib/storage';
import { getDoctorHiddenFields, getDoctorImage, getDoctorEntryTypeMode } from '../lib/preferences';
import { emitEvent, FLUXIA_UPDATED } from '../lib/events';
import {
  FLOAT_OPTIONS, COLOR_OPTIONS, URINE_COLOR_OPTIONS, URINE_TYPE_OPTIONS,
  URINE_CHARACTERISTICS, DURATION_OPTIONS, FECES_TEXTURE_OPTIONS, SYMPTOMS,
} from '../lib/formOptions';
import BristolPicker from './BristolPicker';
import { D } from '../lib/design';
import { CloseIcon, EditIcon, PoopSwitchIcon, UrineSwitchIcon } from './icons';
import { BOTTOM_NAV_HEIGHT } from './BottomNav';
import LigeroIcon from '../assets/Ligero-icon.svg';
import PesadoIcon from '../assets/Pesado-icon.svg';

interface RegisterScreenProps {
  date?: string | null;
  isTab?: boolean;
  onClose?: () => void;
  onSuccess: (date: string, time: string, entryType: 'poop' | 'urine', entryId: string) => void;
}

export default function RegisterScreen({ date, isTab, onClose, onSuccess }: RegisterScreenProps) {
  const hiddenFields = getDoctorHiddenFields();
  const show = (field: string) => !hiddenFields.includes(field);
  const entryTypeMode = getDoctorEntryTypeMode();

  const now = new Date();
  const [entryType, setEntryType] = useState<'poop' | 'urine'>(
    entryTypeMode === 'urine_only' ? 'urine' : 'poop'
  );
  const [hours, setHours] = useState(now.getHours());
  const [minutes, setMinutes] = useState(now.getMinutes());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');

  // Poop fields
  const [bristol, setBristol] = useState<number | null>(null);
  const [floats, setFloats] = useState<'floats' | 'sinks' | 'both' | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(50);
  const [duration, setDuration] = useState<'short' | 'medium' | 'long' | null>(null);
  const [fecesTexture, setFecesTexture] = useState<'hard' | 'normal' | 'soft' | 'loose' | 'liquid' | 'oily' | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [weightLoss, setWeightLoss] = useState(false);

  // Urine fields
  const [urineType, setUrineType] = useState<'voluntary' | 'involuntary_escape' | 'involuntary_drip' | null>(null);
  const [urineQuantity, setUrineQuantity] = useState(0);
  const [urineColor, setUrineColor] = useState<string | null>(null);
  const [urineCharacteristics, setUrineCharacteristics] = useState<string[]>([]);
  const [urineUrgency, setUrineUrgency] = useState<number | null>(null);
  const [duringSleep, setDuringSleep] = useState<boolean | null>(null);

  const targetDate = date ?? toDateKey(now);
  const dayText = formatDateForDisplay(targetDate);
  const timeText = formatTime(hours, minutes);
  const quantityLabel = quantity <= 25 ? 'Ligero' : quantity <= 50 ? 'Moderado' : quantity <= 75 ? 'Abundante' : 'Pesado';
  const isUrine = entryType === 'urine';
  const doctorImage = getDoctorImage();

  const toggleSymptom = (key: string) =>
    setSymptoms(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  const toggleUrineChar = (key: string) =>
    setUrineCharacteristics(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);

  const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'set' && selected) {
      setHours(selected.getHours());
      setMinutes(selected.getMinutes());
    }
  };

  const handleSave = () => {
    const [y, mo, d] = targetDate.split('-').map(Number);
    const entryId = generateEntryId();
    const finalSymptoms = [...symptoms];
    if (weightLoss && !finalSymptoms.includes('weight_loss')) {
      finalSymptoms.push('weight_loss');
    } else if (!weightLoss && finalSymptoms.includes('weight_loss')) {
      finalSymptoms.splice(finalSymptoms.indexOf('weight_loss'), 1);
    }
    saveEntry({
      id: entryId,
      date: targetDate,
      time: timeText,
      notes,
      timestamp: new Date(y, mo - 1, d, hours, minutes).getTime(),
      entry_type: entryType,
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
    onSuccess(targetDate, timeText, entryType, entryId);
  };

  const chip = (active: boolean) => [styles.chip, active ? styles.chipActive : styles.chipInactive];
  const chipText = (active: boolean) => [styles.chipLabel, { color: active ? D.primaryText : D.chipText }];

  const content = (
    <ScrollView
      style={{ backgroundColor: D.bg }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: isTab ? 16 : 60, paddingBottom: 32 + (isTab ? BOTTOM_NAV_HEIGHT : 0) },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo (only in tab mode) */}
      {isTab && (
        <View style={styles.logoRow}>
          <Image
            source={doctorImage ? { uri: doctorImage } : require('../assets/fluxia-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Registro</Text>
        {!isTab && onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <CloseIcon />
          </Pressable>
        )}
      </View>

      {/* Date + time row */}
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          {dayText} {timeText}
        </Text>
        <Pressable onPress={() => setShowTimePicker(true)}>
          <EditIcon />
        </Pressable>
      </View>

      {showTimePicker && (
        <View style={styles.timePickerWrap}>
          <DateTimePicker
            value={new Date(2000, 0, 1, hours, minutes)}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
          {Platform.OS === 'ios' && (
            <Pressable onPress={() => setShowTimePicker(false)} style={styles.timeDone}>
              <Text style={styles.timeDoneText}>Listo</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Entry type toggle — only shown when both types are allowed */}
      {entryTypeMode === 'both' && (
        <View style={styles.typeToggle}>
          <Pressable
            onPress={() => setEntryType('poop')}
            style={[styles.typeButton, entryType === 'poop' && styles.typeButtonActive]}
          >
            <PoopSwitchIcon color={entryType === 'poop' ? D.primary : '#ffffff'} />
          </Pressable>
          <Pressable
            onPress={() => setEntryType('urine')}
            style={[styles.typeButton, entryType === 'urine' && styles.typeButtonActive]}
          >
            <UrineSwitchIcon color={entryType === 'urine' ? D.primary : '#ffffff'} />
          </Pressable>
        </View>
      )}

      {/* ── POOP FORM ── */}
      {!isUrine && <>
        {show('bristol') && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Forma</Text>
            <BristolPicker value={bristol} onChange={setBristol} />
          </View>
        )}

        {show('floats') && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Flotación</Text>
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

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Pérdida de peso</Text>
          <View style={styles.rowGap10}>
            {[{ label: 'No', value: false }, { label: 'Sí', value: true }].map(opt => {
              const active = weightLoss === opt.value;
              return (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => setWeightLoss(opt.value)}
                  style={[styles.yesNoButton, { backgroundColor: active ? D.primary : D.navBg }]}
                >
                  <Text style={[styles.yesNoText, { color: active ? D.primaryText : D.text }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {show('color') && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Color</Text>
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

        {show('quantity') && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Cantidad</Text>
            <View style={styles.sliderRow}>
              <LigeroIcon width={24} height={24} opacity={0.6} />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={quantity}
                onValueChange={setQuantity}
                minimumTrackTintColor={D.primary}
                maximumTrackTintColor={D.chipDark}
                thumbTintColor={D.primary}
              />
              <PesadoIcon width={24} height={24} opacity={0.6} />
            </View>
            <Text style={styles.quantityLabel}>{quantityLabel}</Text>
          </View>
        )}

        {show('duration') && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Duración</Text>
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

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Textura</Text>
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
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Síntomas</Text>
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
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Tipo de micción</Text>
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
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>
              Cantidad — <Text style={styles.sectionLabelLight}>{urineQuantity} ml</Text>
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
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Color</Text>
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
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Características</Text>
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

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Nivel de Urgencia</Text>
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
            <Text style={styles.urgencyScaleText}>Sin urgencia</Text>
            <Text style={styles.urgencyScaleText}>Urgencia extrema</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>¿Durante el sueño?</Text>
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
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>Notas</Text>
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

      {/* Save button */}
      <Pressable onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Registrar</Text>
      </Pressable>
    </ScrollView>
  );

  if (isTab) {
    return <View style={styles.tabWrapper}>{content}</View>;
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView style={styles.tabWrapper} edges={['top', 'bottom']}>{content}</SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tabWrapper: {
    flex: 1,
    backgroundColor: D.bg,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    height: 90,
    width: 220,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: D.secondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: D.text,
  },
  timePickerWrap: {
    marginBottom: 12,
    alignItems: 'center',
  },
  timeDone: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 99,
    backgroundColor: D.primary,
  },
  timeDoneText: {
    color: D.primaryText,
    fontWeight: '700',
    fontSize: 14,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: D.primary,
    borderRadius: 999,
    padding: 4,
    marginBottom: 10,
    gap: 4,
  },
  typeButton: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: D.card,
  },
  sectionCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: D.secondary,
    marginBottom: 12,
  },
  sectionLabelLight: {
    fontWeight: '400',
    fontSize: 13,
    color: D.textMuted,
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
  floatOption: {
    flex: 1,
    paddingBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 6,
    backgroundColor: D.navBg,
  },
  floatImage: {
    width: 74,
    height: 74,
  },
  floatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: D.text,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  yesNoText: {
    fontSize: 14,
    fontWeight: '700',
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
  // Selection ring: white inner border + dark outer ring (web used box-shadow rings)
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  colorSelectedRing: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slider: {
    flex: 1,
  },
  quantityLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: D.text,
    marginTop: 4,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 99,
    alignItems: 'center',
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 99,
  },
  chipActive: {
    backgroundColor: D.primary,
  },
  chipInactive: {
    backgroundColor: D.navBg,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 11,
    color: D.textMuted,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  urgencyScaleText: {
    fontSize: 10,
    color: D.secondary,
    opacity: 0.6,
  },
  notesInput: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: D.text,
    backgroundColor: D.card,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  saveButton: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: 99,
    backgroundColor: D.primary,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: D.primaryText,
  },
});
