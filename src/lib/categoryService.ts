import { supabase } from './supabase';
import { generateProductCategories } from './gemini';

export interface ProductCategory {
  id: string;
  name: string;
  created_at: string;
}

/**
 * Store merchant-category relationships in the database
 */
export async function storeMerchantCategories(merchantId: string, categoryNames: string[]): Promise<boolean> {
  try {
    if (categoryNames.length === 0) {
      return true;
    }

    // First ensure all categories exist in the database
    for (const categoryName of categoryNames) {
      await supabase
        .from('product_categories')
        .upsert({ name: categoryName }, { onConflict: 'name' });
    }

    // First, get the category IDs for the given category names
    const { data: categories, error: fetchError } = await supabase
      .from('product_categories')
      .select('id, name')
      .in('name', categoryNames);

    if (fetchError) {
      console.error('Error fetching category IDs:', fetchError);
      return false;
    }

    if (!categories || categories.length === 0) {
      console.warn('No categories found for names:', categoryNames);
      return false;
    }

    // Create merchant-category relationships
    const merchantCategories = categories.map(category => ({
      merchant_id: merchantId,
      category_id: category.id
    }));

    // Use upsert to handle duplicates gracefully
    const { error: insertError } = await supabase
      .from('merchant_categories')
      .upsert(merchantCategories, { 
        onConflict: 'merchant_id,category_id',
        ignoreDuplicates: true 
      });

    if (insertError) {
      console.error('Error storing merchant categories:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error storing merchant categories:', error);
    return false;
  }
}

/**
 * Remove merchant-category relationships from the database
 */
export async function removeMerchantCategories(merchantId: string, categoryNames: string[]): Promise<boolean> {
  try {
    if (categoryNames.length === 0) {
      return true;
    }

    // Get category IDs for the given category names
    const { data: categories, error: fetchError } = await supabase
      .from('product_categories')
      .select('id, name')
      .in('name', categoryNames);

    if (fetchError) {
      console.error('Error fetching category IDs for removal:', fetchError);
      return false;
    }

    if (!categories || categories.length === 0) {
      return true; // No categories to remove
    }

    // Remove merchant-category relationships
    const categoryIds = categories.map(cat => cat.id);
    const { error: deleteError } = await supabase
      .from('merchant_categories')
      .delete()
      .eq('merchant_id', merchantId)
      .in('category_id', categoryIds);

    if (deleteError) {
      console.error('Error removing merchant categories:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing merchant categories:', error);
    return false;
  }
}

/**
 * Get stored categories for a merchant
 */
export async function getStoredMerchantCategories(merchantId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('merchant_categories')
      .select(`
        product_categories (
          name
        )
      `)
      .eq('merchant_id', merchantId);

    if (error) {
      console.error('Error fetching stored merchant categories:', error);
      return [];
    }

    return data?.map((item: any) => item.product_categories?.name).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching stored merchant categories:', error);
    return [];
  }
}

/**
 * Normalize category name for consistent comparison
 */
function normalizeCategory(category: string): string {
  return category.trim().toLowerCase();
}

/**
 * Fetch all existing categories from Supabase
 */
export async function fetchExistingCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data?.map(item => item.name) || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Insert a new category into Supabase (handles duplicates gracefully)
 */
async function insertCategory(categoryName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product_categories')
      .insert({ name: categoryName });

    if (error) {
      // If it's a unique constraint violation, that's okay - category already exists
      if (error.code === '23505') {
        return true;
      }
      console.error('Error inserting category:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error inserting category:', error);
    return false;
  }
}

/**
 * Generate and process categories for a seller description
 */
export async function processSellerCategories(sellerDescription: string, merchantId?: string): Promise<{
  categories: string[];
  success: boolean;
  error?: string;
}> {
  try {
    // Step 1: Generate categories using Gemini
    const generationResult = await generateProductCategories(sellerDescription);
    
    if (!generationResult.success) {
      return {
        categories: [],
        success: false,
        error: generationResult.error
      };
    }

    // Step 2: Fetch existing categories from Supabase
    const existingCategories = await fetchExistingCategories();
    const existingCategoriesNormalized = existingCategories.map(normalizeCategory);

    // Step 3: Process each generated category
    const finalCategories: string[] = [];
    
    for (const generatedCategory of generationResult.categories) {
      const normalizedGenerated = normalizeCategory(generatedCategory);
      
      // Check if category already exists (case-insensitive)
      const existingMatch = existingCategories.find(
        existing => normalizeCategory(existing) === normalizedGenerated
      );
      
      if (existingMatch) {
        // Use the existing category name (preserves original casing)
        finalCategories.push(existingMatch);
      } else {
        // Insert new category
        const insertSuccess = await insertCategory(generatedCategory);
        if (insertSuccess) {
          finalCategories.push(generatedCategory);
        }
      }
    }

    // Note: Categories are added to catalog immediately, but merchant-category 
    // relationships are only stored after successful merchant registration

    return {
      categories: finalCategories,
      success: true
    };

  } catch (error) {
    console.error('Error processing seller categories:', error);
    return {
      categories: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get categories for a specific merchant based on their description
 * This function now prioritizes stored categories over generating new ones
 */
export async function getMerchantCategories(merchantId: string, sellerDescription: string): Promise<string[]> {
  try {
    // First, try to get stored categories
    const storedCategories = await getStoredMerchantCategories(merchantId);
    if (storedCategories.length > 0) {
      return storedCategories;
    }

    // If no stored categories, generate and store them
    const result = await processSellerCategories(sellerDescription, merchantId);
    
    if (result.success) {
      return result.categories;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting merchant categories:', error);
    return [];
  }
}

/**
 * Get all categories for display/selection purposes
 */
export async function getAllCategories(): Promise<ProductCategory[]> {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching all categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all categories:', error);
    return [];
  }
}