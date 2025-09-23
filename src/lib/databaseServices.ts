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