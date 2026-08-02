import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Linking,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../lib/auth';
import { getEntries, clearLocalEntries } from '../lib/storage';
import { clearPreferences } from '../lib/preferences';
import { supabase } from '../lib/supabase';
import {
  registerPushSubscription, unregisterPushSubscription, getPushPermission, type PushPermission,
} from '../lib/push';
import { emitEvent, onEvent, FLUXIA_UPDATED } from '../lib/events';
import { APP_VERSION } from '../lib/version';
import { D } from '../lib/design';
import { ChevronSmallIcon } from './icons';
import { BOTTOM_NAV_HEIGHT } from './BottomNav';

interface AccountScreenProps {
  onShowAuth: () => void;
  onShowPrivacy: () => void;
}

const FEEDBACK_TYPES = [
  { id: 'bug', emoji: '🐛', label: 'Error' },
  { id: 'suggestion', emoji: '💡', label: 'Sugerencia' },
  { id: 'question', emoji: '❓', label: 'Pregunta' },
  { id: 'other', emoji: '💬', label: 'Otro' },
] as const;
type FeedbackType = typeof FEEDBACK_TYPES[number]['id'];

export default function AccountScreen({ onShowAuth, onShowPrivacy }: AccountScreenProps) {
  const { user, signOut } = useAuth();

  // Settings state
  const [displayName, setDisplayName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [linkedCenter, setLinkedCenter] = useState<string | null>(null);
  const [linkedDoctor, setLinkedDoctor] = useState<string | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<PushPermission>('undetermined');
  const [pushLoading, setPushLoading] = useState(false);

  // Profile state
  const [exported, setExported] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Feedback state
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const loadLinkedCenter = () => {
    if (!user) return;
    supabase.from('patient_links').select('id, status, center_id, doctor_id')
      .eq('patient_id', user.id).eq('status', 'accepted').eq('doctor_unlinked', false).limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const row = data[0];
          if (row.center_id) {
            supabase.from('centers').select('name').eq('id', row.center_id).single()
              .then(({ data: center }) => { if (center) setLinkedCenter(center.name); });
          }
          if (row.doctor_id) {
            supabase.from('doctors').select('name').eq('id', row.doctor_id).single()
              .then(({ data: doc }) => { if (doc) setLinkedDoctor(doc.name); });
          }
        } else {
          setLinkedCenter(null);
          setLinkedDoctor(null);
        }
      });
  };

  useEffect(() => {
    if (!user) return;
    // Load display_name
    supabase.from('user_profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => { if (data?.display_name) setDisplayName(data.display_name); });
    // Load linked center
    loadLinkedCenter();
    // Check push
    getPushPermission().then(setPushPermission);
    supabase.from('push_subscriptions').select('id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setPushSubscribed(!!data));
  }, [user]);

  // Refresh linked center after the full-screen invite modal accept action
  useEffect(() => {
    if (!user) return;
    return onEvent(FLUXIA_UPDATED, loadLinkedCenter);
  }, [user]);

  useEffect(() => {
    if (user) setFeedbackEmail(user.email || '');
  }, [user]);

  const handleSaveName = async () => {
    if (!user) return;
    const trimmed = displayName.trim();
    await supabase.from('user_profiles').upsert(
      { id: user.id, display_name: trimmed || null, email: user.email ?? null },
      { onConflict: 'id' }
    );
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleTogglePush = async () => {
    if (!user) return;
    setPushLoading(true);
    if (pushSubscribed) {
      await unregisterPushSubscription(user.id);
      setPushSubscribed(false);
    } else {
      const ok = await registerPushSubscription(user.id);
      setPushPermission(await getPushPermission());
      if (ok) {
        const { data } = await supabase.from('push_subscriptions').select('id').eq('user_id', user.id).maybeSingle();
        setPushSubscribed(!!data);
      }
    }
    setPushLoading(false);
  };

  const handleExportData = async () => {
    try {
      const entries = getEntries();
      const exportData = {
        app: 'Fluxia',
        exportDate: new Date().toISOString(),
        user: user?.email,
        totalEntries: entries.length,
        entries,
      };
      const file = new File(Paths.cache, `fluxia-export-${new Date().toISOString().slice(0, 10)}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(exportData, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Exportar mis datos' });
      }
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error('[export] error:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setConfirmLogout(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const { error: fnError } = await supabase.functions.invoke('delete-user', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (fnError) {
          await supabase.from('entries').delete().eq('user_id', user.id);
          await supabase.auth.signOut();
        }
      } else {
        await supabase.from('entries').delete().eq('user_id', user.id);
        await supabase.auth.signOut();
      }
      clearLocalEntries();
      clearPreferences();
      emitEvent(FLUXIA_UPDATED);
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) { setFeedbackError('Escribe un mensaje'); return; }
    if (!feedbackEmail.trim()) { setFeedbackError('Indica tu email para poder responderte'); return; }
    setFeedbackLoading(true);
    setFeedbackError('');
    const { error: dbError } = await supabase.from('feedback').insert({
      user_email: feedbackEmail.trim(),
      message: feedbackMessage.trim(),
      type: feedbackType,
    });
    if (dbError) {
      setFeedbackError('Error al enviar. Inténtalo de nuevo.');
    } else {
      setFeedbackSent(true);
    }
    setFeedbackLoading(false);
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* ── NOT LOGGED IN ── */}
      {!user && (
        <View style={[styles.card, styles.loginCard]}>
          <Text style={styles.loginEmoji}>👤</Text>
          <Text style={styles.loginTitle}>Inicia sesión para empezar a usar la app</Text>
          <Text style={styles.loginSubtitle}>
            Guarda tus registros en la nube y accede desde cualquier dispositivo.
          </Text>
          <Pressable onPress={onShowAuth} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Iniciar sesión / Registrarse</Text>
          </Pressable>
        </View>
      )}

      {/* ── LOGGED IN ── */}
      {user && (
        <>
          {/* User card */}
          <View style={[styles.card, styles.userCard]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.email || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              <View style={styles.syncRow}>
                <View style={styles.syncDot} />
                <Text style={styles.syncText}>Sincronización activa</Text>
              </View>
            </View>
          </View>

          {/* Sign out — right below user card */}
          {confirmLogout ? (
            <View style={styles.card}>
              <Text style={styles.confirmTitle}>¿Seguro que quieres cerrar sesión?</Text>
              <Text style={styles.confirmSubtitle}>Tus datos locales se mantendrán en este dispositivo.</Text>
              <View style={styles.rowGap8}>
                <Pressable onPress={() => setConfirmLogout(false)} style={[styles.outlineBtn, styles.flex1]}>
                  <Text style={styles.outlineBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={handleSignOut} style={[styles.solidDangerBtn, styles.flex1]}>
                  <Text style={styles.solidDangerBtnText}>Salir</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setConfirmLogout(true)} style={[styles.dangerBtn, styles.mb12]}>
              <Text style={styles.dangerBtnText}>Cerrar sesión</Text>
            </Pressable>
          )}

          {/* Display name */}
          <View style={styles.card}>
            <Text style={styles.label}>👤 TU NOMBRE</Text>
            <Text style={styles.hint}>Opcional. Tu médico lo verá en lugar de tu email.</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ej: María García"
              placeholderTextColor={D.textMuted}
              maxLength={60}
              style={styles.input}
            />
            <Pressable onPress={handleSaveName} style={[styles.primaryBtn, styles.mt10]}>
              <Text style={styles.primaryBtnText}>{nameSaved ? '✅ Guardado' : 'Guardar nombre'}</Text>
            </Pressable>
          </View>

          {/* Linked center */}
          {(linkedCenter || linkedDoctor) && (
            <View style={styles.card}>
              <Text style={styles.label}>🏥 MI MÉDICO</Text>
              {linkedDoctor && <Text style={styles.doctorName}>{linkedDoctor}</Text>}
              {linkedCenter && <Text style={styles.centerName}>{linkedCenter}</Text>}
              <Text style={styles.hintPlain}>Tu médico puede ver tus registros para ayudarte mejor.</Text>
            </View>
          )}

          {/* Push notifications */}
          {pushPermission !== 'unsupported' && (
            <View style={styles.card}>
              <Text style={styles.label}>🔔 NOTIFICACIONES</Text>
              {pushPermission === 'denied' ? (
                <>
                  <Text style={styles.hintPlain}>Las notificaciones están bloqueadas. Actívalas en los ajustes del sistema:</Text>
                  <Pressable onPress={() => Linking.openSettings()} style={[styles.outlineBtn, styles.mt10]}>
                    <Text style={styles.outlineBtnText}>Abrir ajustes</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => getPushPermission().then(setPushPermission)}
                    style={[styles.outlineBtn, styles.mt10]}
                  >
                    <Text style={styles.outlineBtnText}>Ya lo he activado — volver a verificar</Text>
                  </Pressable>
                </>
              ) : pushSubscribed ? (
                <>
                  <Text style={styles.hintPlain}>✅ Activadas. Recibirás un recordatorio si llevas un tiempo sin registrar.</Text>
                  <Pressable
                    onPress={handleTogglePush}
                    disabled={pushLoading}
                    style={[styles.dangerBtn, styles.mt10, pushLoading && styles.disabled]}
                  >
                    <Text style={styles.dangerBtnText}>{pushLoading ? '...' : 'Desactivar notificaciones'}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.hintPlain}>Activa los recordatorios para no olvidar registrar tu actividad.</Text>
                  <Pressable
                    onPress={handleTogglePush}
                    disabled={pushLoading}
                    style={[styles.primaryBtn, styles.mt10, pushLoading && styles.disabled]}
                  >
                    <Text style={styles.primaryBtnText}>{pushLoading ? '...' : 'Activar notificaciones'}</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </>
      )}

      {/* ── FEEDBACK ── */}
      <View style={styles.card}>
        <Text style={styles.label}>💬 FEEDBACK</Text>
        {feedbackSent ? (
          <View style={styles.feedbackSent}>
            <Text style={styles.feedbackSentEmoji}>💌</Text>
            <Text style={styles.feedbackSentTitle}>¡Mensaje enviado!</Text>
            <Text style={styles.hintPlain}>Gracias por tu feedback. Lo revisaremos pronto.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.hint}>¿Has encontrado un error o tienes una idea para mejorar?</Text>

            {/* Email if not logged in */}
            {!user && (
              <>
                <Text style={[styles.label, styles.mb6]}>TU EMAIL</Text>
                <TextInput
                  value={feedbackEmail}
                  onChangeText={setFeedbackEmail}
                  placeholder="para poder responderte"
                  placeholderTextColor={D.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, styles.mb12]}
                />
              </>
            )}

            {/* Type */}
            <Text style={[styles.label, styles.mb6]}>TIPO</Text>
            <View style={[styles.rowGap6, styles.mb12]}>
              {FEEDBACK_TYPES.map((type) => {
                const active = feedbackType === type.id;
                return (
                  <Pressable
                    key={type.id}
                    onPress={() => setFeedbackType(type.id)}
                    style={[styles.feedbackChip, { backgroundColor: active ? D.primary : D.bg }]}
                  >
                    <Text style={styles.feedbackChipEmoji}>{type.emoji}</Text>
                    <Text style={[styles.feedbackChipLabel, { color: active ? D.primaryText : D.text }]}>{type.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Message */}
            <Text style={[styles.label, styles.mb6]}>MENSAJE</Text>
            <TextInput
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              placeholder="Describe el error o tu sugerencia..."
              placeholderTextColor={D.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textarea, feedbackError ? styles.mb8 : styles.mb12]}
            />

            {!!feedbackError && <Text style={styles.errorText}>{feedbackError}</Text>}

            <Pressable
              onPress={handleSendFeedback}
              disabled={feedbackLoading}
              style={[styles.primaryBtn, feedbackLoading && styles.disabled]}
            >
              <Text style={styles.primaryBtnText}>{feedbackLoading ? 'Enviando...' : 'Enviar feedback'}</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* ── DATA MANAGEMENT (logged in) ── */}
      {user && (
        <View style={styles.card}>
          <Text style={styles.label}>DATOS</Text>

          {/* Export */}
          <Pressable onPress={handleExportData} style={[styles.rowItem, styles.rowItemBorder]}>
            <Text style={styles.rowEmoji}>📦</Text>
            <View style={styles.flex1}>
              <Text style={styles.rowTitle}>{exported ? '¡Exportado!' : 'Exportar mis datos'}</Text>
              <Text style={styles.rowSubtitle}>Compartir en formato JSON</Text>
            </View>
            <ChevronSmallIcon />
          </Pressable>

          {/* Privacy */}
          <Pressable onPress={onShowPrivacy} style={styles.rowItem}>
            <Text style={styles.rowEmoji}>🔒</Text>
            <View style={styles.flex1}>
              <Text style={styles.rowTitle}>Política de privacidad</Text>
              <Text style={styles.rowSubtitle}>Tus derechos y nuestro uso de datos</Text>
            </View>
            <ChevronSmallIcon />
          </Pressable>
        </View>
      )}

      {/* ── DELETE ACCOUNT (subtle, at the bottom) ── */}
      {user && confirmDelete && (
        <View style={[styles.card, styles.deleteCard]}>
          <Text style={styles.deleteTitle}>⚠️ ¿Estás seguro?</Text>
          <Text style={styles.deleteBody}>
            Esta acción es <Text style={styles.bold}>irreversible</Text>. Se borrarán todos tus registros de la nube y del dispositivo.
          </Text>
          <View style={styles.rowGap8}>
            <Pressable onPress={() => setConfirmDelete(false)} style={[styles.outlineBtn, styles.flex1]}>
              <Text style={styles.outlineBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteAccount}
              disabled={deleting}
              style={[styles.solidDangerBtn, styles.flex1, deleting && styles.disabled]}
            >
              <Text style={styles.solidDangerBtnText}>{deleting ? 'Eliminando...' : 'Sí, eliminar todo'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── FOOTER ── */}
      <View style={styles.footer}>
        <Text style={styles.footerLine1}>Fluxia es 100% gratis</Text>
        <Text style={styles.footerLine2}>Hecho con ❤️ en España · {APP_VERSION}</Text>
        {user && !confirmDelete && (
          <Pressable onPress={() => setConfirmDelete(true)}>
            <Text style={styles.deleteLink}>Eliminar mi cuenta</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: D.bg,
  },
  container: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32 + BOTTOM_NAV_HEIGHT,
  },
  card: {
    backgroundColor: D.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  loginCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loginEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  loginTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: D.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 13,
    color: D.textMuted,
    marginBottom: 20,
    lineHeight: 19,
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: D.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: D.primaryText,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: D.text,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: D.success,
  },
  syncText: {
    fontSize: 12,
    color: D.textMuted,
  },
  confirmTitle: {
    fontSize: 14,
    color: D.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  confirmSubtitle: {
    fontSize: 12,
    color: D.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: D.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: D.textMuted,
    marginBottom: 10,
    marginTop: -4,
  },
  hintPlain: {
    fontSize: 12,
    color: D.textMuted,
  },
  input: {
    width: '100%',
    backgroundColor: D.bg,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: D.text,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: D.primary,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: D.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  outlineBtn: {
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: D.border,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: D.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dangerBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: D.dangerBg,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: D.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  solidDangerBtn: {
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: D.danger,
    alignItems: 'center',
  },
  solidDangerBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: D.text,
    marginBottom: 2,
  },
  centerName: {
    fontSize: 13,
    color: D.textMuted,
    marginBottom: 4,
  },
  feedbackSent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  feedbackSentEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  feedbackSentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: D.text,
    marginBottom: 6,
  },
  feedbackChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  feedbackChipEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  feedbackChipLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    color: D.danger,
    marginBottom: 8,
  },
  rowItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: D.border,
  },
  rowEmoji: {
    fontSize: 20,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: D.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: D.textMuted,
  },
  deleteCard: {
    borderWidth: 2,
    borderColor: D.danger,
    backgroundColor: D.dangerBg,
  },
  deleteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: D.danger,
    textAlign: 'center',
    marginBottom: 6,
  },
  deleteBody: {
    fontSize: 12,
    color: D.danger,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerLine1: {
    fontSize: 13,
    color: D.textMuted,
    marginBottom: 4,
  },
  footerLine2: {
    fontSize: 11,
    color: D.textMuted,
  },
  deleteLink: {
    marginTop: 16,
    fontSize: 12,
    color: D.danger,
    opacity: 0.6,
  },
  rowGap6: {
    flexDirection: 'row',
    gap: 6,
  },
  rowGap8: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mt10: { marginTop: 10 },
  disabled: { opacity: 0.5 },
});
