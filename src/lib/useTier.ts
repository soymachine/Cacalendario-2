// Hook to get tier - everything is free/unlimited now
import type { UserTier, TierLimits } from './tiers';
import { getTierLimits } from './tiers';

interface TierState {
  tier: UserTier;
  limits: TierLimits;
  loading: boolean;
}

export function useTier(): TierState {
  return {
    tier: 'free',
    limits: getTierLimits(),
    loading: false,
  };
}
