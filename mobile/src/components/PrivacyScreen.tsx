import type { ReactNode } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { D } from '../lib/design';
import { CloseIcon } from './icons';
import LogoIcon from '../assets/poop-small.svg';

interface PrivacyScreenProps {
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionBody}>{'  •  '}{children}</Text>;
}

function B({ children }: { children: ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}

export default function PrivacyScreen({ onClose }: PrivacyScreenProps) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header: logo + close */}
          <View style={styles.header}>
            <LogoIcon width={64} height={57} />
            <Pressable onPress={onClose} style={styles.closeButton}>
              <CloseIcon size={24} />
            </Pressable>
          </View>

          <Text style={styles.title}>POLÍTICA DE PRIVACIDAD</Text>
          <Text style={styles.updated}>Última actualización: 17 de marzo de 2026</Text>

          <Section title="1. Responsable del tratamiento">
            El responsable del tratamiento de tus datos es el desarrollador de Fluxia.
            Puedes contactarnos en: <B>hola@fluxia-health.com</B>
          </Section>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Qué datos recogemos</Text>
            <Bullet><B>Email y contraseña</B> — solo si creas una cuenta (opcional).</Bullet>
            <Bullet><B>Registros de deposiciones</B> — fecha, hora, notas, escala de Bristol y si flota.</Bullet>
            <Bullet><B>Preferencias</B> — emoji y tema visual seleccionados.</Bullet>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Para qué usamos tus datos</Text>
            <Bullet>Proporcionarte el servicio de seguimiento personal de salud digestiva.</Bullet>
            <Bullet>Sincronizar tus datos entre dispositivos (solo si creas cuenta).</Bullet>
            <Bullet>Generar estadísticas personales visibles únicamente por ti.</Bullet>
            <Text style={[styles.sectionBody, styles.spacedTop]}>
              <B>No vendemos, compartimos ni cedemos tus datos a terceros.</B>
            </Text>
          </View>

          <Section title="4. Datos de salud (categoría especial)">
            Los registros de deposiciones y la escala de Bristol se consideran <B>datos relativos a la salud</B> según
            el artículo 9 del RGPD. El tratamiento se basa en tu <B>consentimiento explícito</B> (Art. 9.2.a RGPD),
            que nos proporcionas al crear una cuenta y aceptar esta política.
          </Section>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Dónde se almacenan tus datos</Text>
            <Bullet><B>Sin cuenta:</B> tus datos se almacenan exclusivamente en tu dispositivo. No tenemos acceso a ellos.</Bullet>
            <Bullet><B>Con cuenta:</B> tus datos se sincronizan con Supabase (infraestructura en AWS, región EU). La contraseña se almacena hasheada con bcrypt.</Bullet>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Tus derechos</Text>
            <Text style={styles.sectionBody}>Según el RGPD y la LOPDGDD, tienes derecho a:</Text>
            <Bullet><B>Acceso:</B> ver todos tus datos almacenados.</Bullet>
            <Bullet><B>Rectificación:</B> modificar tus registros en cualquier momento.</Bullet>
            <Bullet><B>Supresión:</B> eliminar tu cuenta y todos tus datos ("derecho al olvido").</Bullet>
            <Bullet><B>Portabilidad:</B> exportar tus datos en formato JSON.</Bullet>
            <Bullet><B>Oposición:</B> dejar de usar el servicio en cualquier momento.</Bullet>
            <Text style={[styles.sectionBody, styles.spacedTop]}>
              Puedes ejercer estos derechos desde la sección "Mi Cuenta" de la app, o contactándonos
              en <B>hola@fluxia-health.com</B>.
            </Text>
          </View>

          <Section title="7. Retención de datos">
            Conservamos tus datos mientras mantengas tu cuenta activa. Si eliminas tu cuenta,
            todos tus datos se borran de forma permanente e irreversible de nuestros servidores.
          </Section>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Seguridad</Text>
            <Bullet>Comunicaciones cifradas con HTTPS/TLS.</Bullet>
            <Bullet>Contraseñas hasheadas con bcrypt (nunca en texto plano).</Bullet>
            <Bullet>Row Level Security (RLS) en base de datos: cada usuario solo accede a sus datos.</Bullet>
            <Bullet>Autenticación segura mediante tokens JWT.</Bullet>
          </View>

          <Section title="9. Cookies y tracking">
            Fluxia <B>no utiliza cookies de terceros ni herramientas de tracking</B>.
            Solo almacenamos datos funcionales en tu dispositivo para el funcionamiento de la app.
          </Section>

          <Section title="10. Cambios en esta política">
            Si realizamos cambios significativos en esta política, te notificaremos
            a través de la aplicación. El uso continuado de Fluxia tras dichos cambios
            implica la aceptación de la política actualizada.
          </Section>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: D.bg,
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 0,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: D.text,
    marginBottom: 16,
  },
  updated: {
    fontSize: 12,
    color: D.textMuted,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: D.text,
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: D.textMuted,
  },
  bold: {
    fontWeight: '700',
    color: D.text,
  },
  spacedTop: {
    marginTop: 8,
  },
});
