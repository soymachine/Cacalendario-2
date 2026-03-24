// Tier system: all features unlocked (app is completely free)

export type UserTier = 'free';

export interface TierLimits {
  maxEntries: number;
  maxEntriesPerDay: number;
  maxNoteLength: number;
  bristolFull: boolean;
  floatsField: boolean;
  canDeleteEntries: boolean;
  statsHistoryDays: number;
  canExportData: boolean;
  syncEnabled: boolean;
}

const UNLIMITED: TierLimits = {
  maxEntries: Infinity,
  maxEntriesPerDay: Infinity,
  maxNoteLength: Infinity,
  bristolFull: true,
  floatsField: true,
  canDeleteEntries: true,
  statsHistoryDays: Infinity,
  canExportData: true,
  syncEnabled: true,
};

export function getTierLimits(_tier?: UserTier): TierLimits {
  return UNLIMITED;
}
