import { D } from '../lib/design';

export type Tab = 'calendar' | 'register' | 'account';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

// icono-Estadisticas — 3 pill bars + curved bracket (Figma)
function HistorialIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
      {/* Bar 1 — short (pill shape: rx = half width) */}
      <rect x="0" y="14" width="7" height="10" rx="3.5" fill={color}/>
      {/* Bar 2 — medium */}
      <rect x="9.5" y="7" width="7" height="17" rx="3.5" fill={color}/>
      {/* Bar 3 — tall */}
      <rect x="19" y="0" width="7" height="24" rx="3.5" fill={color}/>
      {/* Curved bracket at bottom-left (Figma detail) */}
      <path
        d="M0 18 C0 22.5 1.5 24 5.5 24 L13 24"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

// icono-Registro — toilet icon (Figma)
function RegisterIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {/* Tank */}
      <rect x="6" y="2" width="14" height="8" rx="3"/>
      {/* Seat rim */}
      <ellipse cx="13" cy="10" rx="9.5" ry="2.8"/>
      {/* Bowl */}
      <path d="M3.5 10 C3.5 10 3 22 13 22 C23 22 22.5 10 22.5 10"/>
      {/* Pedestal */}
      <path d="M9 22 L9 25 Q9 27 13 27 Q17 27 17 25 L17 22"/>
      {/* Foot */}
      <line x1="7.5" y1="27" x2="18.5" y2="27"/>
    </svg>
  );
}

// icono-User — person in rounded square (Figma)
function AccountIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      {/* Rounded square */}
      <rect x="0" y="0" width="26" height="26" rx="8" fill={color}/>
      {/* Head */}
      <circle cx="13" cy="10" r="4.5" fill="white"/>
      {/* Body / shoulders */}
      <path d="M3 26 C3 19.5 23 19.5 23 26 Z" fill="white"/>
    </svg>
  );
}

const TABS: { id: Tab; Icon: (p: { color: string }) => JSX.Element }[] = [
  { id: 'calendar', Icon: HistorialIcon },
  { id: 'register', Icon: RegisterIcon },
  { id: 'account',  Icon: AccountIcon },
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
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
                <Icon color={isActive ? D.text : D.textMuted} />
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
