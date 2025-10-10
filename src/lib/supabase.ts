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
  verification_status?: 'pending' | 'verified' | 'unverified'| null;
  verification_id?: string;
  hostel_id?: string
  schools?: School
  hostels?: Hostel
  room?: string
  is_hostel_merchant?: boolean
  profile_picture?: string
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
    profile_picture?: string
}

export interface HostelsProductUpdates {
  id: string;
  post_description: string;
  post_images: string[];
  created_at: string;
  merchant_id: string;
  unique_visitors?: UniqueVisitor;
  post_category: string;
  search_words: string[];
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
    console.error('Unexpected error deleting request log:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}