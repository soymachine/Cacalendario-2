// Supabase Edge Function: send-push
// Two modes:
//   1. { patient_id, title?, body? }  — doctor sends to a specific patient (auth required)
//   2. { subscription, title?, body? } — cron job sends directly (service role)

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendWebPush, type PushSubscription } from '../_shared/webpush.ts';

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

    const payload = await req.json();
    const title = payload.title ?? 'Fluxia';
    const msg = payload.body ?? 'Recuerda registrar tu actividad de hoy 🩺';

    let subscription: PushSubscription | null = payload.subscription ?? null;

    // Mode 1: doctor sends to patient_id — verify link and look up subscription
    if (!subscription && payload.patient_id) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ success: false, error: 'Authorization header missing' });

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

      const { data: { user }, error: userErr } = await createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      ).auth.getUser();

      if (userErr || !user) {
        return json({ success: false, error: `Auth error: ${userErr?.message ?? 'no user'}` });
      }

      const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

      const { data: link, error: linkErr } = await serviceClient
        .from('patient_links')
        .select('id')
        .eq('doctor_id', user.id)
        .eq('patient_id', payload.patient_id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (linkErr) return json({ success: false, error: `DB error: ${linkErr.message}` });
      if (!link) {
        return json({ success: false, error: `Sin acceso: doctor ${user.id} → paciente ${payload.patient_id}` });
      }

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

    const result = await sendWebPush(
      subscription,
      JSON.stringify({ title, body: msg }),
      vapidPublicKey,
      vapidPrivateKey,
    );

    if (result.expired) return json({ success: false, error: 'Subscription expirada', expired: true });
    if (!result.ok) return json({ success: false, error: `Push service error ${result.status}: ${result.errorText}` });

    return json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ success: false, error: msg });
  }
});
