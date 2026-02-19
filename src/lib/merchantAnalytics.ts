import { supabase } from './supabase';
import { getUserId } from '../hooks/useTracking';

export interface MerchantAnalytics {
  id: string;
  merchant_id: string;
  request_id?: string;
  event_type: 'profile_matched' | 'profile_contacted' | 'product_liked' | 'product_unliked';
  user_id: string;
  created_at: string;
}

export interface ProductLikeInfo {
  likeCount: number;
  isLiked: boolean;
}

export interface MerchantStats {
  total_matches: number;
  total_contacts: number;
  match_to_contact_ratio: number;
  recent_matches: number;
  recent_contacts: number;
}

/**
 * Track when a merchant profile is matched to a user request
 */
export async function trackMerchantMatch(
  merchantId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId();

    const { error } = await supabase
      .from('merchant_analytics')
      .insert({
        merchant_id: merchantId,
        request_id: requestId,
        event_type: 'profile_matched',
        user_id: userId
      });

    if (error) {
      console.error('Error tracking merchant match:', error);
      return { success: false, error: error.message };
    }

    // Update the last_matched_at for the merchant
    const { error: updateError } = await supabase
      .from('merchants')
      .update({ last_matched_at: new Date().toISOString() })
      .eq('id', merchantId);

    if (updateError) {
      console.error('Error updating merchant last_matched_at:', updateError);
      // This is a non-critical error, so we still return success for the match tracking
    }
    return { success: true };
  } catch (error) {
    console.error('Error tracking merchant match:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Track when a merchant profile is contacted by a user
 */
export async function trackMerchantContact(
  merchantId: string,
  requestId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId();

    // Check if this contact has already been tracked for this specific request
    const { data: existingContact } = await supabase
      .from('merchant_analytics')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('request_id', requestId || null)
      .eq('event_type', 'profile_contacted')
      .eq('user_id', userId)
      .limit(1);

    // Only track if this is the first contact for this specific request
    if (!existingContact || existingContact.length === 0) {
      const { error } = await supabase
        .from('merchant_analytics')
        .insert({
          merchant_id: merchantId,
          request_id: requestId,
          event_type: 'profile_contacted',
          user_id: userId
        });

      if (error) {
        console.error('Error tracking merchant contact:', error);
        return { success: false, error: error.message };
      }
    } else {
      console.log('Contact analytics already tracked for this request, skipping duplicate');
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking merchant contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get analytics stats for a merchant
 */
export async function getMerchantStats(merchantId: string): Promise<MerchantStats> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('merchant_analytics')
      .select('event_type, created_at')
      .eq('merchant_id', merchantId);

    if (error) {
      console.error('Error fetching merchant stats:', error);
      return {
        total_matches: 0,
        total_contacts: 0,
        match_to_contact_ratio: 0,
        recent_matches: 0,
        recent_contacts: 0
      };
    }

    const analytics = data || [];

    const totalMatches = analytics.filter(a => a.event_type === 'profile_matched').length;
    const totalContacts = analytics.filter(a => a.event_type === 'profile_contacted').length;

    const recentAnalytics = analytics.filter(a =>
      new Date(a.created_at) >= thirtyDaysAgo
    );

    const recentMatches = recentAnalytics.filter(a => a.event_type === 'profile_matched').length;
    const recentContacts = recentAnalytics.filter(a => a.event_type === 'profile_contacted').length;

    const matchToContactRatio = totalMatches > 0 ? (totalContacts / totalMatches) * 100 : 0;

    return {
      total_matches: totalMatches,
      total_contacts: totalContacts,
      match_to_contact_ratio: Math.round(matchToContactRatio * 100) / 100,
      recent_matches: recentMatches,
      recent_contacts: recentContacts
    };
  } catch (error) {
    console.error('Error calculating merchant stats:', error);
    return {
      total_matches: 0,
      total_contacts: 0,
      match_to_contact_ratio: 0,
      recent_matches: 0,
      recent_contacts: 0
    };
  }
}

/**
 * Get all merchants with their analytics stats
 */
export async function getAllMerchantsWithStats(): Promise<Array<{
  merchant: any;
  stats: MerchantStats;
}>> {
  try {
    const { data: merchants, error } = await supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching merchants:', error);
      return [];
    }

    const merchantsWithStats = await Promise.all(
      (merchants || []).map(async (merchant) => {
        const stats = await getMerchantStats(merchant.id);
        return { merchant, stats };
      })
    );

    return merchantsWithStats;
  } catch (error) {
    console.error('Error fetching merchants with stats:', error);
    return [];
  }
}

/**
 * Toggle a like for a product
 */
export async function toggleProductLike(
  productId: string,
  merchantId: string | null
): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
  try {
    const actualUserId = typeof window !== 'undefined' ? window.localStorage.getItem('unistore_actual_user_id') : null;

    // Check if liked in user_analytics
    const { data: existingLike } = await supabase
      .from('user_analytics')
      .select('id')
      .eq('event_type', 'product_liked')
      .eq('actual_user_id', actualUserId)
      .filter('event_details->>product_id', 'eq', productId)
      .maybeSingle();

    if (existingLike) {
      // Unlike by deleting the record
      const { error } = await supabase
        .from('user_analytics')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return { success: true, isLiked: false };
    } else {
      // Like by inserting into user_analytics
      const { error } = await supabase
        .from('user_analytics')
        .insert({
          actual_user_id: actualUserId,
          event_type: 'product_liked',
          event_description: `Liked product ${productId}`,
          event_details: {
            product_id: productId,
            merchant_id: merchantId,
            timestamp: new Date().toISOString()
          },
          current_page_url: typeof window !== 'undefined' ? window.location.href : ''
        });

      if (error) throw error;
      return { success: true, isLiked: true };
    }
  } catch (error) {
    console.error('Error toggling product like:', error);
    return {
      success: false,
      isLiked: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get like count and liked status for a product
 */
export async function getProductLikeInfo(productId: string): Promise<ProductLikeInfo> {
  try {
    const actualUserId = typeof window !== 'undefined' ? window.localStorage.getItem('unistore_actual_user_id') : null;

    // Get total count from user_analytics
    const { count: likeCount, error: countError } = await supabase
      .from('user_analytics')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'product_liked')
      .filter('event_details->>product_id', 'eq', productId);

    if (countError) throw countError;

    let isLiked = false;
    if (actualUserId) {
      const { data } = await supabase
        .from('user_analytics')
        .select('id')
        .eq('event_type', 'product_liked')
        .eq('actual_user_id', actualUserId)
        .filter('event_details->>product_id', 'eq', productId)
        .maybeSingle();
      isLiked = !!data;
    }

    return {
      likeCount: likeCount || 0,
      isLiked
    };
  } catch (error) {
    console.error('Error getting product like info:', error);
    return { likeCount: 0, isLiked: false };
  }
}