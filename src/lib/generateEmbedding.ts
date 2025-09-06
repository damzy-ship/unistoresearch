import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase'; // Assuming this path is correct

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not defined. Cannot generate embeddings.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generates and stores vector embeddings for all products in the 'merchant_products' table.
 */
export async function generateProductEmbeddings(): Promise<void> {
  console.log('Starting product embedding generation...');

  try {
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

    // 1. Fetch all products from the 'merchant_products' table
    // You might want to filter for products that don't have an embedding yet to optimize.
    const { data: products, error: fetchError } = await supabase
      .from('merchant_products')
      .select('id, product_description');

    if (fetchError) {
      console.error('Error fetching products:', fetchError.message);
      return;
    }

    if (!products || products.length === 0) {
      console.log('No products found to process.');
      return;
    }

    console.log(`Found ${products.length} products to embed.`);

    // 2. Iterate through each product and generate its embedding
    for (const product of products) {
      if (!product.product_description) {
        console.warn(`Skipping product ID ${product.id} due to missing description.`);
        continue;
      }

      try {
        const result = await embeddingModel.embedContent(product.product_description);
        const embedding = result.embedding.values;

        // 3. Store the new embedding back into the 'merchant_products' table
        const { error: updateError } = await supabase
          .from('merchant_products')
          .update({ embedding: embedding })
          .eq('id', product.id);

        if (updateError) {
          console.error(`Error updating embedding for product ID ${product.id}:`, updateError.message);
        } else {
          console.log(`Successfully embedded and stored for product ID ${product.id}`);
        }

      } catch (embeddingError) {
        console.error(`Error generating embedding for product ID ${product.id}:`, embeddingError);
      }
    }

    console.log('Embedding generation complete!');

  } catch (globalError) {
    console.error('An unexpected error occurred:', globalError);
  }
}

// Example of how to run this function