import { supabase } from './supabase';
import { getUserId, isAuthenticated } from '../hooks/useTracking';
import { trackMerchantContact } from './merchantAnalytics';

export interface RatingData {
  rating: number;
  review_text?: string;
}

export interface RatingResult {
  success: boolean;
  error?: string;
}

/**
 * Track when a user contacts a merchant via WhatsApp
 */
export async function trackContactInteraction(
  merchantId: string,
  requestId?: string
): Promise<RatingResult> {
  try {
    const userId = await getUserId();
    
    // Check if this user has already contacted this merchant for this specific request
    const { data: existingContact } = await supabase
      .from('contact_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('merchant_id', merchantId)
      .eq('request_id', requestId || null)
      .limit(1);

    // Only track if this is the first contact for this specific request
    if (!existingContact || existingContact.length === 0) {
      // Track in contact_interactions table
      const { error: contactError } = await supabase
        .from('contact_interactions')
        .insert({
          user_id: userId,
          merchant_id: merchantId,
          request_id: requestId,
          contacted_at: new Date().toISOString()
        });

      if (contactError) {
        console.error('Error tracking contact interaction:', contactError);
        return { success: false, error: contactError.message };
      }

      // Track in merchant analytics - this will create a new entry for each unique contact
      await trackMerchantContact(merchantId, requestId);
    } else {
      console.log('Contact already tracked for this request, skipping duplicate tracking');
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking contact interaction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if user has contacted a merchant for a specific request
 */
export async function hasUserContactedMerchant(
  merchantId: string,
  requestId?: string
): Promise<boolean> {
  try {
    const userId = await getUserId();
    
    const { data, error } = await supabase
      .from('contact_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('merchant_id', merchantId)
      .eq('request_id', requestId || null)
      .limit(1);

    if (error) {
      console.error('Error checking contact interaction:', error);
      return false;
    }

    return !!(data && data.length > 0);
  } catch (error) {
    console.error('Error checking contact interaction:', error);
    return false;
  }
}

/**
 * Submit a rating for a merchant (only allowed if user has contacted them)
 */
export async function submitRating(
  merchantId: string,
  ratingData: RatingData,
  requestId?: string
): Promise<RatingResult> {
  try {
    const userId = await getUserId();
    
    // Check if user has contacted this merchant for this request
    const hasContacted = await hasUserContactedMerchant(merchantId, requestId);
    if (!hasContacted) {
      return { 
        success: false, 
        error: 'You can only rate merchants you have contacted' 
      };
    }
    
    // Check if user has already rated this merchant for this request
    const { data: existingRating } = await supabase
      .from('seller_ratings')
      .select('id, is_cancelled')
      .eq('user_id', userId)
      .eq('merchant_id', merchantId)
      .eq('request_id', requestId || null)
      .maybeSingle();

    if (existingRating) {
      if (existingRating.is_cancelled) {
        return { 
          success: false, 
          error: 'This rating has been cancelled and cannot be modified' 
        };
      }
      
      // Update existing rating
      const { error } = await supabase
        .from('seller_ratings')
        .update({
          rating: ratingData.rating,
          review_text: ratingData.review_text
        })
        .eq('id', existingRating.id);

      if (error) {
        console.error('Error updating rating:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Insert new rating
      const { error } = await supabase
        .from('seller_ratings')
        .insert({
          user_id: userId,
          merchant_id: merchantId,
          request_id: requestId,
          rating: ratingData.rating,
          review_text: ratingData.review_text,
          can_be_cancelled: true,
          is_cancelled: false
        });

      if (error) {
        console.error('Error inserting rating:', error);
        return { success: false, error: error.message };
      }
    }

    // Mark rating as completed in contact interactions
    if (requestId) {
      // Update the latest contact interaction for this user, merchant, and request
      const { data: latestContact } = await supabase
        .from('contact_interactions')
        .select('id')
        .eq('user_id', userId)
        .eq('merchant_id', merchantId)
        .eq('request_id', requestId)
        .order('contacted_at', { ascending: false })
        .limit(1);

      if (latestContact && latestContact.length > 0) {
        await supabase
          .from('contact_interactions')
          .update({ rating_completed: true })
          .eq('id', latestContact[0].id);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting rating:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Cancel a rating (mark as cancelled instead of deleting)
 */
export async function cancelRating(
  merchantId: string,
  requestId?: string
): Promise<RatingResult> {
  try {
    const userId = await getUserId();
    
    const { data: rating, error: fetchError } = await supabase
      .from('seller_ratings')
      .select('id, can_be_cancelled, is_cancelled')
      .eq('user_id', userId)
      .eq('merchant_id', merchantId)
      .eq('request_id', requestId || null)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching rating:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!rating) {
      return { success: false, error: 'No rating found to cancel' };
    }

    if (rating.is_cancelled) {
      return { success: false, error: 'Rating is already cancelled' };
    }

    if (!rating.can_be_cancelled) {
      return { success: false, error: 'This rating cannot be cancelled' };
    }

    // Mark rating as cancelled
    const { error } = await supabase
      .from('seller_ratings')
      .update({ 
        is_cancelled: true,
        can_be_cancelled: false 
      })
      .eq('id', rating.id);

    if (error) {
      console.error('Error cancelling rating:', error);
      return { success: false, error: error.message };
    }

    // Update contact interaction
    if (requestId) {
      // Update the latest contact interaction for this user, merchant, and request
      const { data: latestContact } = await supabase
        .from('contact_interactions')
        .select('id')
        .eq('user_id', userId)
        .eq('merchant_id', merchantId)
        .eq('request_id', requestId)
        .order('contacted_at', { ascending: false })
        .limit(1);

      if (latestContact && latestContact.length > 0) {
        await supabase
          .from('contact_interactions')
          .update({ rating_completed: false })
          .eq('id', latestContact[0].id);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error cancelling rating:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if user has already rated a merchant for a specific request
 */
export async function hasUserRatedMerchant(
  merchantId: string,
  requestId?: string
): Promise<boolean> {
  try {
    const userId = getUserId();
    
    const { data, error } = await supabase
      .from('seller_ratings')
      .select('id, is_cancelled')
      .eq('user_id', userId)
      .eq('merchant_id', merchantId)
      .eq('request_id', requestId || null)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking existing rating:', error);
      return false;
    }

    // Return true only if rating exists and is not cancelled
    return !!(data && !data.is_cancelled);
  } catch (error) {
    console.error('Error checking existing rating:', error);
    return false;
  }
}

/**
 * Get user's rating for a merchant and request
 */
export async function getUserRating(
  merchantId: string,
  requestId?: string
): Promise<{
  rating?: any;
  canRate: boolean;
  canCancel: boolean;
}> {
  try {
    const userId = await getUserId();
    
    // Check if user has contacted this merchant
    const hasContacted = await hasUserContactedMerchant(merchantId, requestId);
    
    // Get existing rating
    const { data: rating, error } = await supabase
      .from('seller_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('merchant_id', merchantId)
      .eq('request_id', requestId || null)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user rating:', error);
      return { canRate: false, canCancel: false };
    }

    const canRate = hasContacted && (!rating || rating.is_cancelled);
    const canCancel = !!(rating && !rating.is_cancelled && rating.can_be_cancelled);

    return {
      rating: rating && !rating.is_cancelled ? rating : undefined,
      canRate,
      canCancel
    };
  } catch (error) {
    console.error('Error getting user rating:', error);
    return { canRate: false, canCancel: false };
  }
}

/**
 * Get ratings for a merchant
 */
export async function getMerchantRatings(merchantId: string) {
  try {
    const { data, error } = await supabase
      .from('seller_ratings')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('is_cancelled', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching merchant ratings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching merchant ratings:', error);
    return [];
  }
}

/**
 * Get contacts that need rating prompts (24-48 hours after contact)
 */
export async function getContactsNeedingRatingPrompts(): Promise<any[]> {
  try {
    const userId = await getUserId();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('contact_interactions')
      .select(`
        *,
        merchants (
          id,
          full_name,
          seller_id
        ),
        request_logs (
          id,
          request_text
        )
      `)
      .eq('user_id', userId)
      .eq('rating_prompted', false)
      .eq('rating_completed', false)
      .gte('contacted_at', fortyEightHoursAgo.toISOString())
      .lte('contacted_at', twentyFourHoursAgo.toISOString());

    if (error) {
      console.error('Error fetching contacts needing rating prompts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching contacts needing rating prompts:', error);
    return [];
  }
}

/**
 * Mark a contact as rating prompted
 */
export async function markContactAsRatingPrompted(contactId: string): Promise<RatingResult> {
  try {
    const { error } = await supabase
      .from('contact_interactions')
      .update({ rating_prompted: true })
      .eq('id', contactId);

    if (error) {
      console.error('Error marking contact as rating prompted:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking contact as rating prompted:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}