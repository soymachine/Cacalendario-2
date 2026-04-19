import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { asset } from '../lib/config';
import { D } from '../lib/design';

interface AuthScreenProps {
  onClose: () => void;
  onSuccess: () => void;
  onShowPrivacy: () => void;
}

type Mode = 'login' | 'signup' | 'forgot' | 'forgot-sent' | 'reset';

export default function AuthScreen({ onClose, onSuccess, onShowPrivacy }: AuthScreenProps) {
  const { signIn, signUp, signInWithGoogle, resetPassword, updatePassword, isRecovery, clearRecovery } = useAuth();
  const [mode, setMode] = useState<Mode>(isRecovery ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleForgot = async () => {
    setError('');
    if (!email) { setError('Introduce tu email'); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) { setError(error); return; }
    setMode('forgot-sent');
  };

  const handleResetPassword = async () => {
    setError('');
    if (!password || password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== password2) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) { setError(error); return; }
    clearRecovery();
    onSuccess();
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    if (!email || !password) { setError('Rellena todos los campos'); setLoading(false); return; }
    if (mode === 'signup' && !acceptedPrivacy) { setError('Debes aceptar la política de privacidad'); setLoading(false); return; }
    if (mode === 'signup') {
      const { error } = await signUp(email, password);
      if (error) { setError(error); } else { setSignupSuccess(true); }
    } else {
      const { error } = await signIn(email, password);
      if (error) { setError(error); } else { onSuccess(); }
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: D.chip,
    border: 'none',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 16,
    color: D.text,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    marginTop: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 900, color: D.textMuted,
    letterSpacing: 0.5, marginTop: 16, display: 'block',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', backgroundColor: D.bg }}>
      <div style={{ width: '100%', maxWidth: 480, height: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 16, zIndex: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill={D.primary} />
            <path d="M12 12L24 24M24 12L12 24" stroke={D.primaryText} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 48, paddingBottom: 24, flexShrink: 0 }}>
          <img src={asset('/fluxia-logo.png')} alt="Fluxia" style={{ height: 56, objectFit: 'contain' }} />
        </div>

        <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
          {mode === 'reset' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: 32, textAlign: 'center', marginBottom: 4 }}>🔐</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: D.text, textAlign: 'center' }}>Nueva contraseña</p>
              <p style={{ fontSize: 13, color: D.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 8 }}>Introduce tu nueva contraseña</p>
              <span style={labelStyle}>NUEVA CONTRASEÑA</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" style={inputStyle} />
              <span style={labelStyle}>CONFIRMAR CONTRASEÑA</span>
              <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Repite la contraseña" autoComplete="new-password" onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()} style={inputStyle} />
              {error && <p style={{ fontSize: 13, color: D.danger, marginTop: 8 }}>{error}</p>}
              <button onClick={handleResetPassword} disabled={loading} style={{ width: '100%', marginTop: 20, padding: '14px 0', borderRadius: 99, border: 'none', cursor: 'pointer', backgroundColor: D.primary, color: D.primaryText, fontSize: 16, fontWeight: 700, opacity: loading ? 0.5 : 1 }}>
                {loading ? '...' : 'Cambiar contraseña'}
              </button>
            </div>
          ) : mode === 'forgot' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: 32, textAlign: 'center', marginBottom: 4 }}>📧</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: D.text, textAlign: 'center' }}>Recuperar contraseña</p>
              <p style={{ fontSize: 13, color: D.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 8 }}>Te enviaremos un enlace para restablecer tu contraseña</p>
              <span style={labelStyle}>EMAIL</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" onKeyDown={(e) => e.key === 'Enter' && handleForgot()} style={inputStyle} />
              {error && <p style={{ fontSize: 13, color: D.danger, marginTop: 8 }}>{error}</p>}
              <button onClick={handleForgot} disabled={loading} style={{ width: '100%', marginTop: 20, padding: '14px 0', borderRadius: 99, border: 'none', cursor: 'pointer', backgroundColor: D.primary, color: D.primaryText, fontSize: 16, fontWeight: 700, opacity: loading ? 0.5 : 1 }}>
                {loading ? '...' : 'Enviar enlace'}
              </button>
              <button onClick={() => { setMode('login'); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, fontSize: 13, color: D.textMuted, textDecoration: 'underline' }}>
                Volver al inicio de sesión
              </button>
            </div>
          ) : mode === 'forgot-sent' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>✅</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: D.text }}>¡Email enviado!</p>
              <p style={{ fontSize: 14, color: D.text, marginTop: 10 }}>Hemos enviado un enlace de recuperación a <strong>{email}</strong></p>
              <p style={{ fontSize: 13, color: D.textMuted, marginTop: 10 }}>Revisa tu bandeja de entrada (y spam). Haz clic en el enlace para crear una nueva contraseña.</p>
              <button onClick={() => { setMode('login'); setError(''); setPassword(''); }} style={{ marginTop: 24, padding: '12px 32px', borderRadius: 99, border: 'none', cursor: 'pointer', backgroundColor: D.primary, color: D.primaryText, fontSize: 16, fontWeight: 700 }}>
                Volver al login
              </button>
            </div>
          ) : signupSuccess ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>📧</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: D.text }}>¡Revisa tu email!</p>
              <p style={{ fontSize: 14, color: D.text, marginTop: 10 }}>Te hemos enviado un enlace de confirmación a <strong>{email}</strong></p>
              <p style={{ fontSize: 13, color: D.textMuted, marginTop: 10 }}>Después de confirmar, vuelve aquí e inicia sesión.</p>
              <button onClick={() => { setSignupSuccess(false); setMode('login'); setPassword(''); }} style={{ marginTop: 24, padding: '12px 32px', borderRadius: 99, border: 'none', cursor: 'pointer', backgroundColor: D.primary, color: D.primaryText, fontSize: 16, fontWeight: 700 }}>
                Iniciar sesión
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 24, fontWeight: 900, color: D.text, marginBottom: 2 }}>
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </p>
              <p style={{ fontSize: 13, color: D.textMuted, marginBottom: 16 }}>
                {mode === 'login' ? 'Sincroniza tus datos entre dispositivos' : 'Crea una cuenta para no perder tus registros'}
              </p>

              {/* Google button */}
              <button
                onClick={signInWithGoogle}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 0', borderRadius: 99, border: '1.5px solid #e0e0e0', backgroundColor: '#fff', fontSize: 15, fontWeight: 600, color: '#222', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: D.border }} />
                <span style={{ fontSize: 12, color: D.textMuted, fontWeight: 500 }}>o con tu email</span>
                <div style={{ flex: 1, height: 1, backgroundColor: D.border }} />
              </div>

              <span style={labelStyle}>EMAIL</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" style={inputStyle} />

              <span style={labelStyle}>CONTRASEÑA</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} style={inputStyle} />

              {error && <p style={{ fontSize: 13, color: D.danger, marginTop: 8 }}>{error}</p>}

              {mode === 'signup' && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, flexShrink: 0, accentColor: D.primary as string }} />
                  <span style={{ fontSize: 13, color: D.textMuted, lineHeight: 1.4 }}>
                    He leído y acepto la{' '}
                    <button type="button" onClick={(e) => { e.preventDefault(); onShowPrivacy(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 700, color: D.text, textDecoration: 'underline' }}>
                      política de privacidad
                    </button>
                    . Consiento el tratamiento de mis datos de salud.
                  </span>
                </label>
              )}

              {mode === 'login' && (
                <button onClick={() => { setMode('forgot'); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 10, fontSize: 13, color: D.textMuted, textDecoration: 'underline', textAlign: 'left', padding: 0 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}

              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setAcceptedPrivacy(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, fontSize: 13, color: D.textMuted, textDecoration: 'underline', textAlign: 'left', padding: 0 }}>
                {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </>
          )}
        </div>

        {/* Submit button */}
        {(mode === 'login' || mode === 'signup') && !signupSuccess && (
          <div style={{ flexShrink: 0, padding: '16px 24px 24px' }}>
            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '16px 0', borderRadius: 99, border: 'none', cursor: 'pointer', backgroundColor: D.primary, color: D.primaryText, fontSize: 17, fontWeight: 800, opacity: loading ? 0.5 : 1 }}>
              {loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
