import { supabase } from "./supabase";

/**
 * Inserts the provided JSON data into the 'merchant_product_categories' table.
 *
 * @param categoriesData An array of category objects to be inserted.
 * @returns A promise that resolves to an object indicating the result of the operation.
 */
export async function insertMerchantProductCategories(categoriesData: Array<{ name: string; description?: string }>) {
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

// Reusable function to handle image upload, inspired by ProductGallery
export const uploadImageToSupabase = async (file, uniqueId: string, bucketName: string, folderName?: string) => {
  const fileExt = file.name.split('.').pop();
  // Ensure unique file name to prevent conflicts
  const fileName = `${uniqueId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${folderName ? folderName + '/' : ''}${fileName}`;

  // Upload file to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error uploading image: ${uploadError.message}`);
    console.log('Error uploading image:', uploadError);
  }


  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrl;
};

// Reusable function to delete image from Supabase Storage
export const deleteImageFromSupabase = async (imageUrl: string, bucketName: string) => {
  const urlParts = imageUrl.split('/');
  // Extract the filename with its folder from the public URL
  const fileName = urlParts.slice(urlParts.indexOf(bucketName) + 1).join('/');

  if (fileName) {
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (storageError) {
      console.warn('Error deleting image from storage:', storageError);
      // We can continue as the database record might be the primary source of truth
    }
  }
};


/**
 * Updates the 'actual_merchant_id' for all merchant products
 * by matching the product's 'merchant_id' with the 'auth_user_id'
 * from the 'unique_visitors' table.
 */
export async function updateAllMerchantProductsFromVisitors() {
  console.log('Starting bulk update of all merchant products...');
  const results = [];

  // Step 1: Fetch all unique visitors to get their IDs and corresponding auth_user_ids.
  console.log('Fetching all unique visitors...');
  const { data: visitors, error: visitorsError } = await supabase
    .from('unique_visitors')
    .select('id, auth_user_id');

  if (visitorsError) {
    console.error('Error fetching visitors:', visitorsError.message);
    return {
      status: 'error',
      message: 'Failed to fetch unique visitors.',
    };
  }

  if (!visitors || visitors.length === 0) {
    console.log('No unique visitors found. No products to update.');
    return {
      status: 'success',
      message: 'No unique visitors found. No updates performed.',
    };
  }

  console.log(`Found ${visitors.length} unique visitors. Starting product updates...`);

  // Step 2: Loop through each visitor and update their corresponding products.
  for (const visitor of visitors) {
    const { id: visitorId, auth_user_id: merchantId } = visitor;

    if (!merchantId) {
      console.warn(`Skipping visitor with ID ${visitorId} due to missing auth_user_id.`);
      results.push({ visitorId, status: 'skipped', reason: 'Missing auth_user_id' });
      continue;
    }

    try {
      console.log(`Updating products for merchant ID: ${merchantId}`);

      const { data: updatedProducts, error: updateError } = await supabase
        .from('merchant_products')
        .update({ actual_merchant_id: visitorId })
        .eq('merchant_id', merchantId)
        .select();

      if (updateError) {
        console.error(`Error updating products for merchant ${merchantId}:`, updateError.message);
        results.push({ merchantId, status: 'failed', error: updateError.message });
      } else {
        console.log(`Successfully updated ${updatedProducts?.length || 0} products for merchant ${merchantId}.`);
        results.push({ merchantId, status: 'success', count: updatedProducts?.length || 0 });
      }
    } catch (err) {
      console.error(`Unexpected error for merchant ${merchantId}:`, err);
      results.push({ merchantId, status: 'error', error: 'Unexpected error' });
    }
  }

  console.log('All updates complete.');
  return {
    status: 'complete',
    summary: results,
  };
}


/**
 * Updates the 'user_type' to NULL for all records in 'unique_visitors'
 * where the 'auth_user_id' is also NULL.
 */
export async function updateSchoolForNullAuthVisitors() {
  console.log('Starting bulk update of unique_visitors where auth_user_id is NULL...');

  try {
    const { data, error, count } = await supabase
      .from('unique_visitors')
      .update({ school_id: null }) // Set school_id to NULL
      .is('auth_user_id', null)    // Filter where auth_user_id is NULL
      .select('id', { count: 'exact' }); // Select ID and request an exact count of updated rows

    if (error) {
      console.error('Error during bulk user_type update:', error.message);
      return {
        status: 'failed',
        message: 'Failed to update user types.',
        error: error.message,
      };
    }

    const updatedCount = count || 0;
    console.log(`Successfully updated user_type to NULL for ${updatedCount} visitor records.`);

    return {
      status: 'success',
      message: `Updated ${updatedCount} unique visitors.`,
      count: updatedCount,
    };

  } catch (err) {
    console.error('Unexpected error during update:', err);
    return {
      status: 'error',
      message: 'An unexpected error occurred.',
      error: (err as Error).message,
    };
  }
}

export async function updateUserTypeForNullAuthVisitors() {
  console.log('Starting bulk update of unique_visitors where auth_user_id is NULL...');

  try {
    const { data, error, count } = await supabase
      .from('unique_visitors')
      .update({ user_type: 'visitor' })
      .is('auth_user_id', null)
      .select('id', { count: 'exact' });

    if (error) {
      console.error('Error during bulk user_type update:', error.message);
      return {
        status: 'failed',
        message: 'Failed to update user types.',
        error: error.message,
      };
    }

    const updatedCount = count || 0;
    console.log(`Successfully updated user_type to 'visitor' for ${updatedCount} visitor records.`);

    return {
      status: 'success',
      message: `Updated ${updatedCount} unique visitors.`,
      count: updatedCount,
    };

  } catch (err) {
    console.error('Unexpected error during update:', err);
    return {
      status: 'error',
      message: 'An unexpected error occurred.',
      error: (err as Error).message,
    };
  }
}