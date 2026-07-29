import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useAuth } from '../lib/auth';
import type { DoctorInfo } from '../lib/doctor';
import type { PatientLink } from '../lib/patients';
import { saveDoctorConfig, saveGlobalTags, deleteGlobalTag, pickAndUploadCenterLogo } from '../lib/config';
import { tagColor } from '../lib/tags';
import { D } from '../lib/design';

interface ConfigScreenProps {
  doctor: DoctorInfo;
  patients: PatientLink[];
  onDoctorUpdated: (doctor: DoctorInfo) => void;
}

export default function ConfigScreen({ doctor, patients, onDoctorUpdated }: ConfigScreenProps) {
  const { signOut } = useAuth();
  const [name, setName] = useState(doctor.name);
  const [centerName, setCenterName] = useState(doctor.center_name);
  const [green, setGreen] = useState(doctor.semaforo_green);
  const [red, setRed] = useState(doctor.semaforo_red);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagsSaving, setTagsSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await saveDoctorConfig(doctor, { name, centerName, semaforoGreen: green, semaforoRed: red });
    setSaving(false);
    if (!error) {
      onDoctorUpdated({ ...doctor, name: name.trim() || doctor.name, center_name: centerName.trim() || doctor.center_name, semaforo_green: green, semaforo_red: red });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleUploadLogo = async () => {
    setImageError('');
    setUploadingImage(true);
    const { url, error } = await pickAndUploadCenterLogo(doctor);
    setUploadingImage(false);
    if (error) { setImageError(error); return; }
    if (url) onDoctorUpdated({ ...doctor, center_image_url: url });
  };

  const handleAddTag = async () => {
    const v = tagInput.trim();
    if (!v || (doctor.global_tags || []).includes(v)) { setTagInput(''); return; }
    setTagInput('');
    setTagsSaving(true);
    const newTags = [...(doctor.global_tags || []), v];
    const { error } = await saveGlobalTags(doctor.id, newTags);
    setTagsSaving(false);
    if (!error) onDoctorUpdated({ ...doctor, global_tags: newTags });
  };

  const handleDeleteTag = async (tag: string) => {
    setTagsSaving(true);
    const { error } = await deleteGlobalTag(doctor.id, tag, doctor.global_tags || [], patients);
    setTagsSaving(false);
    if (!error) {
      onDoctorUpdated({ ...doctor, global_tags: (doctor.global_tags || []).filter((t) => t !== tag) });
    }
  };

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Ajusta tu perfil y los parámetros del semáforo</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos del médico</Text>
          <Text style={styles.label}>NOMBRE</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Dr. Nombre Apellido" placeholderTextColor={D.textMuted} style={styles.input} />
          <Text style={styles.label}>CENTRO MÉDICO</Text>
          <TextInput value={centerName} onChangeText={setCenterName} placeholder="Nombre del centro o consulta" placeholderTextColor={D.textMuted} style={styles.input} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Imagen del centro</Text>
          <View style={styles.logoPreview}>
            {doctor.center_image_url ? (
              <Image source={{ uri: doctor.center_image_url }} style={styles.logoImage} resizeMode="contain" />
            ) : (
              <Text style={styles.logoPlaceholder}>Sin imagen</Text>
            )}
          </View>
          <Text style={styles.hint}>Aparecerá en la app de los pacientes vinculados.</Text>
          {!!imageError && <Text style={styles.error}>{imageError}</Text>}
          <Pressable onPress={handleUploadLogo} disabled={uploadingImage} style={[styles.secondaryButton, uploadingImage && styles.buttonDisabled]}>
            {uploadingImage ? <ActivityIndicator color={D.primaryText} /> : <Text style={styles.secondaryButtonText}>Subir imagen</Text>}
          </Pressable>
          <Text style={styles.hintSmall}>PNG, JPG o WEBP · Máx 2 MB</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Semáforo</Text>
          <Text style={styles.hint}>
            Define cuántos días sin registro se consideran normales, en vigilancia o en alerta.
            Se aplica como valor por defecto a todos tus pacientes.
          </Text>

          <Text style={[styles.thresholdLabel, { color: D.success }]}>Al día: ≤ {green} día{green === 1 ? '' : 's'}</Text>
          <Slider
            minimumValue={0}
            maximumValue={Math.max(red - 1, 1)}
            step={1}
            value={green}
            onValueChange={(v) => { setGreen(v); if (v >= red) setRed(v + 1); }}
            minimumTrackTintColor={D.success}
            maximumTrackTintColor={D.chipDark}
            thumbTintColor={D.success}
          />

          <Text style={[styles.thresholdLabel, { color: D.danger, marginTop: 12 }]}>Inactivo: &gt; {red} días</Text>
          <Slider
            minimumValue={Math.max(green + 1, 1)}
            maximumValue={30}
            step={1}
            value={red}
            onValueChange={(v) => { setRed(v); if (v <= green) setGreen(v - 1); }}
            minimumTrackTintColor={D.danger}
            maximumTrackTintColor={D.chipDark}
            thumbTintColor={D.danger}
          />

          {saved && <Text style={styles.saved}>✅ Guardado</Text>}
          <Pressable onPress={handleSave} disabled={saving} style={[styles.primaryButton, saving && styles.buttonDisabled]}>
            <Text style={styles.primaryButtonText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Etiquetas globales</Text>
          <Text style={styles.hint}>
            Define las etiquetas de tu consulta. Eliminar una la borra también de todos los pacientes.
          </Text>
          <View style={styles.tagRow}>
            {(doctor.global_tags || []).length === 0 ? (
              <Text style={styles.noTags}>Sin etiquetas todavía</Text>
            ) : (doctor.global_tags || []).map((t) => (
              <Pressable key={t} onPress={() => handleDeleteTag(t)} disabled={tagsSaving} style={[styles.tagChip, { backgroundColor: tagColor(t) + '22' }]}>
                <Text style={[styles.tagChipText, { color: tagColor(t) }]}>{t} ×</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.tagInputRow}>
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Nueva etiqueta…"
              placeholderTextColor={D.textMuted}
              onSubmitEditing={handleAddTag}
              style={[styles.input, styles.tagInput]}
            />
            <Pressable onPress={handleAddTag} disabled={tagsSaving || !tagInput.trim()} style={[styles.addTagButton, (tagsSaving || !tagInput.trim()) && styles.buttonDisabled]}>
              <Text style={styles.addTagButtonText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: D.bg },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '900', color: D.text },
  subtitle: { fontSize: 13, color: D.textMuted, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: D.card, borderRadius: 16, padding: 18, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: D.text, marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '900', color: D.textMuted, letterSpacing: 0.5, marginBottom: 6, marginTop: 10 },
  input: { width: '100%', backgroundColor: D.chip, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, color: D.text },
  hint: { fontSize: 12, color: D.textMuted, lineHeight: 18, marginBottom: 10 },
  hintSmall: { fontSize: 11, color: D.textMuted, marginTop: 8, textAlign: 'center' },
  error: { fontSize: 12, color: D.danger, marginBottom: 8 },
  logoPreview: { width: '100%', aspectRatio: 2, borderRadius: 12, borderWidth: 2, borderColor: D.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: D.bg, marginBottom: 10, overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: { fontSize: 13, color: D.textMuted },
  thresholdLabel: { fontSize: 12, fontWeight: '800' },
  saved: { fontSize: 12, fontWeight: '700', color: D.success, marginTop: 12 },
  primaryButton: { marginTop: 14, paddingVertical: 12, borderRadius: 99, backgroundColor: D.primary, alignItems: 'center' },
  primaryButtonText: { color: D.primaryText, fontSize: 14, fontWeight: '700' },
  secondaryButton: { paddingVertical: 12, borderRadius: 99, backgroundColor: D.primary, alignItems: 'center' },
  secondaryButtonText: { color: D.primaryText, fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  noTags: { fontSize: 13, color: D.textMuted, fontStyle: 'italic' },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagChipText: { fontSize: 13, fontWeight: '700' },
  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tagInput: { flex: 1 },
  addTagButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center' },
  addTagButtonText: { color: D.primaryText, fontSize: 20, fontWeight: '700' },
  signOutButton: { paddingVertical: 12, borderRadius: 50, backgroundColor: D.dangerBg, alignItems: 'center' },
  signOutText: { color: D.danger, fontSize: 15, fontWeight: '700' },
});
