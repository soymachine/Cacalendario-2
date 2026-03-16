import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vchzhwvbvnwrrgfrxfor.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XED5kqp_p_xFmU7vuwMnOw_OGGLKtbk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
