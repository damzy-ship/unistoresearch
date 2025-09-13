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

export interface UniqueVisitor {
  id: string;
  user_id: string;
  auth_user_id?: string;
  full_name?: string;
  phone_number?: string;
  first_visit: string;
  last_visit: string;
  visit_count: number;
  created_at: string;
  user_type: string;
  school_id: string;
}

export interface RequestLog {
  id: string;
  user_id: string;
  university: string;
  request_text: string;
  matched_seller_ids?: string[];
  created_at: string;
}

export interface Merchant {
  id: string;
  seller_id: string;
  email: string;
  full_name: string;
  phone_number: string;
  school_name: string;
  seller_description: string;
  created_at: string;
  categories?: string[];
  last_matched_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface MerchantCategory {
  id: string;
  merchant_id: string;
  category_id: string;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  short_name: string;
  is_active: boolean;
  created_at: string;
}

export interface SellerRating {
  id: string;
  user_id: string;
  merchant_id: string;
  request_id?: string;
  rating: number;
  review_text?: string;
  created_at: string;
}

export interface ContactInteraction {
  id: string;
  user_id: string;
  merchant_id: string;
  request_id?: string;
  contacted_at: string;
  rating_prompted: boolean;
  rating_completed: boolean;
  created_at: string;
}

export interface MerchantWithRating extends Merchant {
  average_rating: number;
  total_ratings: number;
  rating_breakdown: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
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
    console.error('Unexpected error deleting request log:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}