// Hook to get the current user's tier reactively
import { useState, useEffect } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';
import type { UserTier, TierLimits } from './tiers';
import { getTierLimits } from './tiers';

interface TierState {
  tier: UserTier;
  limits: TierLimits;
  loading: boolean;
}

export function useTier(): TierState {
  const { user } = useAuth();
  const [tier, setTier] = useState<UserTier>(user ? 'free' : 'anon');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTier('anon');
      setLoading(false);
      return;
    }

    // Fetch user profile from Supabase
    const fetchTier = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_profiles')
        .select('tier, premium_until')
        .eq('id', user.id)
        .single();

      if (data) {
        // Check if premium is still valid
        if (data.tier === 'premium') {
          if (data.premium_until) {
            const expiry = new Date(data.premium_until);
            if (expiry > new Date()) {
              setTier('premium');
            } else {
              // Premium expired
              setTier('free');
            }
          } else {
            // Lifetime premium (no expiry)
            setTier('premium');
          }
        } else {
          setTier('free');
        }
      } else {
        // No profile yet, default to free for logged-in users
        setTier('free');
      }
      setLoading(false);
    };

    fetchTier();
  }, [user]);

  return {
    tier,
    limits: getTierLimits(tier),
    loading,
  };
}
