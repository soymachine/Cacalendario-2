// Supabase Edge Function: delete-user
// Baja de cuenta del PACIENTE (PA y PW): borra sus datos y su usuario de auth
// de forma permanente. Las cuentas de profesional se eliminan desde MW con el
// RPC doctor_self_delete_account.
// Deploy via: supabase functions deploy delete-user

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

// Tablas con datos del paciente y la columna que lo identifica. entries,
// push_subscriptions, user_profiles y food_reminder_log también caen en
// cascada al borrar el usuario de auth, pero se borran explícitamente para
// no depender de ello. patient_links NO tiene cascada (FK NO ACTION): hay que
// borrarlo antes que el usuario; arrastra la bitácora del profesional sobre
// ese paciente (patient_clinical_notes, ON DELETE CASCADE).
const PATIENT_TABLES = [
  { table: 'entries', column: 'user_id' },
  { table: 'push_subscriptions', column: 'user_id' },
  { table: 'food_reminder_log', column: 'patient_id' },
  { table: 'patient_links', column: 'patient_id' },
  { table: 'user_profiles', column: 'id' },
] as const

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Identificar al usuario con su propio JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No authorization header' }, 401)

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) return json({ error: 'Invalid token' }, 401)

    // 2. Cliente de servicio para borrar datos y usuario
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 3. Los profesionales tienen su propia baja (y sus pacientes, bitácoras...)
    const { data: doctorRow, error: doctorError } = await supabaseAdmin
      .from('doctors').select('id').eq('id', user.id).maybeSingle()
    if (doctorError) return json({ error: `Failed to check account type: ${doctorError.message}` }, 500)
    if (doctorRow) {
      return json({ error: 'Las cuentas de profesional se eliminan desde el panel médico (Configuración).' }, 400)
    }

    // 4. Fotos de comidas (bucket privado food-photos, carpeta = id del usuario).
    // Antes que las tablas: si falla, no se borra nada más.
    while (true) {
      const { data: photos, error: listError } = await supabaseAdmin.storage
        .from('food-photos')
        .list(user.id, { limit: 1000 })
      if (listError) {
        console.error('Error listing food photos:', listError.message)
        return json({ error: `Failed to delete user data (food-photos): ${listError.message}` }, 500)
      }
      if (!photos || photos.length === 0) break
      const { error: removeError } = await supabaseAdmin.storage
        .from('food-photos')
        .remove(photos.map((p) => `${user.id}/${p.name}`))
      if (removeError) {
        console.error('Error deleting food photos:', removeError.message)
        return json({ error: `Failed to delete user data (food-photos): ${removeError.message}` }, 500)
      }
    }

    // 5. Datos del paciente (deben borrarse antes de tocar auth)
    for (const { table, column } of PATIENT_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, user.id)
      if (error) {
        // Registrar y abortar: NO borrar el usuario de auth si la limpieza falla
        console.error(`Error deleting ${table}:`, error.message)
        return json({ error: `Failed to delete user data (${table}): ${error.message}` }, 500)
      }
    }

    // 6. Solo entonces, el usuario de auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteUserError) {
      return json({ error: 'Failed to delete auth account: ' + deleteUserError.message }, 500)
    }

    return json({ success: true, message: 'Account and all data deleted permanently' }, 200)
  } catch (err) {
    return json({ error: 'Internal error: ' + (err as Error).message }, 500)
  }
})
