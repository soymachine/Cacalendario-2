import AsyncStorage from '@react-native-async-storage/async-storage';

// Synchronous facade over AsyncStorage: the web app reads localStorage
// synchronously everywhere, so we keep the same API by hydrating a small
// in-memory cache once at startup (behind the splash screen) and persisting
// writes fire-and-forget.

const KNOWN_KEYS = [
  'cacalendario_entries',
  'cacalendario_prefs',
  'cacalendario_doctor_image',
  'cacalendario_hidden_fields',
  'cacalendario_entry_type_mode',
] as const;

const cache = new Map<string, string>();

export async function hydrateLocalStore(): Promise<void> {
  try {
    const pairs = await AsyncStorage.multiGet([...KNOWN_KEYS]);
    for (const [key, value] of pairs) {
      if (value != null) cache.set(key, value);
    }
  } catch (err) {
    console.error('[localStore] hydrate error:', err);
  }
}

export const localStore = {
  getItem(key: string): string | null {
    return cache.has(key) ? cache.get(key)! : null;
  },
  setItem(key: string, value: string): void {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch((err) =>
      console.error('[localStore] setItem error:', err),
    );
  },
  removeItem(key: string): void {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch((err) =>
      console.error('[localStore] removeItem error:', err),
    );
  },
};
