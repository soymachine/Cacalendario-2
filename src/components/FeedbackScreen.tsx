import { useState } from 'react';
import { usePreferences } from '../lib/usePreferences';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface FeedbackScreenProps {
  onClose: () => void;
}

const FEEDBACK_TYPES = [
  { id: 'bug', emoji: '🐛', label: 'Error' },
  { id: 'suggestion', emoji: '💡', label: 'Sugerencia' },
  { id: 'question', emoji: '❓', label: 'Pregunta' },
  { id: 'other', emoji: '💬', label: 'Otro' },
] as const;

type FeedbackType = typeof FEEDBACK_TYPES[number]['id'];

export default function FeedbackScreen({ onClose }: FeedbackScreenProps) {
  const { theme } = usePreferences();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Escribe un mensaje');
      return;
    }
    if (!email.trim()) {
      setError('Indica tu email para poder responderte');
      return;
    }

    setLoading(true);
    setError('');

    const { error: dbError } = await supabase
      .from('feedback')
      .insert({ user_email: email.trim(), message: message.trim(), type: feedbackType });

    if (dbError) {
      setError('Error al enviar. Inténtalo de nuevo.');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ backgroundColor: theme.main }}>
      <div className="w-full max-w-md h-full mx-auto flex flex-col relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill={theme.text} />
            <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex-1 px-8 pt-16 flex flex-col">
          {sent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-5xl mb-4">💌</p>
              <p className="text-xl font-black" style={{ color: theme.text }}>¡Mensaje enviado!</p>
              <p className="text-base mt-3" style={{ color: `${theme.text}99` }}>
                Gracias por tu feedback. Lo revisaremos pronto.
              </p>
              <button
                onClick={onClose}
                className="mt-8 rounded-full px-10 py-3 active:scale-95 transition-transform"
                style={{ backgroundColor: theme.text }}
              >
                <span className="text-lg" style={{ color: invertColor }}>volver</span>
              </button>
            </div>
          ) : (
            <>
              <p className="text-2xl font-black" style={{ color: theme.text }}>FEEDBACK</p>
              <p className="text-sm mt-1" style={{ color: `${theme.text}99` }}>
                ¿Has encontrado un error o tienes una idea para mejorar?
              </p>

              {/* Email (pre-filled if logged in) */}
              {!user && (
                <>
                  <p className="text-sm font-black mt-6" style={{ color: theme.text }}>TU EMAIL</p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="para poder responderte"
                    className="w-full mt-2 rounded-lg p-4 text-base outline-none placeholder-white/60"
                    style={{ backgroundColor: theme.glass, color: theme.text }}
                  />
                </>
              )}

              {/* Type selector */}
              <p className="text-sm font-black mt-5" style={{ color: theme.text }}>TIPO</p>
              <div className="flex gap-2 mt-2">
                {FEEDBACK_TYPES.map((type) => {
                  const isSelected = feedbackType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setFeedbackType(type.id)}
                      className="flex-1 rounded-lg py-2.5 flex flex-col items-center gap-1 active:scale-95 transition-all"
                      style={{
                        backgroundColor: isSelected ? theme.text : theme.glass,
                      }}
                    >
                      <span className="text-lg">{type.emoji}</span>
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: isSelected ? invertColor : `${theme.text}99` }}
                      >
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Message */}
              <p className="text-sm font-black mt-5" style={{ color: theme.text }}>MENSAJE</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe el error o tu sugerencia..."
                rows={6}
                className="w-full mt-2 rounded-lg p-4 text-base outline-none placeholder-white/60 resize-none flex-1 min-h-[120px] max-h-[300px]"
                style={{ backgroundColor: theme.glass, color: theme.text }}
              />

              {error && (
                <p className="text-sm text-red-800 bg-red-100/50 rounded-lg p-3 mt-3">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Send button */}
        {!sent && (
          <div className="shrink-0 flex justify-center px-8 py-6">
            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full rounded-full py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              style={{ backgroundColor: theme.text }}
            >
              <span className="text-lg" style={{ color: invertColor }}>
                {loading ? 'enviando...' : 'enviar'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
