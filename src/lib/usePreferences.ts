import { useState, useEffect } from 'react';
import {
  getPreferences,
  getSelectedEmoji,
  getSelectedTheme,
  applyTheme,
  type Preferences,
  type PoopEmoji,
  type Theme,
} from './preferences';

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(getPreferences);
  const [emoji, setEmoji] = useState<PoopEmoji>(getSelectedEmoji);
  const [theme, setTheme] = useState<Theme>(getSelectedTheme);

  useEffect(() => {
    // Apply theme on mount
    applyTheme();

    const handler = () => {
      setPrefs(getPreferences());
      setEmoji(getSelectedEmoji());
      const newTheme = getSelectedTheme();
      setTheme(newTheme);
    };

    window.addEventListener('cacalendario-prefs-changed', handler);
    return () => window.removeEventListener('cacalendario-prefs-changed', handler);
  }, []);

  return { prefs, emoji, theme };
}
