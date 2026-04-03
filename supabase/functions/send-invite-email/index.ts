// Supabase Edge Function: send-invite-email
// Sends a branded invitation email to a patient with their invite code.
// Deploy via: supabase functions deploy send-invite-email
// Requires RESEND_API_KEY secret

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_URL = 'https://fluxia-health.com/'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { patientEmail, inviteCode, doctorName, centerName } = await req.json()

    if (!patientEmail || !inviteCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing patientEmail or inviteCode' }),
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
<body style="margin:0;padding:0;background:#f5f0ef;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#1a0e0e;border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <img src="https://fluxia-health.com/fluxia-logo.png" alt="Fluxia" style="display:block;margin:0 auto 12px;max-width:200px;width:100%;" />
      <p style="color:#9a7a76;font-size:13px;margin:4px 0 0;">Seguimiento intestinal inteligente</p>
    </div>
    <div style="background:#ffffff;padding:32px 24px;border-radius:0 0 16px 16px;">
      <p style="font-size:16px;color:#1a0e0e;margin:0 0 8px;">Hola,</p>
      <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 24px;">
        <strong>Dr. ${doctor}</strong> del centro <strong>${center}</strong> te invita a usar
        <strong>Fluxia</strong> para hacer seguimiento de tu salud intestinal.
      </p>
      <div style="background:#f9f5f4;border:2px dashed #dd8273;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
        <p style="font-size:12px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Tu código de invitación</p>
        <div style="font-size:32px;font-weight:900;color:#1a0e0e;letter-spacing:6px;font-family:monospace;">${inviteCode}</div>
      </div>
      <h2 style="font-size:16px;color:#1a0e0e;margin:0 0 16px;font-weight:800;">¿Cómo empezar?</h2>
      <div style="margin:0 0 16px;">
        <div style="display:flex;margin-bottom:14px;">
          <div style="min-width:32px;height:32px;border-radius:16px;background:#dd8273;color:#fff;font-weight:800;font-size:14px;text-align:center;line-height:32px;">1</div>
          <div style="margin-left:12px;padding-top:5px;">
            <strong style="color:#1a0e0e;font-size:14px;">Abre la aplicación</strong>
            <p style="color:#666;font-size:13px;margin:2px 0 0;line-height:1.4;">
              Entra en <a href="${APP_URL}" style="color:#dd8273;font-weight:600;">${APP_URL}</a>
            </p>
          </div>
        </div>
        <div style="display:flex;margin-bottom:14px;">
          <div style="min-width:32px;height:32px;border-radius:16px;background:#dd8273;color:#fff;font-weight:800;font-size:14px;text-align:center;line-height:32px;">2</div>
          <div style="margin-left:12px;padding-top:5px;">
            <strong style="color:#1a0e0e;font-size:14px;">Crea tu cuenta</strong>
            <p style="color:#666;font-size:13px;margin:2px 0 0;line-height:1.4;">
              Regístrate con tu email y contraseña. Es rápido y gratuito.
            </p>
          </div>
        </div>
        <div style="display:flex;margin-bottom:14px;">
          <div style="min-width:32px;height:32px;border-radius:16px;background:#dd8273;color:#fff;font-weight:800;font-size:14px;text-align:center;line-height:32px;">3</div>
          <div style="margin-left:12px;padding-top:5px;">
            <strong style="color:#1a0e0e;font-size:14px;">Ve a Ajustes</strong>
            <p style="color:#666;font-size:13px;margin:2px 0 0;line-height:1.4;">
              Una vez dentro, pulsa el icono de ajustes ⚙️ en la barra inferior.
            </p>
          </div>
        </div>
        <div style="display:flex;margin-bottom:14px;">
          <div style="min-width:32px;height:32px;border-radius:16px;background:#dd8273;color:#fff;font-weight:800;font-size:14px;text-align:center;line-height:32px;">4</div>
          <div style="margin-left:12px;padding-top:5px;">
            <strong style="color:#1a0e0e;font-size:14px;">Vincúlate con tu médico</strong>
            <p style="color:#666;font-size:13px;margin:2px 0 0;line-height:1.4;">
              Pulsa en <strong>"Vincular con mi médico"</strong> e introduce el código de arriba.
            </p>
          </div>
        </div>
        <div style="display:flex;margin-bottom:0;">
          <div style="min-width:32px;height:32px;border-radius:16px;background:#dd8273;color:#fff;font-weight:800;font-size:14px;text-align:center;line-height:32px;">5</div>
          <div style="margin-left:12px;padding-top:5px;">
            <strong style="color:#1a0e0e;font-size:14px;">¡Empieza a registrar!</strong>
            <p style="color:#666;font-size:13px;margin:2px 0 0;line-height:1.4;">
              Cada día, registra tus deposiciones. Tu médico podrá hacer seguimiento de forma segura.
            </p>
          </div>
        </div>
      </div>
      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${APP_URL}" style="display:inline-block;background:#1a0e0e;color:#ffffff;font-size:15px;font-weight:700;padding:14px 40px;border-radius:999px;text-decoration:none;">
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
