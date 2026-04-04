// Supabase Edge Function: send-push
// Two modes:
//   1. { patient_id, title?, body? }  — doctor sends to a specific patient (auth required)
//   2. { subscription, title?, body? } — cron job sends directly (service role)
// Requires secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'VAPID keys not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    webpush.setVapidDetails('mailto:noreply@fluxia-health.com', vapidPublicKey, vapidPrivateKey);

    const payload = await req.json();
    const title = payload.title || 'Fluxia';
    const msg = payload.body || 'Recuerda registrar tu actividad de hoy 🩺';

    let subscription = payload.subscription;

    // Mode 1: doctor sends to patient_id — look up subscription server-side
    if (!subscription && payload.patient_id) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      // Verify the calling user is a doctor linked to this patient
      const { data: { user }, error: userErr } = await createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      ).auth.getUser();

      if (userErr || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check doctor has an accepted link with this patient
      const { data: link } = await serviceClient
        .from('patient_links')
        .select('id')
        .eq('doctor_id', user.id)
        .eq('patient_id', payload.patient_id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (!link) {
        return new Response(
          JSON.stringify({ success: false, error: 'No tienes acceso a este paciente' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch subscription
      const { data: sub } = await serviceClient
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', payload.patient_id)
        .maybeSingle();

      if (!sub?.subscription) {
        return new Response(
          JSON.stringify({ success: false, error: 'Este paciente no tiene notificaciones activadas' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      subscription = sub.subscription;
    }

    if (!subscription) {
      return new Response(
        JSON.stringify({ success: false, error: 'subscription or patient_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await webpush.sendNotification(subscription, JSON.stringify({ title, body: msg }));

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
