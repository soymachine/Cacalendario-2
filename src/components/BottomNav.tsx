import { D } from '../lib/design';

export type Tab = 'calendar' | 'register' | 'account';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer rounded rect */}
      <rect x="3" y="5" width="18" height="16" rx="3"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        opacity={active ? 0.15 : 1}
      />
      <rect x="3" y="5" width="18" height="16" rx="3"
        fill="none"
        stroke={active ? 'currentColor' : 'none'}
        strokeWidth="2"
      />
      {/* Top bar */}
      <rect x="3" y="5" width="18" height="5" rx="2"
        fill={active ? 'currentColor' : 'none'}
        stroke="none"
      />
      {/* Calendar pins */}
      <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Grid dots */}
      <circle cx="8" cy="14" r="1.2" fill="currentColor" opacity={active ? 1 : 0.6}/>
      <circle cx="12" cy="14" r="1.2" fill="currentColor" opacity={active ? 1 : 0.6}/>
      <circle cx="16" cy="14" r="1.2" fill="currentColor" opacity={active ? 1 : 0.6}/>
      <circle cx="8" cy="18" r="1.2" fill="currentColor" opacity={active ? 1 : 0.4}/>
      <circle cx="12" cy="18" r="1.2" fill="currentColor" opacity={active ? 1 : 0.4}/>
    </svg>
  );
}

function RegisterIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Droplet shape */}
      <path
        d="M12 3 C12 3 5 10.5 5 15 A7 7 0 0 0 19 15 C19 10.5 12 3 12 3Z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        strokeLinejoin="round"
        opacity={active ? 0.2 : 1}
      />
      <path
        d="M12 3 C12 3 5 10.5 5 15 A7 7 0 0 0 19 15 C19 10.5 12 3 12 3Z"
        fill="none"
        stroke={active ? 'currentColor' : 'none'}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Plus inside the drop */}
      <line x1="12" y1="11" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8.5" y1="14.5" x2="15.5" y2="14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle
        cx="12" cy="8" r="4"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        opacity={active ? 0.9 : 1}
      />
      {/* Body / shoulders */}
      <path
        d="M4 20 C4 16 7.6 13 12 13 C16.4 13 20 16 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TABS: { id: Tab; label: string; Icon: (p: { active: boolean }) => JSX.Element }[] = [
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
              position: 'relative',
            }}
          >
            <Icon active={isActive} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: 0.2 }}>
              {label}
            </span>
            {isActive && (
              <span style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 28, height: 3, borderRadius: '0 0 4px 4px',
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
