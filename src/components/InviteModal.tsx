import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
      window.dispatchEvent(new Event('fluxia-updated'));
      setInvites((prev) => prev.slice(1));
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div style={{
        maxWidth: 360, width: '100%', textAlign: 'center',
        backgroundColor: D.card, borderRadius: 24, padding: '32px 24px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      }}>
        <p style={{ fontSize: 19, fontWeight: 700, color: D.text, marginBottom: 12 }}>
          ¡Enhorabuena, ya estás vinculado con tu sanitario preescritor!
        </p>
        <p style={{ fontSize: 15, color: D.textMuted, marginBottom: 28, lineHeight: 1.5 }}>
          A partir de ahora tus registros en la app se compartirán con{' '}
          <strong style={{ color: D.text }}>{invite.doctor_name}</strong>
          {invite.center_name ? ` (${invite.center_name})` : ''}.
        </p>
        <button
          onClick={handleAccept}
          disabled={accepting}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 99,
            backgroundColor: D.primary, color: D.primaryText, border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: accepting ? 0.6 : 1,
          }}
        >
          {accepting ? '...' : 'Aceptar'}
        </button>
      </div>
    </div>
  );
}
