import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { supabase } from '../lib/supabase';
import { emitEvent, FLUXIA_UPDATED } from '../lib/events';
import { D } from '../lib/design';

interface PendingInvite {
  id: string;
  doctor_name: string;
  center_name: string;
  invited_at: string;
}

interface InviteModalProps {
  userId: string;
}

export default function InviteModal({ userId }: InviteModalProps) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    supabase.rpc('patient_get_pending_invites').then(({ data }) => {
      if (Array.isArray(data)) setInvites(data);
    });
  }, [userId]);

  if (invites.length === 0) return null;
  const invite = invites[0];

  const handleAccept = async () => {
    setAccepting(true);
    const { data } = await supabase.rpc('patient_respond_to_invite', { p_link_id: invite.id, p_accept: true });
    setAccepting(false);
    if (data?.success) {
      emitEvent(FLUXIA_UPDATED);
      setInvites((prev) => prev.slice(1));
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            ¡Enhorabuena, ya estás vinculado con tu sanitario prescriptor!
          </Text>
          <Text style={styles.body}>
            A partir de ahora tus registros en la app se compartirán con{' '}
            <Text style={styles.bold}>{invite.doctor_name}</Text>
            {invite.center_name ? ` (${invite.center_name})` : ''}.
          </Text>
          <Pressable onPress={handleAccept} disabled={accepting} style={[styles.button, accepting && styles.disabled]}>
            <Text style={styles.buttonText}>{accepting ? '...' : 'Aceptar'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  card: {
    maxWidth: 360,
    width: '100%',
    backgroundColor: D.card,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: D.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: D.textMuted,
    marginBottom: 28,
    lineHeight: 22,
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
    color: D.text,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 99,
    backgroundColor: D.primary,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: D.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
});
