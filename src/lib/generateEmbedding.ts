import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase'; // Assuming this path is correct

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not defined. Cannot generate embeddings.');
  // Using an anonymous function to avoid blocking execution in a browser environment.
  (async () => {
    console.error('Exiting process.');
  })();
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Transforms a given text description or query into a structured, templated format.
 * This function now first generates product categories and features from the input text
 * before creating a final, refined description.
 * @param {string} originalText - The original product description or user query.
 * @returns {Promise<string>} - The newly formatted and enhanced description.
 */
export async function transformDescriptionForEmbedding(originalText: string): Promise<string> {
  const generativeModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Step 1: Generate categories and features from the original text
  const extractionPrompt = `
    Analyze the following product description and extract the main product categories and key features (like color, size, material).
    Return the result as a JSON object with two keys: "categories" (an array of strings) and "features" (an object with key-value pairs).

    Product Description: "${originalText}"

    Example output format:
    {
      "categories": ["clothing", "luxury fashion"],
      "features": {
        "color": "blue",
        "material": "cotton"
      }
    }
    `;

  let categories = [];
  let features = {};

  try {
    const extractionResult = await generativeModel.generateContent({
      contents: [{ parts: [{ text: extractionPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const extractionData = JSON.parse(extractionResult.response.text());
    if (extractionData.categories) {
      categories = extractionData.categories;
    }
    if (extractionData.features) {
      features = extractionData.features;
    }
  } catch (error) {
    console.error('Error generating categories and features:', error);
  }

  // Step 2: Use the generated categories and features to create the final description
  const categoriesText = categories.length > 0 ? `Categories: ${categories.join(', ')}` : '';
  const featuresText = Object.keys(features).length > 0 ? `Features: ${Object.entries(features).map(([key, value]) => `${key}: ${value}`).join(', ')}` : '';

const descriptionPrompt = `
  Please act as a friendly guide describing a product to someone who cannot see it, like a child or a person who is blind. The description should be simple, clear, and focused on helping them understand what the product is and what it's for.

  Your description should:
  - State the main product category first (e.g., shoe, electronic device, kitchen appliance).
  - Use simple words and a natural, conversational tone.
  - Explain the purpose or use of the product.
  - Be no longer than 30 words.

  Follow these examples:
  Original: nike shoes size 42
  New: This is a pair of shoes, specifically Nike footwear, for someone looking for a size 42.

  Original: coffee machine with grinder
  New: This is a kitchen appliance, a coffee machine, that can grind fresh beans for you.

  Original: sony wireless headphones with noise cancelling
  New: This is an electronic device, a pair of headphones, that lets you listen to music without wires and blocks out sound.

  Product Information:
  - Original Description: ${originalText}
  ${categoriesText}
  ${featuresText}

  Please ensure the output is only the new description text and nothing else.
 `;
 
  try {
    const result = await generativeModel.generateContent(descriptionPrompt);
    const newDescription = result.response.text();
    return newDescription.trim();
  } catch (error) {
    console.error('Error transforming description:', error);
    // Return the original text as a fallback if the transformation fails.
    return originalText;
  }
}

/**
 * Generates and stores vector embeddings for all products in the 'merchant_products' table.
 * The process now first refines the description using a generative model before
 * creating the embedding.
 */
export async function generateProductEmbeddings() {
  console.log('Starting product embedding generation...');

  try {
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

    // 1. Fetch all products from the 'merchant_products' table, as we now generate categories/features
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

    // 2. Iterate through each product, transform its description, and generate an embedding
    for (const product of products) {
      if (!product.product_description) {
        console.warn(`Skipping product ID ${product.id} due to missing description.`);
        continue;
      }

      try {
        // Use the new helper function to transform the description
        const enhancedDescription = await transformDescriptionForEmbedding(product.product_description);

        // Generate the embedding from the enhanced description
        const result = await embeddingModel.embedContent(enhancedDescription);
        const embedding = result.embedding.values;

        // 3. Store the new embedding AND the transformed description back into the 'merchant_products' table
        const { error: updateError } = await supabase
          .from('merchant_products')
          .update({
            embedding: embedding,
            search_description: enhancedDescription
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`Error updating embedding for product ID ${product.id}:`, updateError.message);
        } else {
          console.log(`Successfully embedded and stored for product ID ${product.id}`);
        }
      } catch (embeddingError) {
        console.error(`Error generating or updating embedding for product ID ${product.id}:`, embeddingError);
      }
    }

    console.log('Embedding generation complete!');

  } catch (globalError) {
    console.error('An unexpected error occurred:', globalError);
  }
}

/**
 * Generates a vector embedding for a single product description after enhancing it.
 * @param {string} description - The original product description.
 * @returns {Promise<{ embedding: number[], enhancedDescription: string }>} - An object containing the generated embedding vector and the enhanced description.
 * @throws {Error} if the embedding generation fails.
 */
export async function generateAndEmbedSingleProduct(description: string): Promise<{ embedding: number[], enhancedDescription: string }> {
  try {
    // Use the new helper function to transform the description
    const enhancedDescription = await transformDescriptionForEmbedding(description);

    // Generate the embedding from the enhanced description
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await embeddingModel.embedContent(enhancedDescription);
    const embedding = result.embedding.values;

    // Return an object containing both the embedding and the enhanced description
    return { embedding, enhancedDescription };
  } catch (error) {
    console.error('Error generating embedding for a single product:', error);
    throw new Error('Failed to generate product embedding.');
  }
}