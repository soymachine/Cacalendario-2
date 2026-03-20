// Tier system: defines limits and features per user tier
// Tiers: 'anon' (no account), 'free' (registered), 'premium' (paid)

export type UserTier = 'anon' | 'free' | 'premium';

export interface TierLimits {
  maxEntries: number;          // total entries allowed (Infinity = unlimited)
  maxEntriesPerDay: number;    // entries per day
  maxNoteLength: number;       // characters in notes field
  bristolFull: boolean;        // all 7 Bristol types (false = only 3-5)
  floatsField: boolean;        // can use "floats?" field
  canDeleteEntries: boolean;   // can delete entries
  statsHistoryDays: number;    // days of stats history (Infinity = all)
  canExportData: boolean;      // can export CSV/JSON
  freeEmojis: number;          // number of emoji options
  freeThemes: number;          // number of theme options
  syncEnabled: boolean;        // cloud sync between devices
  adFree: boolean;             // no ads
  premiumBadge: boolean;       // supporter badge
}

const TIER_LIMITS: Record<UserTier, TierLimits> = {
  anon: {
    maxEntries: 5,
    maxEntriesPerDay: 1,
    maxNoteLength: 0,
    bristolFull: false,
    floatsField: false,
    canDeleteEntries: false,
    statsHistoryDays: 0,
    canExportData: false,
    freeEmojis: 1,
    freeThemes: 1,
    syncEnabled: false,
    adFree: false,
    premiumBadge: false,
  },
  free: {
    maxEntries: Infinity,
    maxEntriesPerDay: 3,
    maxNoteLength: 50,
    bristolFull: true,
    floatsField: true,
    canDeleteEntries: true,
    statsHistoryDays: 30,
    canExportData: false,
    freeEmojis: 3,
    freeThemes: 2,
    syncEnabled: true,
    adFree: false,
    premiumBadge: false,
  },
  premium: {
    maxEntries: Infinity,
    maxEntriesPerDay: Infinity,
    maxNoteLength: Infinity,
    bristolFull: true,
    floatsField: true,
    canDeleteEntries: true,
    statsHistoryDays: Infinity,
    canExportData: true,
    freeEmojis: Infinity,
    freeThemes: Infinity,
    syncEnabled: true,
    adFree: true,
    premiumBadge: true,
  },
};

export function getTierLimits(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier];
}

// Helper: check if a feature is available
export function canUseFeature(tier: UserTier, feature: keyof TierLimits): boolean {
  const limits = TIER_LIMITS[tier];
  const val = limits[feature];
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  return false;
}

// Helper: get upgrade message based on current tier
export function getUpgradeMessage(tier: UserTier): { title: string; cta: string; target: 'register' | 'premium' } {
  if (tier === 'anon') {
    return {
      title: '¡Regístrate gratis para seguir registrando!',
      cta: 'Crear cuenta gratis',
      target: 'register',
    };
  }
  return {
    title: '¡Desbloquea todo con Premium! ⭐',
    cta: 'Hazte Premium',
    target: 'premium',
  };
}
