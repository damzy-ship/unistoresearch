import { supabase, Merchant } from './supabase';

export interface MerchantWithCategories extends Merchant {
  categories: string[];
  categoryMatchScore?: number;
  average_rating?: number;
  total_ratings?: number;
  rating_breakdown?: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

/**
 * Get all merchants with their categories
 */
export async function getAllMerchantsWithCategories(): Promise<MerchantWithCategories[]> {
  try {
    const { data: merchants, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (merchantError) {
      console.error('Error fetching merchants:', merchantError);
      return [];
    }

    if (!merchants || merchants.length === 0) {
      return [];
    }

    // Get categories for each merchant
    const merchantsWithCategories: MerchantWithCategories[] = [];

    for (const merchant of merchants) {
      const { data: merchantCategories } = await supabase
        .from('merchant_categories')
        .select(`
          product_categories (
            name
          )
        `)
        .eq('merchant_id', merchant.id);

      const categories = merchantCategories?.map((item: any) => item.product_categories?.name).filter(Boolean) || [];

      merchantsWithCategories.push({
        ...merchant,
        categories
      });
    }

    return merchantsWithCategories;

  } catch (error) {
    console.error('Error getting all merchants with categories:', error);
    return [];
  }
}