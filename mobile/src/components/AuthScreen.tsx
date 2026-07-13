import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Image, ScrollView, StyleSheet, Modal,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useAuth } from '../lib/auth';
import { D } from '../lib/design';
import { CloseIcon, EyeIcon, GoogleIcon } from './icons';

interface AuthScreenProps {
  onClose: () => void;
  onSuccess: () => void;
  onShowPrivacy: () => void;
}

type Mode = 'login' | 'signup' | 'forgot' | 'forgot-sent' | 'reset';

function PasswordInput({ showPassword, onToggle, ...props }: {
  showPassword: boolean;
  onToggle: () => void;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={styles.passwordWrap}>
      <TextInput
        {...props}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        placeholderTextColor={D.textMuted}
        style={[styles.input, styles.passwordInput]}
      />
      <Pressable onPress={onToggle} style={styles.eyeButton}>
        <EyeIcon open={showPassword} />
      </Pressable>
    </View>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Close button */}
        <Pressable onPress={onClose} style={styles.closeButton}>
          <CloseIcon />
        </Pressable>

        {/* Logo */}
        <View style={styles.logoRow}>
          <Image source={require('../assets/fluxia-logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {mode === 'reset' ? (
            <View style={styles.centered}>
              <Text style={styles.bigEmoji}>🔐</Text>
              <Text style={styles.heading}>Nueva contraseña</Text>
              <Text style={styles.subheading}>Introduce tu nueva contraseña</Text>
              <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
              <PasswordInput showPassword={showPassword} onToggle={() => setShowPassword(s => !s)} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" />
              <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
              <PasswordInput showPassword={showPassword} onToggle={() => setShowPassword(s => !s)} value={password2} onChangeText={setPassword2} placeholder="Repite la contraseña" onSubmitEditing={handleResetPassword} />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Pressable onPress={handleResetPassword} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>
                <Text style={styles.primaryButtonText}>{loading ? '...' : 'Cambiar contraseña'}</Text>
              </Pressable>
            </View>
          ) : mode === 'forgot' ? (
            <View style={styles.centered}>
              <Text style={styles.bigEmoji}>📧</Text>
              <Text style={styles.heading}>Recuperar contraseña</Text>
              <Text style={styles.subheading}>Te enviaremos un enlace para restablecer tu contraseña</Text>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor={D.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                onSubmitEditing={handleForgot}
                style={styles.input}
              />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Pressable onPress={handleForgot} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>
                <Text style={styles.primaryButtonText}>{loading ? '...' : 'Enviar enlace'}</Text>
              </Pressable>
              <Pressable onPress={() => { setMode('login'); setError(''); }}>
                <Text style={styles.link}>Volver al inicio de sesión</Text>
              </Pressable>
            </View>
          ) : mode === 'forgot-sent' ? (
            <View style={[styles.centered, styles.centeredText]}>
              <Text style={styles.bigEmoji}>✅</Text>
              <Text style={styles.heading}>¡Email enviado!</Text>
              <Text style={styles.paragraph}>Hemos enviado un enlace de recuperación a <Text style={styles.bold}>{email}</Text></Text>
              <Text style={styles.paragraphMuted}>Revisa tu bandeja de entrada (y spam). Haz clic en el enlace para crear una nueva contraseña.</Text>
              <Pressable onPress={() => { setMode('login'); setError(''); setPassword(''); }} style={[styles.primaryButton, styles.narrowButton]}>
                <Text style={styles.primaryButtonText}>Volver al login</Text>
              </Pressable>
            </View>
          ) : signupSuccess ? (
            <View style={[styles.centered, styles.centeredText]}>
              <Text style={styles.bigEmoji}>📧</Text>
              <Text style={styles.heading}>¡Revisa tu email!</Text>
              <Text style={styles.paragraph}>Te hemos enviado un enlace de confirmación a <Text style={styles.bold}>{email}</Text></Text>
              <Text style={styles.paragraphMuted}>Después de confirmar, vuelve aquí e inicia sesión.</Text>
              <Pressable onPress={() => { setSignupSuccess(false); setMode('login'); setPassword(''); }} style={[styles.primaryButton, styles.narrowButton]}>
                <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.heading}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
              <Text style={styles.subheadingLeft}>
                {mode === 'login' ? 'Sincroniza tus datos entre dispositivos' : 'Crea una cuenta para no perder tus registros'}
              </Text>

              {/* Google button */}
              <Pressable onPress={signInWithGoogle} style={styles.googleButton}>
                <GoogleIcon />
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o con tu email</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor={D.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />

              <Text style={styles.label}>CONTRASEÑA</Text>
              <PasswordInput
                showPassword={showPassword}
                onToggle={() => setShowPassword(s => !s)}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                onSubmitEditing={handleSubmit}
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              {mode === 'signup' && (
                <View style={styles.privacyRow}>
                  <Switch
                    value={acceptedPrivacy}
                    onValueChange={setAcceptedPrivacy}
                    trackColor={{ true: D.primary, false: D.chipDark }}
                    thumbColor="#fff"
                  />
                  <Text style={styles.privacyText}>
                    He leído y acepto la{' '}
                    <Text onPress={onShowPrivacy} style={styles.privacyLink}>política de privacidad</Text>
                    . Consiento el tratamiento de mis datos de salud.
                  </Text>
                </View>
              )}

              {mode === 'login' && (
                <Pressable onPress={() => { setMode('forgot'); setError(''); }}>
                  <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
                </Pressable>
              )}

              <Pressable onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setAcceptedPrivacy(false); }}>
                <Text style={styles.link}>
                  {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>

        {/* Submit button */}
        {(mode === 'login' || mode === 'signup') && !signupSuccess && (
          <View style={styles.footer}>
            <Pressable onPress={handleSubmit} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>
              <Text style={styles.submitText}>{loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: D.bg,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
  },
  logo: {
    height: 56,
    width: 160,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  centeredText: {
    alignItems: 'center',
  },
  bigEmoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    color: D.text,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 13,
    color: D.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  subheadingLeft: {
    fontSize: 13,
    color: D.textMuted,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 14,
    color: D.text,
    marginTop: 10,
    textAlign: 'center',
  },
  paragraphMuted: {
    fontSize: 13,
    color: D.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: D.textMuted,
    letterSpacing: 0.5,
    marginTop: 16,
  },
  input: {
    width: '100%',
    backgroundColor: D.chip,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: D.text,
    marginTop: 8,
  },
  passwordWrap: {
    position: 'relative',
    marginTop: 8,
  },
  passwordInput: {
    marginTop: 0,
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 8,
  },
  error: {
    fontSize: 13,
    color: D.danger,
    marginTop: 8,
  },
  primaryButton: {
    width: '100%',
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 99,
    backgroundColor: D.primary,
    alignItems: 'center',
  },
  narrowButton: {
    width: 'auto',
    marginTop: 24,
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    color: D.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  link: {
    fontSize: 13,
    color: D.textMuted,
    textDecorationLine: 'underline',
    marginTop: 10,
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: D.border,
  },
  dividerText: {
    fontSize: 12,
    color: D.textMuted,
    fontWeight: '500',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: D.textMuted,
    lineHeight: 18,
  },
  privacyLink: {
    fontWeight: '700',
    color: D.text,
    textDecorationLine: 'underline',
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  submitText: {
    color: D.primaryText,
    fontSize: 17,
    fontWeight: '800',
  },
});
