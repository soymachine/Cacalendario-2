// Tiny event bus replacing the web app's window.dispatchEvent/addEventListener
// ('fluxia-updated' and 'fluxia-prefs-changed' custom events).

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export const FLUXIA_UPDATED = 'fluxia-updated';
export const FLUXIA_PREFS_CHANGED = 'fluxia-prefs-changed';

export function onEvent(event: string, cb: Listener): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(cb);
  return () => set!.delete(cb);
}

export function emitEvent(event: string): void {
  const set = listeners.get(event);
  if (!set) return;
  for (const cb of [...set]) cb();
}
