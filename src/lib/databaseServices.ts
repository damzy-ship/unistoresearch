import { supabase } from "./supabase";

/**
 * Inserts the provided JSON data into the 'merchant_product_categories' table.
 *
 * @param categoriesData An array of category objects to be inserted.
 * @returns A promise that resolves to an object indicating the result of the operation.
 */
export async function insertMerchantProductCategories(categoriesData) {
  try {
    console.log(`Starting to insert ${categoriesData.length} category entries...`);

    const { data, error } = await supabase
      .from('merchant_product_categories')
      .insert(categoriesData);

    if (error) {
      console.error('Error inserting data:', error.message);
      return { status: 'failed', error: error.message };
    } else {
      console.log('Successfully inserted all category entries.');
      return { status: 'success', data };
    }
  } catch (err) {
    console.error('Unexpected error during insertion:', err);
    return { status: 'error', error: 'Unexpected error occurred.' };
  }
}