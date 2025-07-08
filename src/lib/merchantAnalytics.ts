import { supabase } from './supabase';
import { getUserId } from '../hooks/useTracking';

export interface MerchantAnalytics {
  id: string;
  merchant_id: string;
  request_id?: string;
  event_type: 'profile_matched' | 'profile_contacted';
  user_id: string;
  created_at: string;
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