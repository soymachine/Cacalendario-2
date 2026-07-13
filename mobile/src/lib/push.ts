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

export async function getPushPermission(): Promise<PushPermission> {
  if (!Device.isDevice) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status as PushPermission;
}

export async function registerPushSubscription(userId: string): Promise<boolean> {
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
    if (status !== 'granted') return false;

    const projectId: string | undefined =
      Constants?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        subscription: { type: 'expo', token, platform: Platform.OS },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    return true;
  } catch (err) {
    console.error('[Push] Registration error:', err);
    return false;
  }
}

export async function unregisterPushSubscription(userId: string): Promise<void> {
  try {
    await supabase.from('push_subscriptions').delete().eq('user_id', userId);
  } catch (err) {
    console.error('[Push] Unregister error:', err);
  }
}
