import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vchzhwvbvnwrrgfrxfor.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XED5kqp_p_xFmU7vuwMnOw_OGGLKtbk';

// Same backend as the web /medics dashboard and the patient app, but with its
// own storageKey (separate session from the patient app's mobile/ project)
// and persisting the session in AsyncStorage with PKCE for the native OAuth flow.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    storageKey: 'fluxia-auth-medic',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Refresh tokens only while the app is in the foreground (Supabase RN guidance).
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
