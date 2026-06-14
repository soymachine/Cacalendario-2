import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vchzhwvbvnwrrgfrxfor.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XED5kqp_p_xFmU7vuwMnOw_OGGLKtbk';

// Cada app (paciente, médico, admin) usa su propia storageKey para que las
// sesiones no se sobreescriban entre sí al tener varias pestañas abiertas
// con usuarios distintos.
const makeClient = (storageKey: string) =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { storageKey } });

export const supabase = makeClient('fluxia-auth-patient');
export const supabaseMedics = makeClient('fluxia-auth-medic');
export const supabaseAdmin = makeClient('fluxia-auth-admin');
