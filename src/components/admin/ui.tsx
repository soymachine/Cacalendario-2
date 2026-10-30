// Piezas comunes del panel de admin (cabecera de sección, tarjetas de cifra,
// estilos). Las usan AdminPanel.tsx y las secciones de admin/.
import type React from 'react';

// ── Section Header ──
export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0' }}>{subtitle}</p>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

// ── Stat Card ──
export function StatCard({ emoji, label, value, sub, dark }: {
  emoji: string; label: string; value: string; sub?: string; dark?: boolean;
}) {
  return (
    <div style={{
      backgroundColor: dark ? '#000' : '#fff',
      borderRadius: 16,
      padding: 20,
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <span style={{ fontSize: 11, fontWeight: 900, color: dark ? '#ffffff66' : '#00000066', letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <span style={{ fontSize: 32, fontWeight: 900, color: dark ? '#fff' : '#000' }}>{value}</span>
      {sub && <span style={{ fontSize: 13, color: dark ? '#ffffff66' : '#00000066' }}>{sub}</span>}
    </div>
  );
}

// ── Styles ──
export const s: Record<string, React.CSSProperties> = {
  loginContainer: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(105deg, #3E78B5 0%, #539D9F 36%, #78AD89 62%, #D8DA56 100%)', fontFamily: 'Inter, system-ui, sans-serif',
  },
  loginCard: {
    width: '100%', maxWidth: 380, padding: 32, backgroundColor: 'white',
    borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#555',
  },
  input: {
    width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e0e0e0',
    marginBottom: 16, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    width: '100%', padding: 14, borderRadius: 24, backgroundColor: '#274867',
    color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  shell: {
    display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif',
  },
  sidebar: {
    width: 260, backgroundColor: '#1F3A53', display: 'flex', flexDirection: 'column' as const,
    position: 'fixed' as const, top: 0, left: 0, bottom: 0, zIndex: 10,
    overflowY: 'auto' as const,
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', minHeight: 100,
    borderBottom: '1px solid #2A547D',
  },
  sidebarNav: {
    padding: '12px 12px 8px', display: 'flex', flexDirection: 'column' as const, gap: 2,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', height: 40,
    borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent',
    textAlign: 'left' as const, width: '100%',
  },
  main: {
    flex: 1, marginLeft: 260, backgroundColor: '#EEF4FB', padding: 32,
    minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, gap: 24,
  },
  statsRow: {
    display: 'flex', gap: 16,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
  },
  headerBtn: {
    padding: '8px 16px', borderRadius: 999, border: 'none',
    backgroundColor: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  linkBtn: {
    background: 'none', border: 'none', color: '#3C7DB8', fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  filterTab: {
    padding: '8px 18px', borderRadius: 999, border: 'none',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
};
