// Supabase Edge Function: send-invite-email
// Sends a branded invitation email to a patient (no invite code).
// Deploy via: supabase functions deploy send-invite-email
// Requires RESEND_API_KEY secret

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_URL = 'https://fluxia-health.com/user'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { patientEmail, doctorName, centerName } = await req.json()

    if (!patientEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing patientEmail' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY no configurada en secrets' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const doctor = doctorName || 'Tu médico'
    const center = centerName || 'Centro médico'

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:linear-gradient(135deg,#477eb0 0%,#4f98a2 100%);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <img src="https://fluxia-health.com/fluxia-logo.png" alt="Fluxia" style="display:block;margin:0 auto 12px;max-width:200px;width:100%;" />
      <p style="color:#c8e8ec;font-size:13px;margin:4px 0 0;">Seguimiento intestinal inteligente</p>
    </div>
    <div style="background:#ffffff;padding:32px 24px;border-radius:0 0 16px 16px;">
      <p style="font-size:16px;color:#1a2535;margin:0 0 8px;">Hola,</p>
      <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 24px;">
        <strong>Dr. ${doctor}</strong> del centro <strong>${center}</strong> te ha invitado a usar
        <strong>Fluxia</strong> para hacer seguimiento de tu salud intestinal.
      </p>
      <div style="background:#f0f8ff;border-left:4px solid #477eb0;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
        <p style="font-size:15px;color:#1a2535;margin:0;font-weight:600;">
          Inicia sesión en Fluxia para aceptar la invitación
        </p>
        <p style="font-size:13px;color:#666;margin:8px 0 0;line-height:1.5;">
          La invitación te estará esperando en tu cuenta. Solo tienes que aceptarla con un clic.
        </p>
      </div>
      <h2 style="font-size:16px;color:#1a2535;margin:0 0 16px;font-weight:800;">¿Cómo empezar?</h2>
      <div style="margin:0 0 16px;">
        <div style="display:flex;margin-bottom:14px;">
          <div style="min-width:32px;height:32px;border-radius:16px;background:#4f98a2;color:#fff;font-weight:800;font-size:14px;text-align:center;line-height:32px;">1</div>
          <div style="margin-left:12px;padding-top:5px;">
            <strong style="color:#1a2535;font-size:14px;">Abre la aplicación</strong>
            <p style="color:#666;font-size:13px;margin:2px 0 0;line-height:1.4;">
              Entra en <a href="${APP_URL}" style="color:#477eb0;font-weight:600;">${APP_URL}</a>
            </p>
          </div>
        </div>
        <div style="display:flex;margin-bottom:14px;">
          <div style="min-width:32px;height:32px;border-radius:16px;background:#4f98a2;color:#fff;font-weight:800;font-size:14px;text-align:center;line-height:32px;">2</div>
          <div style="margin-left:12px;padding-top:5px;">
            <strong style="color:#1a2535;font-size:14px;">Inicia sesión o crea tu cuenta</strong>
            <p style="color:#666;font-size:13px;margin:2px 0 0;line-height:1.4;">
              Usa el mismo email al que te enviamos esta invitación.
            </p>
          </div>
        </div>
        <div style="display:flex;margin-bottom:0;">
          <div style="min-width:32px;height:32px;border-radius:16px;background:#4f98a2;color:#fff;font-weight:800;font-size:14px;text-align:center;line-height:32px;">3</div>
          <div style="margin-left:12px;padding-top:5px;">
            <strong style="color:#1a2535;font-size:14px;">Acepta la invitación</strong>
            <p style="color:#666;font-size:13px;margin:2px 0 0;line-height:1.4;">
              En tu cuenta verás la invitación de tu médico. Acéptala y empieza a registrar.
            </p>
          </div>
        </div>
      </div>
      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${APP_URL}" style="display:inline-block;background:#477eb0;color:#ffffff;font-size:15px;font-weight:700;padding:14px 40px;border-radius:999px;text-decoration:none;">
          Abrir Fluxia
        </a>
      </div>
    </div>
    <div style="text-align:center;padding:20px 0;font-size:11px;color:#999;">
      <p style="margin:0 0 4px;">Enviado por <strong>${center}</strong> a través de Fluxia</p>
      <p style="margin:0;">Si no esperabas este mensaje, puedes ignorarlo.</p>
    </div>
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
        to: [patientEmail],
        subject: `Dr. ${doctor} te invita a Fluxia`,
        html,
      }),
    })

    const resBody = await res.text()

    if (!res.ok) {
      console.error('Resend error:', res.status, resBody)
      return new Response(
        JSON.stringify({ success: false, error: `Resend ${res.status}`, details: resBody }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resData = JSON.parse(resBody)
    return new Response(
      JSON.stringify({ success: true, emailId: resData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
