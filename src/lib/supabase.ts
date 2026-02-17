import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'unistore_auth_token'
  },
  global: {
    headers: {
      'X-Client-Info': 'unistore-web'
    }
  }
});

let activeSessionCall: Promise<{ data: { session: any }, error: any }> | null = null;

/**
 * Centered, lock-safe method to get the current session.
 * Prevents multiple background calls from hitting the auth lock at once (the cause of AbortError).
 * Includes retry logic for transient navigator lock issues.
 */
export async function getSafeSession() {
  if (activeSessionCall) return activeSessionCall;

  activeSessionCall = (async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        const result = await supabase.auth.getSession();
        return result;
      } catch (err: any) {
        // Specifically handle browser lock AbortError
        if ((err?.name === 'AbortError' || err?.message?.includes('Aborted')) && retries > 1) {
          console.warn(`[Supabase] Auth session lock contention, retrying... (${retries - 1} left)`);
          await new Promise(resolve => setTimeout(resolve, 200 * (4 - retries))); // Exponential backoff
          retries--;
          continue;
        }
        return { data: { session: null }, error: err };
      }
    }
    return { data: { session: null }, error: new Error('Max retries reached for auth session') };
  })();

  try {
    return await activeSessionCall;
  } finally {
    // Keep it for a short duration to dedupe calls hitting at the same time, then clear.
    setTimeout(() => { activeSessionCall = null; }, 2000);
  }
}

export interface UniqueVisitor {
  id?: string;
  user_id?: string;
  auth_user_id?: string;
  full_name?: string;
  phone_number?: string;
  first_visit?: string;
  last_visit?: string;
  visit_count?: number;
  created_at?: string;
  user_type?: string;
  school_id?: string;
  brand_name?: string | null;
  email?: string;
  verification_status?: 'pending' | 'verified' | 'unverified' | null;
  verification_id?: string;
  hostel_id?: string
  schools?: School
  hostels?: Hostel
  room?: string
  is_hostel_merchant?: boolean
  profile_picture?: string
  is_admin?: boolean
}

export interface userAnalytics {
  id: string;
  actual_user_id: string;
  event_type: string;
  event_details: Record<string, any>;
  event_description: string;
  current_page_url: string;
  created_at: string;
}

export interface Product {
  id: string;
  product_description: string;
  product_price: string;
  image_urls: string[];
  is_available: boolean;
  full_name: string;
  phone_number: string;
  school_id: string;
  school_name?: string;
  school_short_name?: string;
  discount_price?: string;
  similarity?: number;
  is_featured?: boolean;
  search_description?: string;
  embedding: number[];
  created_at?: string;
  merchant_id?: string;
  actual_merchant_id?: string;
  unique_visitors?: UniqueVisitor;
  is_hostel_product: boolean;
  hostel_name?: string;
  room?: string;
  is_hostel_merchant?: boolean;
  brand_name?: string | null;
  product_category?: string;
  search_words?: string[];

}

export interface HostelsProductUpdates {
  id: string;
  post_description: string;
  post_images: string[];
  created_at: string;
  actual_user_id: string;
  unique_visitors?: UniqueVisitor;
  post_category: string;
  search_words: string[];
  status?: 'open' | 'fulfilled' | 'cancelled' | 'hide';
  post_type: 'update' | 'request';
  fulfilled: boolean | null;
  price?: number | null;
  discount_price?: number | null;
}

export interface RequestLog {
  id: string;
  user_id: string;
  university: string;
  request_text: string;
  matched_seller_ids?: string[];
  created_at: string;
  matched_categories?: string[];
  matched_features?: string[];
}


export interface School {
  id: string;
  name: string;
  short_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Hostel {
  id: string
  name: string
  school_id: string
  schools?: School
}


export interface MerchantAnalytics {
  id: string;
  merchant_id: string;
  // request_id?: string;
  product_id: string;
  event_type: 'profile_contacted';
  user_id: string;
  created_at?: string;
}

export interface ProductCategory {
  id: string;
  category_name: string;
  category_image: string;
  category_list: string[];
  created_at: string;
}

// Add function to delete a request log
export async function deleteRequestLog(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('request_logs')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting request log:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface Coupon {
  id: string;
  code: string;
  value: number;
  claimed: boolean;
  created_at: string;
  claimed_by: string; // UUID of unique visitors
  claimed_at: number;
  school_id: string;
  type?: 'discount' | 'product';
  product_id?: string;
}
