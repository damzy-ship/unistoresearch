import { supabase } from "./supabase";

/**
 * Calls the deployed Supabase Edge Function to perform a semantic search.
 * @param {string} query The user's search text.
 * @returns {Promise<Array<Object> | null>} An array of relevant products, or null on error.
 */
export async function searchProducts(query: string) {
  try {
    // Invoke the Supabase Edge Function named 'your-function-name'.
    // Make sure to replace 'your-function-name' with the actual name you gave it during deployment.
    const { data, error } = await supabase.functions.invoke('semantic-search', {
      body: { request_text: query }
    });

    if (error) {
      console.error('Error calling search function:', error.message);
      return null;
    }
    
    // The data object will contain the 'products' array from your function's JSON response
    return data.products;

  } catch (err) {
    console.error('An unexpected error occurred:', err);
    return null;
  }
}