import { D } from '../lib/design';

export type Tab = 'calendar' | 'register' | 'account';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
    </svg>
  );
}

function RegisterIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

const TABS: { id: Tab; label: string; Icon: () => JSX.Element }[] = [
  { id: 'calendar', label: 'Historial', Icon: CalendarIcon },
  { id: 'register', label: 'Registrar', Icon: RegisterIcon },
  { id: 'account', label: 'Cuenta', Icon: AccountIcon },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'stretch',
      backgroundColor: D.card,
      borderTop: `1px solid ${D.border}`,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      flexShrink: 0,
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, padding: '10px 0 12px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? D.primary : D.textMuted,
              transition: 'color 0.15s',
            }}
          >
            <Icon />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: 0.2 }}>
              {label}
            </span>
            {isActive && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                width: 4, height: 4, borderRadius: '50%',
                backgroundColor: D.primary,
                display: 'block',
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
