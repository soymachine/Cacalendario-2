import { useState } from 'react';
import Switch from 'rc-switch';
import { CheckCircle, WarningCircle, Play, X } from '@phosphor-icons/react';
import FoodConfigEditor from './FoodConfigEditor';
import { linkFoodConfig, enableFoodConfig, type FoodTrackingConfig } from '../lib/food';
import { coreFieldsFor, type EntryTypeMode } from '../lib/coreFields';

// Invitar a un paciente (MW) en dos pasos, con su pauta ya configurada:
//  1. ¿Registra comidas? → pauta de comidas (deshabilitada hasta decir que sí).
//  2. ¿Registra deposiciones / micciones? → tipo de registro y campos.
// "Siguiente" y "Finalizar" se habilitan al elegir una opción en cada paso.

export interface InviteSettings {
  email: string;
  entryTypeMode: EntryTypeMode;
  hiddenFields: string[];
  foodConfig: FoodTrackingConfig;
}

export interface InviteResult {
  error?: string;
  emailSent?: boolean;
  emailError?: string;
}

interface InvitePatientModalProps {
  onClose: () => void;
  onInvite: (settings: InviteSettings) => Promise<InviteResult>;
  /** Límite del plan Beta alcanzado: no se puede invitar. */
  atLimit: boolean;
  onUpgrade: () => void;
  onShowDemo: () => void;
  foodTagCatalog: string[];
  onCreateFoodTag: (tag: string) => void;
  accent: string;
  dark: string;
  today: string;
}

type CoreChoice = EntryTypeMode | null;

const CORE_OPTIONS: { value: EntryTypeMode; label: string; desc: string }[] = [
  { value: 'both', label: 'Ambas', desc: 'Deposiciones y micciones' },
  { value: 'poop_only', label: 'Solo deposiciones', desc: '' },
  { value: 'urine_only', label: 'Solo micciones', desc: '' },
  { value: 'none', label: 'No', desc: 'Solo registrará comidas' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InvitePatientModal({
  onClose, onInvite, atLimit, onUpgrade, onShowDemo, foodTagCatalog, onCreateFoodTag, accent, dark, today,
}: InvitePatientModalProps) {
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [email, setEmail] = useState('');
  const [foodChoice, setFoodChoice] = useState<'yes' | 'no' | null>(null);
  const [foodConfig, setFoodConfig] = useState<FoodTrackingConfig>(() => linkFoodConfig(null));
  const [coreChoice, setCoreChoice] = useState<CoreChoice>(null);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ email: string } & InviteResult | null>(null);

  const emailOk = EMAIL_RE.test(email.trim());
  const canNext = emailOk && foodChoice !== null && !atLimit;
  const coreOptions = CORE_OPTIONS.filter((o) => o.value !== 'none' || foodChoice === 'yes');
  const canFinish = coreChoice !== null && !sending;

  const chooseFood = (choice: 'yes' | 'no') => {
    setFoodChoice(choice);
    // "Solo comidas" deja de tener sentido sin comidas
    if (choice === 'no' && coreChoice === 'none') setCoreChoice(null);
  };

  const reset = () => {
    setStep(1); setEmail(''); setFoodChoice(null); setFoodConfig(linkFoodConfig(null));
    setCoreChoice(null); setHiddenFields([]); setError(''); setResult(null);
  };

  const finish = async () => {
    if (!coreChoice || !foodChoice) return;
    setSending(true);
    setError('');
    const settings: InviteSettings = {
      email: email.trim(),
      entryTypeMode: coreChoice,
      hiddenFields: coreChoice === 'none' ? [] : hiddenFields,
      foodConfig: foodChoice === 'yes' ? enableFoodConfig(foodConfig, today) : { ...foodConfig, enabled: false },
    };
    const res = await onInvite(settings);
    setSending(false);
    if (res.error) { setError(res.error); return; }
    setResult({ email: settings.email, ...res });
    setStep('done');
  };

  const optionCard = (active: boolean) => ({
    borderColor: active ? accent : 'var(--border, #DCE2DF)',
    backgroundColor: active ? `${accent}14` : 'var(--color-surface, #fff)',
    boxShadow: active ? `0 0 0 1px ${accent}` : undefined,
  });
  const primaryBtn = (enabled: boolean) => ({
    backgroundColor: dark, opacity: enabled ? 1 : 0.4, cursor: enabled ? 'pointer' : 'not-allowed',
  });
  const disabledBlock = (disabled: boolean) =>
    disabled ? 'opacity-40 pointer-events-none select-none transition-opacity' : 'transition-opacity';

  return (
    <div
      className="medics-invite-modal fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/35 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div
        className="bg-fx-surface w-full max-w-[560px] max-h-[calc(100vh-32px)] flex flex-col rounded-fx-lg shadow-fx-xl overflow-hidden font-fx"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-fx-border-soft">
          <div>
            <h2 id="invite-modal-title" className="text-[19px] font-extrabold text-fx-text m-0">Invitar a un paciente</h2>
            {step !== 'done' && (
              <div className="flex items-center gap-2 mt-2">
                {[1, 2].map((n) => (
                  <span key={n} className="h-1.5 w-10 rounded-full" style={{ backgroundColor: n <= step ? accent : 'var(--fx-ink-150, #E5EAE7)' }} />
                ))}
                <span className="text-[11px] font-semibold text-fx-text-tertiary ml-1">Paso {step} de 2</span>
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="bg-transparent border-none cursor-pointer text-fx-ink-400 p-1 rounded hover:bg-fx-ink-100">
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label htmlFor="invite-email" className="block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Email del paciente</label>
                <input
                  id="invite-email"
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@email.com"
                  disabled={atLimit}
                  className="w-full py-3 px-3.5 rounded-fx-md border border-fx-border text-[15px] outline-none box-border bg-fx-surface text-fx-text"
                />
                {atLimit && (
                  <p className="text-xs text-fx-warning-600 mt-2 mb-0 flex items-center gap-1.5">
                    <WarningCircle size={14} weight="fill" /> Has alcanzado el límite del plan Beta.{' '}
                    <button onClick={onUpgrade} className="bg-transparent border-none font-bold text-xs cursor-pointer underline p-0" style={{ color: dark }}>Pasa a Pro</button>
                    {' '}para añadir más pacientes.
                  </p>
                )}
              </div>

              <div>
                <div className="text-[15px] font-bold text-fx-text mb-2.5">¿Quieres que registre sus comidas?</div>
                <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Registro de comidas">
                  {([['yes', 'Sí', 'Configura la pauta abajo'], ['no', 'No', 'Sin seguimiento de comidas']] as const).map(([value, label, desc]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={foodChoice === value}
                      onClick={() => chooseFood(value)}
                      className="text-left rounded-fx-md border px-4 py-3 cursor-pointer transition-all"
                      style={optionCard(foodChoice === value)}
                    >
                      <div className="text-[14px] font-bold text-fx-text">{label}</div>
                      <div className="text-[11px] text-fx-text-tertiary mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={disabledBlock(foodChoice !== 'yes')} aria-disabled={foodChoice !== 'yes'}>
                <FoodConfigEditor
                  value={foodConfig}
                  onChange={setFoodConfig}
                  catalog={foodTagCatalog}
                  onCreateTag={onCreateFoodTag}
                  accent={accent}
                  today={today}
                  hideToggle
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-[15px] font-bold text-fx-text mb-2.5">¿Registrará también deposiciones y micciones?</div>
                <div className={`grid gap-2.5 ${coreOptions.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`} role="radiogroup" aria-label="Deposiciones y micciones">
                  {coreOptions.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={coreChoice === o.value}
                      onClick={() => setCoreChoice(o.value)}
                      className="text-left rounded-fx-md border px-4 py-3 cursor-pointer transition-all"
                      style={optionCard(coreChoice === o.value)}
                    >
                      <div className="text-[14px] font-bold text-fx-text">{o.label}</div>
                      {o.desc && <div className="text-[11px] text-fx-text-tertiary mt-0.5">{o.desc}</div>}
                    </button>
                  ))}
                </div>
              </div>

              {coreChoice !== 'none' && (
                <div className={`bg-fx-surface rounded-fx-lg border border-fx-border-soft px-4 py-3 ${disabledBlock(coreChoice === null)}`} aria-disabled={coreChoice === null}>
                  <p className="text-xs text-fx-ink-400 mt-0 mb-1.5 leading-relaxed">
                    Campos visibles para el paciente al registrar. La fecha, la hora y las notas siempre aparecen.
                  </p>
                  {coreFieldsFor(coreChoice ?? 'both').map((field, i, arr) => (
                    <div key={field.id}>
                      {field.group && (
                        <div className={`text-[10px] font-extrabold text-fx-ink-300 tracking-wide uppercase ${i === 0 ? 'pt-1 pb-1.5' : 'pt-3 pb-1.5 border-t border-fx-border-soft'}`}>{field.group}</div>
                      )}
                      <div className={`flex items-center justify-between py-2 ${i < arr.length - 1 ? 'border-b border-fx-border-soft' : ''}`}>
                        <span className="text-[13px] font-medium text-fx-text">{field.label}</span>
                        <Switch
                          checked={!hiddenFields.includes(field.id)}
                          disabled={coreChoice === null}
                          onChange={(checked) => setHiddenFields((prev) => checked ? prev.filter((id) => id !== field.id) : [...prev, field.id])}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-[13px] text-fx-error-600 m-0 flex items-center gap-1.5"><WarningCircle size={15} weight="fill" />{error}</p>
              )}
            </div>
          )}

          {step === 'done' && result && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 bg-fx-success-50 rounded-fx-md px-4 py-3.5">
                <CheckCircle size={22} weight="fill" color="var(--color-success)" className="flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[14px] font-bold text-fx-text">Invitación enviada</div>
                  <div className="text-[13px] text-fx-text-secondary mt-0.5 break-all">{result.email}</div>
                </div>
              </div>
              {result.emailSent && (
                <p className="text-[13px] text-fx-text-secondary m-0">El paciente recibirá un email con los pasos para descargar la app y aceptar tu invitación.</p>
              )}
              {result.emailError && (
                <p className="text-xs text-fx-warning-600 m-0 flex items-center gap-1.5"><WarningCircle size={14} weight="fill" />{result.emailError}</p>
              )}
              <div className="text-[13px] text-fx-text-secondary leading-relaxed">
                <div className="font-bold text-fx-text mb-1">Qué tiene que hacer el paciente</div>
                <ol className="m-0 pl-5 list-decimal">
                  <li>Descargar la app <strong>Fluxia</strong> (App Store o Google Play).</li>
                  <li>Crear su cuenta o iniciar sesión con el email al que le has invitado.</li>
                </ol>
                <p className="mt-2 mb-0 text-fx-ink-400">La pauta que has elegido se aplicará en cuanto entre en la app.</p>
              </div>
              <button onClick={onShowDemo} className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-fx-pill border border-fx-border bg-fx-surface text-[13px] font-semibold cursor-pointer text-fx-text">
                <Play size={14} weight="fill" color="var(--color-primary)" /> Ver demo en vídeo
              </button>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-fx-border-soft bg-fx-surface-2">
          {step === 1 && (
            <>
              <span className="text-[11px] text-fx-text-tertiary">
                {!canNext && !atLimit ? (!emailOk ? 'Introduce el email del paciente' : 'Elige si registrará comidas') : ''}
              </span>
              <button onClick={() => canNext && setStep(2)} disabled={!canNext} className="px-6 py-2.5 rounded-fx-pill text-white font-semibold text-[14px] border-none" style={primaryBtn(canNext)}>
                Siguiente
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} disabled={sending} className="px-4 py-2.5 rounded-fx-pill border border-fx-border bg-fx-surface text-[14px] font-semibold cursor-pointer text-fx-text-secondary">
                ← Atrás
              </button>
              <button onClick={finish} disabled={!canFinish} className="px-6 py-2.5 rounded-fx-pill text-white font-semibold text-[14px] border-none" style={primaryBtn(canFinish)}>
                {sending ? 'Enviando…' : 'Finalizar'}
              </button>
            </>
          )}
          {step === 'done' && (
            <>
              <button onClick={reset} className="px-4 py-2.5 rounded-fx-pill border border-fx-border bg-fx-surface text-[14px] font-semibold cursor-pointer text-fx-text-secondary">
                Invitar a otro paciente
              </button>
              <button onClick={onClose} className="px-6 py-2.5 rounded-fx-pill text-white font-semibold text-[14px] border-none cursor-pointer" style={{ backgroundColor: dark }}>
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
