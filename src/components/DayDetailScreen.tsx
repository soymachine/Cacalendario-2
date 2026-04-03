import { useState, useEffect } from 'react';
import { formatDateForDisplay } from '../lib/dates';
import { getEntriesForDate, type PoopEntry } from '../lib/storage';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getBristolType, getBristolHealthLabel, getBristolHealthColor } from '../lib/bristol';

interface DayDetailScreenProps {
  date: string;
  onClose: () => void;
  onAddEntry: (date: string) => void;
  onEditEntry: (entry: PoopEntry) => void;
}

export default function DayDetailScreen({ date, onClose, onAddEntry, onEditEntry }: DayDetailScreenProps) {
  const { emoji, theme } = usePreferences();
  const [entries, setEntries] = useState<PoopEntry[]>([]);

  const refresh = () => setEntries(getEntriesForDate(date));

  useEffect(() => {
    refresh();
    window.addEventListener('cacalendario-updated', refresh);
    return () => window.removeEventListener('cacalendario-updated', refresh);
  }, [date]);

  const dayText = formatDateForDisplay(date);
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  return (
    <div className="fixed inset-0 z-50 flex justify-center" style={{ backgroundColor: theme.main }}>
      <div className="w-full max-w-md flex flex-col h-screen relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill={theme.text} />
            <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center pt-12 pb-3 shrink-0">
          <img src={asset('/logo.svg')} alt="Cacalendario" className="w-14 h-[50px]" />
        </div>

        {/* Day header */}
        <div className="px-8 shrink-0">
          <p className="text-sm font-black" style={{ color: theme.text }}>DÍA</p>
          <p className="text-xl mt-0.5" style={{ color: theme.text }}>{dayText}</p>
          <p className="text-sm mt-1" style={{ color: `${theme.text}80` }}>
            {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>

        {/* Entries list */}
        <div className="flex-1 min-h-0 overflow-auto px-8 mt-4 pb-4">
          <div className="space-y-3">
            {entries.map((entry) => {
              const bristolType = getBristolType(entry.bristol);
              return (
                <button
                  key={entry.id}
                  onClick={() => onEditEntry(entry)}
                  className="w-full rounded-xl p-4 text-left active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: theme.glass }}
                >
                  <div className="flex items-start gap-3">
                    {/* Emoji */}
                    <div className="shrink-0 mt-0.5">
                      {emoji.char === 'svg' ? (
                        <img src={asset('/poop-small.svg')} alt="poop" className="w-8 h-8" />
                      ) : (
                        <span className="text-2xl">{emoji.char}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black" style={{ color: theme.text }}>
                          {entry.time}
                        </span>
                        {bristolType && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: getBristolHealthColor(entry.bristol!),
                              color: 'white',
                            }}
                          >
                            {bristolType.emoji} Tipo {entry.bristol}
                          </span>
                        )}
                        {entry.floats === true && (
                          <span className="text-xs">🫧</span>
                        )}
                      </div>

                      {entry.notes && (
                        <p
                          className="text-xs mt-1 truncate"
                          style={{ color: `${theme.text}99` }}
                        >
                          {entry.notes}
                        </p>
                      )}
                    </div>

                    {/* Edit arrow */}
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="shrink-0 mt-1.5">
                      <path d="M1 1L7 7L1 13" stroke={`${theme.text}60`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add another entry button */}
        <div className="shrink-0 flex justify-center px-8 py-4">
          <button
            onClick={() => onAddEntry(date)}
            className="w-full max-w-sm rounded-full py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ backgroundColor: theme.text }}
          >
            <span className="text-lg" style={{ color: invertColor }}>+ añadir registro</span>
            {emoji.char === 'svg' ? (
              <img src={asset('/poop-button.svg')} alt="" className="w-7 h-7" />
            ) : (
              <span className="text-xl">{emoji.char}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
