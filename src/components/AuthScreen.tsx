import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';

interface AuthScreenProps {
  onClose: () => void;
  onSuccess: () => void;
  onShowPrivacy: () => void;
}

type Mode = 'login' | 'signup';

export default function AuthScreen({ onClose, onSuccess, onShowPrivacy }: AuthScreenProps) {
  const { signIn, signUp } = useAuth();
  const { theme } = usePreferences();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Rellena todos los campos');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && !acceptedPrivacy) {
      setError('Debes aceptar la política de privacidad');
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setSignupSuccess(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        onSuccess();
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center" style={{ backgroundColor: theme.main }}>
      <div className="w-full max-w-md flex flex-col h-screen relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill={theme.text} />
            <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center pt-12 pb-6 shrink-0">
          <img src={asset('/logo.svg')} alt="Cacalendario" className="w-20 h-[71px]" />
        </div>

        <div className="flex-1 px-10 flex flex-col min-h-0">
          {signupSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-3xl mb-4">📧</p>
              <p className="text-xl font-black" style={{ color: theme.text }}>¡Revisa tu email!</p>
              <p className="text-base mt-3" style={{ color: theme.text }}>
                Te hemos enviado un enlace de confirmación a <strong>{email}</strong>
              </p>
              <p className="text-sm mt-4" style={{ color: `${theme.text}99` }}>
                Después de confirmar, vuelve aquí e inicia sesión.
              </p>
              <button
                onClick={() => { setSignupSuccess(false); setMode('login'); setPassword(''); }}
                className="mt-8 rounded-full px-10 py-3 active:scale-95 transition-transform"
                style={{ backgroundColor: theme.text }}
              >
                <span className="text-lg" style={{ color: invertColor }}>iniciar sesión</span>
              </button>
            </div>
          ) : (
            <>
              {/* Title */}
              <p className="text-2xl font-black shrink-0" style={{ color: theme.text }}>
                {mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
              </p>
              <p className="text-sm mt-1 shrink-0" style={{ color: `${theme.text}99` }}>
                {mode === 'login'
                  ? 'Sincroniza tus datos entre dispositivos'
                  : 'Crea una cuenta para no perder tus registros'}
              </p>

              {/* Email */}
              <p className="text-sm font-black mt-6 shrink-0" style={{ color: theme.text }}>EMAIL</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                className="w-full mt-2 rounded-lg p-4 text-base outline-none placeholder-white/60"
                style={{ backgroundColor: theme.glass, color: theme.text }}
              />

              {/* Password */}
              <p className="text-sm font-black mt-4 shrink-0" style={{ color: theme.text }}>CONTRASEÑA</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full mt-2 rounded-lg p-4 text-base outline-none placeholder-white/60"
                style={{ backgroundColor: theme.glass, color: theme.text }}
              />

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-800 bg-red-100/50 rounded-lg p-3 mt-3 shrink-0">{error}</p>
              )}

              {/* Privacy consent (only on signup) */}
              {mode === 'signup' && (
                <label className="flex items-start gap-3 mt-4 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="mt-1 w-5 h-5 shrink-0 accent-current rounded"
                    style={{ accentColor: theme.text }}
                  />
                  <span className="text-sm leading-snug" style={{ color: `${theme.text}cc` }}>
                    He leído y acepto la{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); onShowPrivacy(); }}
                      className="underline font-bold"
                      style={{ color: theme.text }}
                    >
                      política de privacidad
                    </button>
                    . Consiento el tratamiento de mis datos de salud.
                  </span>
                </label>
              )}

              {/* Toggle mode */}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setAcceptedPrivacy(false); }}
                className="text-sm underline mt-4 shrink-0 text-left"
                style={{ color: `${theme.text}99` }}
              >
                {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </>
          )}
        </div>

        {/* Submit button */}
        {!signupSuccess && (
          <div className="shrink-0 flex justify-center px-10 py-6">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full max-w-sm rounded-full py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              style={{ backgroundColor: theme.text }}
            >
              <span className="text-lg" style={{ color: invertColor }}>
                {loading ? '...' : mode === 'login' ? 'entrar' : 'crear cuenta'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
