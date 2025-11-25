// P4BA9: Advertisement Placement Manager
// Manages ad placement logic and selection

import { createClient } from '@/lib/supabase/server';

export type AdPlacement = 'main' | 'sidebar' | 'post_top' | 'post_bottom';

export interface Advertisement {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  placement: AdPlacement;
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get active advertisements for a specific placement
 * Only returns ads within valid date range and is_active = true
 */
export async function getActiveAdsForPlacement(
  placement: AdPlacement
): Promise<Advertisement[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('placement', placement)
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getActiveAdsForPlacement] Error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a random active ad for a specific placement
 * This can be used for rotating ads
 */
export async function getRandomAdForPlacement(
  placement: AdPlacement
): Promise<Advertisement | null> {
  const ads = await getActiveAdsForPlacement(placement);

  if (ads.length === 0) {
    return null;
  }

  // Simple random selection
  const randomIndex = Math.floor(Math.random() * ads.length);
  return ads[randomIndex];
}

/**
 * Record an impression for an advertisement
 */
export async function recordAdImpression(adId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_ad_impressions', {
    ad_id: adId,
  });

  if (error) {
    console.error('[recordAdImpression] Error:', error);
  }
}

/**
 * Record a click for an advertisement
 */
export async function recordAdClick(adId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_ad_clicks', {
    ad_id: adId,
  });

  if (error) {
    console.error('[recordAdClick] Error:', error);
  }
}

/**
 * Get click-through rate (CTR) for an advertisement
 */
export function calculateCTR(ad: Advertisement): number {
  if (ad.impressions === 0) {
    return 0;
  }
  return (ad.clicks / ad.impressions) * 100;
}

/**
 * Check if advertisement is currently active
 */
export function isAdActive(ad: Advertisement): boolean {
  if (!ad.is_active) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(ad.start_date);
  const endDate = new Date(ad.end_date);

  return now >= startDate && now <= endDate;
}

/**
 * Validate ad placement value
 */
export function isValidPlacement(placement: string): placement is AdPlacement {
  return ['main', 'sidebar', 'post_top', 'post_bottom'].includes(placement);
}
