import { useState } from 'react';
import { usePreferences } from '../lib/usePreferences';
import { useTier } from '../lib/useTier';
import { asset } from '../lib/config';
import { POOP_EMOJIS, THEMES } from '../lib/preferences';

interface PremiumScreenProps {
  onClose: () => void;
}

const FEATURES = [
  {
    emoji: '♾️',
    title: 'Registros ilimitados',
    desc: 'Sin límite de entradas por día ni total',
  },
  {
    emoji: '📊',
    title: 'Estadísticas completas',
    desc: 'Historial completo, sin límite de 30 días',
  },
  {
    emoji: '🎨',
    title: 'Todos los temas',
    desc: `${THEMES.length} temas de colores para personalizar tu app`,
  },
  {
    emoji: '💩',
    title: 'Todos los emojis',
    desc: `${POOP_EMOJIS.length} emojis de caca para elegir`,
  },
  {
    emoji: '📝',
    title: 'Notas sin límite',
    desc: 'Escribe todo lo que necesites en cada registro',
  },
  {
    emoji: '🔬',
    title: 'Bristol completo',
    desc: 'Los 7 tipos de la escala de Bristol',
  },
  {
    emoji: '📤',
    title: 'Exportar datos',
    desc: 'Descarga tu historial en CSV para llevar al médico',
  },
  {
    emoji: '🚫',
    title: 'Sin publicidad',
    desc: 'Experiencia limpia, sin banners ni interrupciones',
  },
  {
    emoji: '🌟',
    title: 'Badge de supporter',
    desc: 'Muestra que apoyas el proyecto',
  },
];

const PLANS = [
  {
    id: 'monthly',
    label: 'Mensual',
    price: '1,99€',
    period: '/mes',
    highlight: false,
    badge: null,
  },
  {
    id: 'annual',
    label: 'Anual',
    price: '9,99€',
    period: '/año',
    highlight: true,
    badge: 'AHORRA 58%',
  },
  {
    id: 'lifetime',
    label: 'Para siempre',
    price: '19,99€',
    period: 'pago único',
    highlight: false,
    badge: 'POPULAR',
  },
];

export default function PremiumScreen({ onClose }: PremiumScreenProps) {
  const { theme } = usePreferences();
  const { tier } = useTier();
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [purchasing, setPurchasing] = useState(false);
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  const [showComingSoon, setShowComingSoon] = useState(false);

  const handlePurchase = () => {
    setShowComingSoon(true);
  };

  if (tier === 'premium') {
    return (
      <div className="fixed inset-0 z-50 flex justify-center" style={{ backgroundColor: theme.main }}>
        <div className="w-full max-w-md flex flex-col h-screen relative">
          <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill={theme.text} />
              <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <span className="text-6xl mb-4">🌟</span>
            <p className="text-2xl font-black" style={{ color: theme.text }}>¡Ya eres Premium!</p>
            <p className="text-base mt-3" style={{ color: `${theme.text}99` }}>
              Gracias por apoyar Cacalendario. Tienes todas las funciones desbloqueadas.
            </p>
            <button
              onClick={onClose}
              className="mt-8 rounded-full px-10 py-3 active:scale-95 transition-transform"
              style={{ backgroundColor: theme.text }}
            >
              <span className="text-lg" style={{ color: invertColor }}>volver</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto">
          {/* Hero section */}
          <div className="text-center pt-10 pb-6 px-8">
            <div className="relative inline-block">
              <img src={asset('/logo.svg')} alt="Cacalendario" className="w-16 h-[57px] mx-auto" />
              <span className="absolute -top-1 -right-3 text-2xl">⭐</span>
            </div>
            <h1 className="text-2xl font-black mt-4" style={{ color: theme.text }}>
              Cacalendario Premium
            </h1>
            <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>
              Desbloquea todo el potencial de tu seguimiento intestinal
            </p>
          </div>

          {/* Features showcase */}
          <div className="px-6 pb-6">
            <div className="space-y-2">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ backgroundColor: theme.glass }}
                >
                  <span className="text-xl shrink-0 mt-0.5">{feature.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: theme.text }}>
                      {feature.title}
                    </p>
                    <p className="text-xs" style={{ color: `${theme.text}80` }}>
                      {feature.desc}
                    </p>
                  </div>
                  <span className="text-base shrink-0 mt-0.5">✅</span>
                </div>
              ))}
            </div>
          </div>

          {/* Theme preview */}
          <div className="px-6 pb-6">
            <p className="text-xs font-black mb-3" style={{ color: `${theme.text}99` }}>
              TODOS LOS TEMAS INCLUIDOS
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {THEMES.map((t) => (
                <div
                  key={t.id}
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: t.main }}
                >
                  <span className="text-lg">{t.emoji}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emoji preview */}
          <div className="px-6 pb-6">
            <p className="text-xs font-black mb-3" style={{ color: `${theme.text}99` }}>
              TODOS LOS EMOJIS INCLUIDOS
            </p>
            <div className="flex gap-2 flex-wrap">
              {POOP_EMOJIS.map((e) => (
                <div
                  key={e.id}
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.glass }}
                >
                  <span className="text-xl">{e.char === 'svg' ? '💩' : e.char}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="px-6 pb-6">
            <p className="text-xs font-black mb-3" style={{ color: `${theme.text}99` }}>
              ELIGE TU PLAN
            </p>
            <div className="space-y-3">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className="w-full rounded-xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
                    style={{
                      backgroundColor: isSelected ? theme.text : theme.glass,
                      border: isSelected ? 'none' : `2px solid transparent`,
                    }}
                  >
                    {/* Radio circle */}
                    <div
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{
                        borderColor: isSelected ? invertColor : `${theme.text}40`,
                      }}
                    >
                      {isSelected && (
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: invertColor }}
                        />
                      )}
                    </div>

                    {/* Plan info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-base font-bold"
                          style={{ color: isSelected ? invertColor : theme.text }}
                        >
                          {plan.label}
                        </span>
                        {plan.badge && (
                          <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isSelected ? invertColor : '#f39c12',
                              color: isSelected ? theme.text : 'white',
                            }}
                          >
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: isSelected ? `${invertColor}99` : `${theme.text}80` }}
                      >
                        {plan.period}
                      </span>
                    </div>

                    {/* Price */}
                    <span
                      className="text-xl font-black shrink-0"
                      style={{ color: isSelected ? invertColor : theme.text }}
                    >
                      {plan.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison with free */}
          <div className="px-6 pb-8">
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.glass }}>
              <p className="text-xs font-black mb-3" style={{ color: `${theme.text}99` }}>
                FREE vs PREMIUM
              </p>
              <div className="space-y-2">
                {[
                  { feature: 'Registros/día', free: '3', premium: '∞' },
                  { feature: 'Historial stats', free: '30 días', premium: 'Todo' },
                  { feature: 'Notas', free: '50 chars', premium: '∞' },
                  { feature: 'Emojis', free: '3', premium: `${POOP_EMOJIS.length}` },
                  { feature: 'Temas', free: '2', premium: `${THEMES.length}` },
                  { feature: 'Exportar datos', free: '❌', premium: '✅' },
                  { feature: 'Sin publicidad', free: '❌', premium: '✅' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center text-xs" style={{ color: theme.text }}>
                    <span className="flex-1">{row.feature}</span>
                    <span className="w-16 text-center" style={{ opacity: 0.5 }}>{row.free}</span>
                    <span className="w-16 text-center font-bold">⭐ {row.premium}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky purchase button */}
        <div className="shrink-0 px-6 py-4" style={{ backgroundColor: theme.main }}>
          <button
            onClick={handlePurchase}
            className="w-full rounded-full py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ backgroundColor: '#f39c12' }}
          >
            <span className="text-lg font-bold text-white">
              {`⭐ Hazte Premium — ${PLANS.find(p => p.id === selectedPlan)?.price}`}
            </span>
          </button>
          <p className="text-[10px] text-center mt-2" style={{ color: `${theme.text}60` }}>
            Cancela cuando quieras · Pago seguro · Sin compromisos
          </p>
        </div>

        {/* Coming Soon overlay */}
        {showComingSoon && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ backgroundColor: `${theme.main}ee` }}
            onClick={() => setShowComingSoon(false)}
          >
            <div className="text-center px-8" onClick={(e) => e.stopPropagation()}>
              <span className="text-6xl block mb-4">🚧</span>
              <p className="text-2xl font-black" style={{ color: theme.text }}>¡Próximamente!</p>
              <p className="text-base mt-3" style={{ color: `${theme.text}99` }}>
                Estamos preparando los pagos Premium. Muy pronto podrás desbloquear todas las funciones.
              </p>
              <button
                onClick={() => setShowComingSoon(false)}
                className="mt-8 rounded-full px-10 py-3 active:scale-95 transition-transform"
                style={{ backgroundColor: theme.text }}
              >
                <span className="text-lg" style={{ color: invertColor }}>entendido</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
