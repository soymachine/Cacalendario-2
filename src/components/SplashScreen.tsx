import { useState, useEffect } from 'react';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const { theme } = usePreferences();
  const [phase, setPhase] = useState<'show' | 'animate' | 'done'>('show');

  useEffect(() => {
    // Show splash for 1.2s, then animate for 0.8s
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
      className="fixed inset-0 z-[100] flex justify-center"
      style={{ backgroundColor: theme.main }}
    >
      <div className="w-full max-w-md flex flex-col items-center justify-center h-screen relative">
        {/* Logo - animates from center to top */}
        <div
          className="flex flex-col items-center transition-all ease-in-out"
          style={{
            transitionDuration: '800ms',
            transform: phase === 'animate' ? 'translateY(-42vh) scale(0.7)' : 'translateY(0) scale(1)',
          }}
        >
          <img
            src={asset('/logo.svg')}
            alt="Cacalendario"
            className="w-28 h-[100px]"
          />
        </div>

        {/* Text - fades out */}
        <p
          className="text-3xl font-black mt-4 tracking-tight transition-opacity ease-in-out"
          style={{
            color: theme.text,
            transitionDuration: '600ms',
            opacity: phase === 'animate' ? 0 : 1,
          }}
        >
          cacalendario
        </p>
      </div>
    </div>
  );
}
