// Supabase Edge Function: notify-new-doctor
// Triggered by a Database Webhook on INSERT to the doctors table.
// Sends a notification email to the platform owner via Resend.
//
// Required secrets (Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY  — Resend API key
//   OWNER_EMAIL     — email address that receives the notifications
//
// Deploy: supabase functions deploy notify-new-doctor --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase DB Webhook payload: { type, table, schema, record, old_record }
    const payload = await req.json()
    const record = payload.record as Record<string, unknown>

    if (!record?.id) {
      console.warn('notify-new-doctor: no record.id in payload', payload)
      return new Response(JSON.stringify({ success: false, error: 'No record' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const ownerEmail = Deno.env.get('OWNER_EMAIL')

    if (!resendApiKey || !ownerEmail) {
      console.error('notify-new-doctor: missing RESEND_API_KEY or OWNER_EMAIL secret')
      return new Response(JSON.stringify({ success: false, error: 'Missing secrets' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role to look up the doctor's email and center name
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const [userResult, centerResult] = await Promise.all([
      supabase.auth.admin.getUserById(record.id as string),
      record.center_id
        ? supabase.from('centers').select('name').eq('id', record.center_id).single()
        : Promise.resolve({ data: null }),
    ])

    const doctorEmail = userResult.data?.user?.email ?? 'desconocido'
    const centerName = (centerResult.data as { name?: string } | null)?.name ?? '—'

    const doctorName = (record.name as string) || doctorEmail
    const specialty = (record.specialty as string) || '—'
    const plan = (record.plan as string) || 'free'
    const registeredAt = record.created_at
      ? new Date(record.created_at as string).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
      : new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background:linear-gradient(135deg,#477eb0 0%,#4f98a2 100%);border-radius:16px 16px 0 0;padding:24px;text-align:center;">
      <img src="https://fluxia-health.com/fluxia-logo.png" alt="Fluxia" style="display:block;margin:0 auto 8px;max-width:160px;width:100%;" />
    </div>
    <div style="background:#ffffff;padding:28px 24px;border-radius:0 0 16px 16px;">
      <h2 style="margin:0 0 20px;font-size:18px;color:#1a2535;">🩺 Nuevo médico registrado</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#888;width:110px;">Nombre</td>
          <td style="padding:8px 0;font-weight:700;color:#1a2535;">${doctorName}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0;">
          <td style="padding:8px 0;color:#888;">Email</td>
          <td style="padding:8px 0;color:#1a2535;">${doctorEmail}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0;">
          <td style="padding:8px 0;color:#888;">Centro</td>
          <td style="padding:8px 0;color:#1a2535;">${centerName}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0;">
          <td style="padding:8px 0;color:#888;">Especialidad</td>
          <td style="padding:8px 0;color:#1a2535;">${specialty}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0;">
          <td style="padding:8px 0;color:#888;">Plan</td>
          <td style="padding:8px 0;color:#1a2535;">${plan}</td>
        </tr>
        <tr style="border-top:1px solid #f0f0f0;">
          <td style="padding:8px 0;color:#888;">Registrado</td>
          <td style="padding:8px 0;color:#1a2535;">${registeredAt}</td>
        </tr>
      </table>
    </div>
    <p style="text-align:center;font-size:11px;color:#aaa;margin:16px 0 0;">Notificación automática de Fluxia</p>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Fluxia <noreply@fluxia-health.com>',
        to: [ownerEmail],
        subject: `🩺 Nuevo médico en Fluxia: ${doctorName}`,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('notify-new-doctor Resend error:', res.status, body)
    }

    return new Response(JSON.stringify({ success: res.ok }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-new-doctor error:', err)
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
