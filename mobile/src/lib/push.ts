import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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

export async function registerPushSubscription(userId: string): Promise<boolean> {
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

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        // timezone: los recordatorios de comida se calculan en hora local del paciente
        subscription: { type: 'expo', token, platform: Platform.OS, timezone: deviceTimezone() },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
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

export async function unregisterPushSubscription(userId: string): Promise<void> {
  try {
    await supabase.from('push_subscriptions').delete().eq('user_id', userId);
  } catch (err) {
    console.error('[Push] Unregister error:', err);
  }
}
