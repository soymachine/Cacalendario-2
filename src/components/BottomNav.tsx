import { D } from '../lib/design';

export type Tab = 'calendar' | 'register' | 'account';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

// Bar chart icon — Historial
function HistorialIcon() {
  return (
    <svg width="24" height="21" viewBox="0 0 24 21" fill="currentColor">
      <rect x="0" y="12" width="6.5" height="9" rx="2"/>
      <rect x="8.75" y="6" width="6.5" height="15" rx="2"/>
      <rect x="17.5" y="0" width="6.5" height="21" rx="2"/>
      <rect x="0" y="19.5" width="24" height="1.5" rx="0.75" opacity="0.4"/>
    </svg>
  );
}

// Toilet icon — Registrar
function RegisterIcon() {
  return (
    <svg width="24" height="27" viewBox="0 0 24 27" fill="none"
      stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      {/* Tank */}
      <path d="M7.5 2H16.5C17.6 2 18.5 2.9 18.5 4V9.5H5.5V4C5.5 2.9 6.4 2 7.5 2Z"/>
      {/* Seat ellipse */}
      <ellipse cx="12" cy="9.5" rx="8.5" ry="2.5"/>
      {/* Bowl */}
      <path d="M3.5 9.5H20.5C20.5 9.5 21.5 18.5 12 18.5C2.5 18.5 3.5 9.5 3.5 9.5Z"/>
      {/* Base */}
      <path d="M8 18.5H16C16 18.5 16 21.5 14.5 21.5H9.5C8 21.5 8 18.5 8 18.5Z" strokeLinejoin="round"/>
      {/* Foot */}
      <path d="M7.5 21.5H16.5" strokeLinecap="round"/>
    </svg>
  );
}

// Person in squircle — Cuenta
function AccountIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      {/* Squircle background */}
      <rect x="0" y="0" width="24" height="24" rx="7.5" fill="currentColor"/>
      {/* Head */}
      <circle cx="12" cy="9.5" r="4" fill="white"/>
      {/* Body */}
      <path d="M2.5 24C2.5 18 21.5 18 21.5 24H2.5Z" fill="white"/>
    </svg>
  );
}

const TABS: { id: Tab; Icon: () => JSX.Element }[] = [
  { id: 'calendar', Icon: HistorialIcon },
  { id: 'register', Icon: RegisterIcon },
  { id: 'account', Icon: AccountIcon },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav style={{
      flexShrink: 0,
      backgroundColor: D.bg,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '6px 14px 8px',
        backgroundColor: D.chip,
        borderRadius: 999,
        overflow: 'hidden',
      }}>
        {TABS.map(({ id, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                backgroundColor: isActive ? D.card : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                color: isActive ? D.text : D.textMuted,
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
                <Icon />
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
