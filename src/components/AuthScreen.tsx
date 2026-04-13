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
  const { signIn, signUp, resetPassword, updatePassword, isRecovery, clearRecovery } = useAuth();
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
              <p style={{ fontSize: 13, color: D.textMuted, marginBottom: 4 }}>
                {mode === 'login' ? 'Sincroniza tus datos entre dispositivos' : 'Crea una cuenta para no perder tus registros'}
              </p>

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
