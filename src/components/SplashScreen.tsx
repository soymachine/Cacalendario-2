import { useState, useEffect } from 'react';
import { asset } from '../lib/config';
import { D } from '../lib/design';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'show' | 'animate' | 'done'>('show');

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('animate'), 1400);
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
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        backgroundColor: D.bg,
        transition: 'opacity 700ms ease-in-out',
        opacity: phase === 'animate' ? 0 : 1,
      }}
    >
      <img
        src={asset('/fluxia-logo.png')}
        alt="Fluxia"
        style={{ width: 180, objectFit: 'contain' }}
      />
    </div>
  );
}
