// Supabase Edge Function: check-inactive-patients
// Runs as a cron job (every hour) to send push reminders to inactive patients.
// Deploy via: supabase functions deploy check-inactive-patients
// Schedule via Supabase Dashboard → Edge Functions → check-inactive-patients → Schedule: 0 * * * *
// Requires secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500 });
  }

  webpush.setVapidDetails('mailto:noreply@fluxia-health.com', vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find all patients who:
  // 1. Have an active push subscription
  // 2. Have been inactive for >= push_min_hours
  // 3. Either never received a push, or >= 24/push_frequency hours since last push
  const { data: patients, error } = await supabase.rpc('get_patients_needing_push');

  if (error) {
    console.error('RPC error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const patient of patients || []) {
    try {
      await webpush.sendNotification(
        patient.subscription,
        JSON.stringify({
          title: 'Fluxia',
          body: 'No has registrado nada hoy. Tu médico necesita esta información 🩺',
        })
      );

      await supabase
        .from('push_subscriptions')
        .update({ last_push_sent_at: new Date().toISOString() })
        .eq('user_id', patient.patient_id);

      sent++;
    } catch (err: any) {
      console.error(`Push failed for ${patient.patient_id}:`, err.message);
      // 410 Gone or 404 = subscription expired, remove it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('user_id', patient.patient_id);
      }
      failed++;
    }
  }

  return new Response(JSON.stringify({ success: true, sent, failed }), { status: 200 });
});
