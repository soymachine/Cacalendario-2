import { useState, useEffect } from 'react';
import { asset } from '../lib/config';
import { D } from '../lib/design';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'show' | 'animate' | 'done'>('show');

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('animate'), 1200);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onDone();
    }, 2200);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  if (phase === 'done') return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'center',
        backgroundColor: D.bg,
      }}
    >
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', position: 'relative' }}>
        {/* Logo - animates from center to top */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            transition: 'transform 800ms ease-in-out',
            transform: phase === 'animate' ? 'translateY(-42vh) scale(0.7)' : 'translateY(0) scale(1)',
          }}
        >
          <img src={asset('/fluxia-mark.svg')} alt="Fluxia" style={{ width: 96, height: 96 }} />
        </div>

        {/* Text - fades out */}
        <p
          style={{
            fontSize: 30, fontWeight: 900, marginTop: 16, letterSpacing: -0.5,
            color: D.text,
            transition: 'opacity 600ms ease-in-out',
            opacity: phase === 'animate' ? 0 : 1,
          }}
        >
          fluxia
        </p>
      </div>
    </div>
  );
}
