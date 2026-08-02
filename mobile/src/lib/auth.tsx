import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecovery: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Deep link back into the app after the OAuth browser flow (fluxia://auth-callback)
const oauthRedirectTo = Linking.createURL('auth-callback');

/** Extract auth tokens from the OAuth callback URL and create a session. */
async function createSessionFromUrl(url: string): Promise<void> {
  const parsed = Linking.parse(url);
  const params = parsed.queryParams ?? {};

  // PKCE flow: ?code=...
  const code = typeof params.code === 'string' ? params.code : null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error('[auth] exchangeCodeForSession error:', error.message);
    return;
  }

  // Implicit flow fallback: #access_token=...&refresh_token=...
  const hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    const hashParams = new URLSearchParams(url.slice(hashIndex + 1));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) console.error('[auth] setSession error:', error.message);
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Ensure user_profiles row exists for existing sessions (skip doctors)
      if (session?.user && !session.user.user_metadata?.is_doctor) {
        supabase.from('user_profiles').upsert(
          { id: session.user.id, email: session.user.email ?? null },
          { onConflict: 'id', ignoreDuplicates: true },
        ).then(() => {});
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
      // Ensure user_profiles row exists on sign-in (sign-up also emits SIGNED_IN; skip doctors)
      if (event === 'SIGNED_IN' && session?.user
          && !session.user.user_metadata?.is_doctor) {
        supabase.from('user_profiles').upsert(
          { id: session.user.id, email: session.user.email ?? null },
          { onConflict: 'id', ignoreDuplicates: true },
        ).then(() => {});
      }
    });

    // Handle deep links (OAuth callback / recovery link) while the app is open
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('code=') || url.includes('access_token=')) {
        createSessionFromUrl(url);
      }
    });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://fluxia-health.com/',
      },
    });
    if (error) return { error: translateAuthError(error.message) };
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translateAuthError(error.message) };
    return { error: null };
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: oauthRedirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        console.error('[auth] signInWithOAuth error:', error?.message);
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, oauthRedirectTo);
      if (result.type === 'success' && result.url) {
        await createSessionFromUrl(result.url);
      }
    } catch (err) {
      console.error('[auth] Google sign-in error:', err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    // The recovery link opens the web app, where the user sets a new password.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://fluxia-health.com/',
    });
    if (error) return { error: translateAuthError(error.message) };
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: translateAuthError(error.message) };
    setIsRecovery(false);
    return { error: null };
  };

  const clearRecovery = () => setIsRecovery(false);

  return (
    <AuthContext.Provider value={{ user, session, loading, isRecovery, signUp, signIn, signInWithGoogle, signOut, resetPassword, updatePassword, clearRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email o contraseña incorrectos';
  if (message.includes('User already registered')) return 'Este email ya está registrado';
  if (message.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres';
  if (message.includes('Unable to validate email')) return 'Email no válido';
  if (message.includes('Email not confirmed')) return 'Confirma tu email antes de iniciar sesión';
  return message;
}
