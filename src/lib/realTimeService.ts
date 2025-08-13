import { supabase } from './supabase';
import { getUserId, isAuthenticated } from '../hooks/useTracking';
import { extractProductInfoFromText } from './gemini';

export interface RealTimeProduct {
  id: string;
  merchant_id: string; // UUID of the merchant
  title: string;
  description?: string;
  price?: number;
  location?: string;
  contact_phone?: string;
  category?: string;
  media_url: string;
  media_type: 'image' | 'video';
  duration?: number;
  views_count: number;
  contact_clicks: number;
  reactions_count: number;
  comments_count: number;
  is_featured: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Text post specific fields
  text_color?: string;
  is_text_post?: boolean;
  // Joined data
  merchant?: {
    full_name: string;
    seller_id: string;
    phone_number: string;
    average_rating?: number;
    total_ratings?: number;
  };
}

export interface RealTimeProductView {
  id: string;
  product_id: string;
  user_id: string;
  viewed_at: string;
}

export interface RealTimeProductContact {
  id: string;
  product_id: string;
  user_id: string;
  contacted_at: string;
  contact_method: 'whatsapp' | 'call' | 'message';
}

export interface CreateRealTimeProductData {
  title: string;
  description?: string;
  price?: number;
  location?: string;
  contact_phone?: string;
  category?: string;
  media_url: string;
  media_type: 'image' | 'video';
  duration?: number;
  text_color?: string;
  is_text_post?: boolean;
}

export interface RealTimeProductReaction {
  id: string;
  product_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'wow' | 'fire' | 'interested';
  created_at: string;
}

export interface RealTimeProductComment {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get active real-time products (not expired)
 */
export async function getActiveRealTimeProducts(limit: number = 20): Promise<{
  data: RealTimeProduct[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('real_time_products')
      .select(`
        *,
        merchant:merchants(
          full_name,
          seller_id,
          phone_number,
          average_rating,
          total_ratings
        )
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching real-time products:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching real-time products:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get real-time products by merchant
 */
export async function getRealTimeProductsByMerchant(merchantId: string): Promise<{
  data: RealTimeProduct[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('real_time_products')
      .select('*')
      .eq('merchant_id', merchantId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching merchant real-time products:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching merchant real-time products:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get or create merchant record for current user
 */
async function getOrCreateUserMerchant(): Promise<string | null> {
  try {
    const userId = await getUserId();
    if (!userId) return null;

    // First try to find existing merchant
    const { data: existingMerchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('seller_id', userId)
      .single();

    if (existingMerchant) {
      return existingMerchant.id;
    }

    // Get user info to use their actual university
    const { data: userData } = await supabase
      .from('unique_visitors')
      .select('phone_number, full_name, school_name')
      .eq('auth_user_id', userId)
      .single();

    // If no merchant exists, create one with user's actual info
    const { data: newMerchant, error: createError } = await supabase
      .from('merchants')
      .insert({
        seller_id: userId,
        email: `${userId}@realtime.com`, // Generate email from user ID
        full_name: userData?.full_name || 'Real-time User',
        phone_number: userData?.phone_number || '+234000000000',
        school_name: userData?.school_name || 'Bingham University', // Use user's actual university
        seller_description: 'Real-time product seller',
        is_billing_active: true
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating merchant:', createError);
      return null;
    }

    return newMerchant.id;
  } catch (error) {
    console.error('Error getting or creating merchant:', error);
    return null;
  }
}

/**
 * Get user contact info from profile
 */
async function getUserContactInfo(): Promise<{ phone?: string; location?: string }> {
  try {
    const userId = await getUserId();
    // console.log(userId);
    if (!userId) return {};

    // Get user info from unique_visitors table
    const { data: userData } = await supabase
      .from('unique_visitors')
      .select('phone_number, full_name')
      .eq('auth_user_id', userId)
      .single();

      // console.log('User contact info:', userData);
    return {
      phone: userData?.phone_number || undefined,
      // location: userData?.school_name || undefined
    };
  } catch (error) {
    console.error('Error getting user contact info:', error);
    return {};
  }
}

/**
 * Create a new real-time product
 */
export async function createRealTimeProduct(productData: CreateRealTimeProductData): Promise<{
  data: RealTimeProduct | null;
  error: string | null;
}> {
  try {
    // Check if user is authenticated
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return { data: null, error: 'User must be authenticated to create real-time products' };
    }

    // Get or create merchant record for current user
    const merchantId = await getOrCreateUserMerchant();
    if (!merchantId) {
      return { data: null, error: 'Could not create merchant record' };
    }

    // Get user contact info
    const userContactInfo = await getUserContactInfo();
    console.log('User contact info:', userContactInfo);

    // Use Gemini to extract additional information from title and description
    let enhancedProductData = { ...productData };
    
    if (productData.title) {
      try {
        const extractionResult = await extractProductInfoFromText(
          productData.title, 
          productData.description || '' // Use empty string if no description
        );
        
        if (extractionResult.success) {
          // Merge extracted data with original data (only if not already provided)
          enhancedProductData = {
            ...productData,
            price: productData.price || extractionResult.price || undefined,
            location: productData.location || extractionResult.location || userContactInfo.location || undefined,
            category: productData.category || extractionResult.category || undefined,
            contact_phone: productData.contact_phone || extractionResult.contact_phone || userContactInfo.phone || undefined
          };
          
          console.log('Gemini extraction successful:', extractionResult);
          console.log('Final product data:', enhancedProductData);
        } else {
          console.warn('Gemini extraction failed:', extractionResult.error);
          // Still use user contact info even if Gemini fails
          enhancedProductData = {
            ...productData,
            location: productData.location || userContactInfo.location || undefined,
            contact_phone: productData.contact_phone || userContactInfo.phone || undefined
          };
          console.log('Using user contact info (Gemini failed):', enhancedProductData);
        }
      } catch (error) {
        console.warn('Gemini extraction error:', error);
        // Use user contact info as fallback
        enhancedProductData = {
          ...productData,
          location: productData.location || userContactInfo.location || undefined,
          contact_phone: productData.contact_phone || userContactInfo.phone || undefined
        };
        console.log('Using user contact info (Gemini error):', enhancedProductData);
      }
    } else {
      // No title, use user contact info
      enhancedProductData = {
        ...productData,
        location: productData.location || userContactInfo.location || undefined,
        contact_phone: productData.contact_phone || userContactInfo.phone || undefined
      };
      console.log('Using user contact info (no title):', enhancedProductData);
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from('real_time_products')
      .insert({
        ...enhancedProductData,
        merchant_id: merchantId,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating real-time product:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating real-time product:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Track a view for a real-time product
 */
export async function trackRealTimeProductView(productId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const userId = await getUserId();

    const { error } = await supabase
      .from('real_time_product_views')
      .insert({
        product_id: productId,
        user_id: userId
      });

    if (error) {
      console.error('Error tracking real-time product view:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error tracking real-time product view:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Track a contact interaction for a real-time product
 */
export async function trackRealTimeProductContact(
  productId: string, 
  contactMethod: 'whatsapp' | 'call' | 'message'
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const userId = await getUserId();

    const { error } = await supabase
      .from('real_time_product_contacts')
      .insert({
        product_id: productId,
        user_id: userId,
        contact_method: contactMethod
      });

    if (error) {
      console.error('Error tracking real-time product contact:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error tracking real-time product contact:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete a real-time product (only by the merchant who created it)
 */
export async function deleteRealTimeProduct(productId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { error } = await supabase
      .from('real_time_products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting real-time product:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error deleting real-time product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get real-time product analytics
 */
export async function getRealTimeProductAnalytics(productId: string): Promise<{
  data: {
    views: number;
    contacts: number;
    contactBreakdown: {
      whatsapp: number;
      call: number;
      message: number;
    };
  } | null;
  error: string | null;
}> {
  try {
    // Get views count
    const { count: viewsCount } = await supabase
      .from('real_time_product_views')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    // Get contacts count and breakdown
    const { data: contacts, error: contactsError } = await supabase
      .from('real_time_product_contacts')
      .select('contact_method')
      .eq('product_id', productId);

    if (contactsError) {
      console.error('Error fetching contact analytics:', contactsError);
      return { data: null, error: contactsError.message };
    }

    const contactBreakdown = {
      whatsapp: contacts?.filter(c => c.contact_method === 'whatsapp').length || 0,
      call: contacts?.filter(c => c.contact_method === 'call').length || 0,
      message: contacts?.filter(c => c.contact_method === 'message').length || 0
    };

    const contactsCount = contacts?.length || 0;

    return {
      data: {
        views: viewsCount || 0,
        contacts: contactsCount,
        contactBreakdown
      },
      error: null
    };
  } catch (error) {
    console.error('Unexpected error fetching real-time product analytics:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get featured real-time products
 */
export async function getFeaturedRealTimeProducts(limit: number = 5): Promise<{
  data: RealTimeProduct[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('real_time_products')
      .select(`
        *,
        merchant:merchants(
          full_name,
          seller_id,
          phone_number,
          average_rating,
          total_ratings
        )
      `)
      .eq('is_featured', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured real-time products:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching featured real-time products:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if user has viewed a real-time product
 */
export async function hasUserViewedRealTimeProduct(productId: string): Promise<boolean> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('real_time_product_views')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error checking if user viewed real-time product:', error);
      return false;
    }

    return !!(data && data.length > 0);
  } catch (error) {
    console.error('Unexpected error checking real-time product view:', error);
    return false;
  }
}

/**
 * Get time remaining until expiration
 */
export function getTimeRemaining(expiresAt: string): {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diff = expiration.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, isExpired: false };
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return created.toLocaleDateString();
} 

/**
 * Add reaction to a real-time product
 */
export async function addReaction(
  productId: string, 
  reactionType: 'like' | 'love' | 'wow' | 'fire' | 'interested'
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('real_time_product_reactions')
      .upsert({
        product_id: productId,
        user_id: userId,
        reaction_type: reactionType
      });

    if (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error adding reaction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Remove reaction from a real-time product
 */
export async function removeReaction(
  productId: string, 
  reactionType: 'like' | 'love' | 'wow' | 'fire' | 'interested'
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('real_time_product_reactions')
      .delete()
      .eq('product_id', productId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType);

    if (error) {
      console.error('Error removing reaction:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error removing reaction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get user's reactions for a product
 */
export async function getUserReactions(productId: string): Promise<{
  data: RealTimeProductReaction[] | null;
  error: string | null;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('real_time_product_reactions')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user reactions:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching user reactions:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Add comment to a real-time product
 */
export async function addComment(
  productId: string, 
  commentText: string,
  userName: string
): Promise<{
  data: RealTimeProductComment | null;
  error: string | null;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { data: null, error: 'User not authenticated' };
    }

    if (!commentText.trim()) {
      return { data: null, error: 'Comment cannot be empty' };
    }

    const { data, error } = await supabase
      .from('real_time_product_comments')
      .insert({
        product_id: productId,
        user_id: userId,
        user_name: userName,
        comment_text: commentText.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error adding comment:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get comments for a real-time product
 */
export async function getProductComments(productId: string): Promise<{
  data: RealTimeProductComment[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('real_time_product_comments')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching comments:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('real_time_product_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error deleting comment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 