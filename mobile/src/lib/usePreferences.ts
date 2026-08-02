import { useState, useEffect } from 'react';
import {
  getPreferences,
  getSelectedEmoji,
  getSelectedTheme,
  type Preferences,
  type PoopEmoji,
  type Theme,
} from './preferences';
import { onEvent, FLUXIA_PREFS_CHANGED } from './events';

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(getPreferences);
  const [emoji, setEmoji] = useState<PoopEmoji>(getSelectedEmoji);
  const [theme, setTheme] = useState<Theme>(getSelectedTheme);

  useEffect(() => {
    const unsubscribe = onEvent(FLUXIA_PREFS_CHANGED, () => {
      setPrefs(getPreferences());
      setEmoji(getSelectedEmoji());
      setTheme(getSelectedTheme());
    });
    return unsubscribe;
  }, []);

  return { prefs, emoji, theme };
}
