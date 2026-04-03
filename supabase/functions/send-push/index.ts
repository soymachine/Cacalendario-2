// Supabase Edge Function: send-push
// Sends a Web Push notification to a single subscription.
// Deploy via: supabase functions deploy send-push
// Requires secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { subscription, title, body } = await req.json();

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'VAPID keys not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    webpush.setVapidDetails('mailto:noreply@fluxia-health.com', vapidPublicKey, vapidPrivateKey);

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: title || 'Fluxia', body: body || 'Recuerda registrar tu actividad de hoy 🩺' })
    );

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
