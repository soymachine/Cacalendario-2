// Supabase Edge Function: send-push
// Two modes:
//   1. { patient_id, title?, body? }  — doctor sends to a specific patient (auth required)
//   2. { subscription, title?, body? } — cron job sends directly (service role)
// Requires secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
// Always returns HTTP 200 so the caller can read the error message.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return json({ success: false, error: 'VAPID keys not configured' });
    }

    webpush.setVapidDetails('mailto:noreply@fluxia-health.com', vapidPublicKey, vapidPrivateKey);

    const payload = await req.json();
    const title = payload.title || 'Fluxia';
    const msg = payload.body || 'Recuerda registrar tu actividad de hoy 🩺';

    let subscription = payload.subscription;

    // Mode 1: doctor sends to patient_id — look up subscription server-side
    if (!subscription && payload.patient_id) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ success: false, error: 'Authorization header missing' });

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

      // Verify the calling user
      const { data: { user }, error: userErr } = await createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      ).auth.getUser();

      if (userErr || !user) return json({ success: false, error: `Auth error: ${userErr?.message || 'no user'}` });

      const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

      // Check doctor has an accepted link with this patient
      const { data: link, error: linkErr } = await serviceClient
        .from('patient_links')
        .select('id')
        .eq('doctor_id', user.id)
        .eq('patient_id', payload.patient_id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (linkErr) return json({ success: false, error: `DB error: ${linkErr.message}` });
      if (!link) return json({ success: false, error: `Sin acceso: doctor ${user.id} → paciente ${payload.patient_id}` });

      // Fetch subscription
      const { data: sub, error: subErr } = await serviceClient
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', payload.patient_id)
        .maybeSingle();

      if (subErr) return json({ success: false, error: `Subscription DB error: ${subErr.message}` });
      if (!sub?.subscription) return json({ success: false, error: 'Paciente sin notificaciones activadas' });

      subscription = sub.subscription;
    }

    if (!subscription) return json({ success: false, error: 'Se requiere subscription o patient_id' });

    await webpush.sendNotification(subscription, JSON.stringify({ title, body: msg }));

    return json({ success: true });
  } catch (err: any) {
    return json({ success: false, error: err.message });
  }
});
