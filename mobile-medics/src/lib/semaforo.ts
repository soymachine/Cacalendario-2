// Portado de src/lib/semaforo.ts — mantener sincronizado a mano.
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

// Valores hex fijos (no CSS var()) — RN no soporta custom properties de CSS.
export function getSemaforo(daysSinceLast: number | null, green: number, red: number): SemaforoResult {
  if (daysSinceLast === null) return { color: '#B9C2C5', key: 'gray' };
  if (daysSinceLast <= green) return { color: '#3F9E6E', key: 'green' };
  if (daysSinceLast <= red) return { color: '#E09F3C', key: 'orange' };
  return { color: '#D26464', key: 'red' };
}

export function getSemaforoKey(daysSinceLast: number | null, green: number, red: number): SemaforoKey {
  return getSemaforo(daysSinceLast, green, red).key;
}
