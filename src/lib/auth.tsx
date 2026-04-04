import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecovery: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
      // Ensure user_profiles row exists for existing sessions
      if (session?.user) {
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
      // Clean up auth tokens from the URL (PKCE ?code= or implicit #access_token=)
      // so the PWA is never installed with a token-laden URL as its start_url
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') &&
          (window.location.search || window.location.hash)) {
        window.history.replaceState({}, '', '/');
      }
      // Ensure user_profiles row exists on sign-in/sign-up
      if ((event === 'SIGNED_IN' || event === 'SIGNED_UP') && session?.user) {
        supabase.from('user_profiles').upsert(
          { id: session.user.id, email: session.user.email ?? null },
          { onConflict: 'id', ignoreDuplicates: true },
        ).then(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/',
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const siteUrl = window.location.origin + '/';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl,
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
    <AuthContext.Provider value={{ user, session, loading, isRecovery, signUp, signIn, signOut, resetPassword, updatePassword, clearRecovery }}>
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
