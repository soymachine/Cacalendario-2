import { usePreferences } from '../lib/usePreferences';
import { asset } from '../lib/config';

interface PrivacyScreenProps {
  onClose: () => void;
}

export default function PrivacyScreen({ onClose }: PrivacyScreenProps) {
  const { theme } = usePreferences();
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

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
        <div className="flex justify-center pt-12 pb-4 shrink-0">
          <img src={asset('/logo.svg')} alt="Cacalendario" className="w-16 h-[57px]" />
        </div>

        <div className="flex-1 min-h-0 px-6 overflow-y-auto pb-10">
          <h1 className="text-xl font-black mb-4" style={{ color: theme.text }}>
            POLÍTICA DE PRIVACIDAD
          </h1>
          <p className="text-xs mb-4" style={{ color: `${theme.text}80` }}>
            Última actualización: 17 de marzo de 2026
          </p>

          <Section title="1. Responsable del tratamiento" theme={theme}>
            El responsable del tratamiento de tus datos es el desarrollador de Cacalendario.
            Puedes contactarnos en: <strong>cacalendario@proton.me</strong>
          </Section>

          <Section title="2. Qué datos recogemos" theme={theme}>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li><strong>Email y contraseña</strong> — solo si creas una cuenta (opcional).</li>
              <li><strong>Registros de deposiciones</strong> — fecha, hora, notas, escala de Bristol y si flota.</li>
              <li><strong>Preferencias</strong> — emoji y tema visual seleccionados.</li>
            </ul>
          </Section>

          <Section title="3. Para qué usamos tus datos" theme={theme}>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li>Proporcionarte el servicio de seguimiento personal de salud digestiva.</li>
              <li>Sincronizar tus datos entre dispositivos (solo si creas cuenta).</li>
              <li>Generar estadísticas personales visibles únicamente por ti.</li>
            </ul>
            <p className="mt-2">
              <strong>No vendemos, compartimos ni cedemos tus datos a terceros.</strong>
            </p>
          </Section>

          <Section title="4. Datos de salud (categoría especial)" theme={theme}>
            Los registros de deposiciones y la escala de Bristol se consideran <strong>datos relativos a la salud</strong> según
            el artículo 9 del RGPD. El tratamiento se basa en tu <strong>consentimiento explícito</strong> (Art. 9.2.a RGPD),
            que nos proporcionas al crear una cuenta y aceptar esta política.
          </Section>

          <Section title="5. Dónde se almacenan tus datos" theme={theme}>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li><strong>Sin cuenta:</strong> tus datos se almacenan exclusivamente en tu dispositivo (localStorage del navegador). No tenemos acceso a ellos.</li>
              <li><strong>Con cuenta:</strong> tus datos se sincronizan con Supabase (infraestructura en AWS, región EU). La contraseña se almacena hasheada con bcrypt.</li>
            </ul>
          </Section>

          <Section title="6. Tus derechos" theme={theme}>
            Según el RGPD y la LOPDGDD, tienes derecho a:
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li><strong>Acceso:</strong> ver todos tus datos almacenados.</li>
              <li><strong>Rectificación:</strong> modificar tus registros en cualquier momento.</li>
              <li><strong>Supresión:</strong> eliminar tu cuenta y todos tus datos ("derecho al olvido").</li>
              <li><strong>Portabilidad:</strong> exportar tus datos en formato JSON.</li>
              <li><strong>Oposición:</strong> dejar de usar el servicio en cualquier momento.</li>
            </ul>
            <p className="mt-2">
              Puedes ejercer estos derechos desde la sección "Mi Cuenta" de la app, o contactándonos
              en <strong>cacalendario@proton.me</strong>.
            </p>
          </Section>

          <Section title="7. Retención de datos" theme={theme}>
            Conservamos tus datos mientras mantengas tu cuenta activa. Si eliminas tu cuenta,
            todos tus datos se borran de forma permanente e irreversible de nuestros servidores.
          </Section>

          <Section title="8. Seguridad" theme={theme}>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li>Comunicaciones cifradas con HTTPS/TLS.</li>
              <li>Contraseñas hasheadas con bcrypt (nunca en texto plano).</li>
              <li>Row Level Security (RLS) en base de datos: cada usuario solo accede a sus datos.</li>
              <li>Autenticación segura mediante tokens JWT.</li>
            </ul>
          </Section>

          <Section title="9. Cookies y tracking" theme={theme}>
            Cacalendario <strong>no utiliza cookies de terceros ni herramientas de tracking</strong>.
            Solo almacenamos datos funcionales en localStorage para el funcionamiento de la app.
          </Section>

          <Section title="10. Cambios en esta política" theme={theme}>
            Si realizamos cambios significativos en esta política, te notificaremos
            a través de la aplicación. El uso continuado de Cacalendario tras dichos cambios
            implica la aceptación de la política actualizada.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-black mb-1" style={{ color: theme.text }}>{title}</h2>
      <div className="text-sm leading-relaxed" style={{ color: `${theme.text}cc` }}>
        {children}
      </div>
    </div>
  );
}
