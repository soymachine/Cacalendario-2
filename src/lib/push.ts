import { supabase } from './supabase';

// ── VAPID Public Key ──
// Generate keys with: npx web-push generate-vapid-keys
// Then replace this value AND add VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY to Supabase secrets
export const VAPID_PUBLIC_KEY = 'BB9UrzepkaFPQTx_2Ugr5zzkHQZqK02BQdFtlS0ndNEMK_yS18FLM_e99RKX15ClWyQq14-x9MTgoemgCytzePs';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function registerPushSubscription(userId: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (VAPID_PUBLIC_KEY === 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY') return;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await supabase.from('push_subscriptions').upsert(
      { user_id: userId, subscription: subscription.toJSON(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  } catch (err) {
    console.error('[Push] Registration error:', err);
  }
}

export async function unregisterPushSubscription(userId: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }
    await supabase.from('push_subscriptions').delete().eq('user_id', userId);
  } catch (err) {
    console.error('[Push] Unregister error:', err);
  }
}
