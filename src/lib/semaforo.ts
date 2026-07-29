// Semáforo (traffic-light) status for a patient's days-since-last-entry.
// Shared between the web /medics dashboard and the native doctor app.

export type SemaforoKey = 'green' | 'orange' | 'red' | 'gray';

export interface SemaforoResult {
  color: string;
  key: SemaforoKey;
}

export interface SemaforoOverride {
  enabled: boolean;
  green?: number | null;
  red?: number | null;
}

/** Merges a doctor's global thresholds with an optional per-patient override. */
export function resolveSemaforoThresholds(
  doctorGreen: number,
  doctorRed: number,
  override?: SemaforoOverride,
): { green: number; red: number } {
  if (!override?.enabled) return { green: doctorGreen, red: doctorRed };
  return {
    green: override.green ?? doctorGreen,
    red: override.red ?? doctorRed,
  };
}

export function getSemaforo(daysSinceLast: number | null, green: number, red: number): SemaforoResult {
  if (daysSinceLast === null) return { color: 'var(--fx-ink-300)', key: 'gray' };
  if (daysSinceLast <= green) return { color: 'var(--color-success)', key: 'green' };
  if (daysSinceLast <= red) return { color: 'var(--color-warning)', key: 'orange' };
  return { color: 'var(--color-error)', key: 'red' };
}

export function getSemaforoKey(daysSinceLast: number | null, green: number, red: number): SemaforoKey {
  return getSemaforo(daysSinceLast, green, red).key;
}
