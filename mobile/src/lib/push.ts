import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Native replacement for the web app's Web Push (VAPID) subscription.
// The Expo push token is stored in the same push_subscriptions.subscription
// jsonb column with shape { type: 'expo', token } — the send-push Edge
// Function routes it through Expo's push API instead of Web Push.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

// Motivo del último fallo al activar las notificaciones (se muestra en Cuenta
// para poder diagnosticarlo en el propio móvil).
let lastPushError: string | null = null;
export function getLastPushError(): string | null {
  return lastPushError;
}

export async function getPushPermission(): Promise<PushPermission> {
  if (!Device.isDevice) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status as PushPermission;
}

// El paciente puede desactivar las notificaciones en Cuenta. Se recuerda en
// el dispositivo (por usuario) para que la app no las vuelva a activar sola
// al abrirse: App.tsx llama a registerPushSubscription en cada arranque.
const optOutKey = (userId: string) => `fluxia_push_opt_out_${userId}`;

async function isPushOptedOut(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(optOutKey(userId))) === '1';
  } catch {
    return false;
  }
}

/**
 * Registro automático al abrir la app con sesión iniciada: no hace nada si el
 * paciente desactivó las notificaciones en este dispositivo.
 */
export async function registerPushSubscription(userId: string): Promise<boolean> {
  if (await isPushOptedOut(userId)) return false;
  return subscribe(userId);
}

/** Botón «Activar notificaciones» de Cuenta. */
export async function enablePushNotifications(userId: string): Promise<boolean> {
  await AsyncStorage.removeItem(optOutKey(userId)).catch(() => {});
  return subscribe(userId);
}

/** Botón «Desactivar notificaciones» de Cuenta: deja de recibirlas y no se reactivan solas. */
export async function disablePushNotifications(userId: string): Promise<void> {
  await AsyncStorage.setItem(optOutKey(userId), '1').catch(() => {});
  await unregisterPushSubscription(userId);
}

async function subscribe(userId: string): Promise<boolean> {
  lastPushError = null;
  if (!Device.isDevice) return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Recordatorios',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') {
      lastPushError = 'Permiso de notificaciones no concedido.';
      return false;
    }

    const projectId: string | undefined =
      Constants?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    // timezone: los recordatorios de comida se calculan en hora local del paciente
    const subscription = { type: 'expo', token, platform: Platform.OS, timezone: deviceTimezone() };
    // claim_push_subscription guarda la suscripción y la quita de otras cuentas
    // que se usaron antes en este móvil (si no, también les llegarían aquí).
    let { error } = await supabase.rpc('claim_push_subscription', { p_subscription: subscription });
    if (error?.code === 'PGRST202') {
      // RPC aún no desplegado en el servidor: guardado como antes
      ({ error } = await supabase.from('push_subscriptions').upsert(
        { user_id: userId, subscription, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      ));
    }
    if (error) {
      lastPushError = `No se pudo guardar la suscripción: ${error.message}`;
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Push] Registration error:', err);
    lastPushError = err instanceof Error ? err.message : String(err);
    return false;
  }
}

function deviceTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Quita la suscripción de este usuario (sin recordar ninguna preferencia).
 * Se llama también al cerrar sesión, antes de signOut: el móvil deja de
 * recibir los avisos de esa cuenta.
 */
export async function unregisterPushSubscription(userId: string): Promise<void> {
  try {
    await supabase.from('push_subscriptions').delete().eq('user_id', userId);
  } catch (err) {
    console.error('[Push] Unregister error:', err);
  }
}
