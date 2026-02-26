import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import { fetchExistingCategories } from './categoryService';
// import { transformDescriptionForEmbedding } from './generateEmbedding';

const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY);

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY not found. Category generation will be disabled.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface CategoryGenerationResult {
  categories: string[];
  success: boolean;
  error?: string;
}

/**
 * Robustly parse JSON from AI response, handling markdown backticks and noise
 */
function parseJSONResponse(text: string): any {
  try {
    // If it's already clean JSON
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        // Fall through
      }
    }

    // Last ditch effort: find first '[' or '{' and last ']' or '}'
    const startIdx = Math.min(
      text.indexOf('{') === -1 ? Infinity : text.indexOf('{'),
      text.indexOf('[') === -1 ? Infinity : text.indexOf('[')
    );
    const endIdx = Math.max(
      text.lastIndexOf('}'),
      text.lastIndexOf(']')
    );

    if (startIdx !== Infinity && endIdx !== -1 && endIdx > startIdx) {
      try {
        return JSON.parse(text.substring(startIdx, endIdx + 1));
      } catch (e3) {
        // Fall through
      }
    }

    throw new Error('Could not parse JSON from response: ' + text.substring(0, 100) + '...');
  }
}

export interface CategoryMatchResult {
  categories: string[];
  success: boolean;
  error?: string;
}

export interface MerchantWithCategories {
  id: string;
  seller_id: string;
  email: string;
  full_name: string;
  phone_number: string;
  school_name: string;
  seller_description: string;
  created_at: string;
  last_matched_at?: string;
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

export interface MerchantMatchResult {
  merchants: MerchantWithCategories[];
  success: boolean;
  error?: string;
}

export interface ProductExtractionResult {
  price?: number;
  location?: string;
  category?: string;
  contact_phone?: string;
  success: boolean;
  error?: string;
}

export async function generateProductCategories(sellerDescription: string): Promise<CategoryGenerationResult> {
  if (!genAI) {
    return {
      categories: [],
      success: false,
      error: 'Gemini API key not configured'
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    }, { apiVersion: 'v1' });

    const prompt = `
Based on the following seller description, generate relevant product categories that this seller might offer.

Seller Description: "${sellerDescription}"

Requirements:
- Return a JSON array of strings
- Each category should be 1-3 words maximum
- Categories should be general product types (e.g., "Electronics", "Clothing", "Books", "Food Items")
- Maximum 5 categories
- Use title case (e.g., "Mobile Phones" not "mobile phones")
- Be specific but not overly narrow
- Don't generate categories too general like accessories, rather be more specific like, hair accessories, tech accessories, fashion accessories.

Example response:
["Electronics", "Mobile Accessories", "Gadgets"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const categories = parseJSONResponse(response.text());

    if (!Array.isArray(categories) || !categories.every(cat => typeof cat === 'string')) {
      throw new Error('Invalid response format');
    }

    return {
      categories: categories
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0)
        .slice(0, 5),
      success: true
    };

  } catch (error) {
    console.error('Error generating categories with Gemini:', error);
    return {
      categories: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function generateCategoriesFromRequest(requestText: string): Promise<CategoryGenerationResult> {
  if (!genAI) {
    return {
      categories: [],
      success: false,
      error: 'Gemini API key not configured'
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    }, { apiVersion: 'v1' });

    const prompt = `
You are a product categorization expert. Given a user's product request, generate the most likely product categories that would contain the items they're looking for.

User Request: "${requestText}"

Requirements:
- Return a JSON array of category names
- Maximum 5 categories
- Each category should be 1-3 words maximum
- Use title case (e.g., "Mobile Phones" not "mobile phones")
- Be specific and relevant to the request
- Order by relevance (most relevant first)

Example response for "I need a laptop for school":
["Laptops", "Electronics", "Computers"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const categories = parseJSONResponse(response.text());

    if (!Array.isArray(categories) || !categories.every(cat => typeof cat === 'string')) {
      throw new Error('Invalid response format');
    }

    return {
      categories: categories
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0)
        .slice(0, 5),
      success: true
    };

  } catch (error) {
    console.error('Error generating categories from request with Gemini:', error);
    return {
      categories: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Find similar categories using AI semantic matching with extremely low scores
 */
export async function findSimilarCategoriesWithAI(generatedCategories: string[], catalogCategories: string[]): Promise<CategoryMatchResult> {
  // First get word-based matches (high scores)
  const wordBasedMatches = findSimilarCategories(generatedCategories, catalogCategories);

  // Then get semantic matches (extremely low scores)
  const semanticMatches = await findSemanticMatches(generatedCategories, catalogCategories);

  // Combine results, removing duplicates (word-based takes precedence)
  const allMatches = [...wordBasedMatches];
  for (const semanticMatch of semanticMatches) {
    if (!allMatches.includes(semanticMatch)) {
      allMatches.push(semanticMatch);
    }
  }

  return {
    categories: allMatches,
    success: true
  };
}

/**
 * Find semantic matches using AI with extremely low scoring
 */
async function findSemanticMatches(generatedCategories: string[], catalogCategories: string[]): Promise<string[]> {
  if (!genAI || catalogCategories.length === 0 || generatedCategories.length === 0) {
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    }, { apiVersion: 'v1' });

    const prompt = `
Find categories from the catalog that are semantically similar to the generated categories.

Generated Categories: ${JSON.stringify(generatedCategories)}
Catalog Categories: ${JSON.stringify(catalogCategories)}

Requirements:
- Return a JSON array of category names from the catalog
- Only include categories that are semantically related
- Maximum 3 matches
- Be conservative - only include strong semantic relationships

Example Response:
["Computing Equipment", "Tech Gadgets"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let semanticMatches = parseJSONResponse(response.text());

    if (!Array.isArray(semanticMatches)) return [];

    // Validate that returned categories exist in catalog
    semanticMatches = semanticMatches.filter(match => catalogCategories.includes(match));

    console.log('Semantic matches found:', semanticMatches);
    return semanticMatches;

  } catch (error) {
    console.error('Error in semantic matching:', error);
    return [];
  }
}

/**
 * Find similar categories using exact word matching and containment
 */
export function findSimilarCategories(generatedCategories: string[], catalogCategories: string[]): string[] {
  const similarCategories: string[] = [];

  console.log('=== Word-Based Category Matching Debug ===');
  console.log('Generated categories:', generatedCategories);
  console.log('Catalog categories:', catalogCategories);

  for (const generated of generatedCategories) {
    const generatedLower = generated.toLowerCase();
    console.log(`\nChecking generated category: "${generated}"`);

    for (const catalog of catalogCategories) {
      const catalogLower = catalog.toLowerCase();

      // Exact match (highest priority)
      if (generatedLower === catalogLower) {
        console.log(`✓ Exact match found: "${generated}" = "${catalog}"`);
        if (!similarCategories.includes(catalog)) {
          similarCategories.push(catalog);
        }
        continue;
      }

      // Word containment matching
      if (catalogLower.includes(generatedLower) && generatedLower.length >= 3) {
        console.log(`✓ Generated contained in catalog: "${generated}" in "${catalog}"`);
        if (!similarCategories.includes(catalog)) {
          similarCategories.push(catalog);
        }
        continue;
      }

      if (generatedLower.includes(catalogLower) && catalogLower.length >= 3) {
        console.log(`✓ Catalog contained in generated: "${catalog}" in "${generated}"`);
        if (!similarCategories.includes(catalog)) {
          similarCategories.push(catalog);
        }
        continue;
      }

      // Word-by-word matching
      const generatedWords = generatedLower.split(/\s+/);
      const catalogWords = catalogLower.split(/\s+/);

      let hasWordMatch = false;
      for (const gWord of generatedWords) {
        for (const cWord of catalogWords) {
          if (gWord === cWord && gWord.length >= 3) {
            console.log(`✓ Word match found: "${gWord}" in "${generated}" ↔ "${catalog}"`);
            hasWordMatch = true;
            break;
          } else if (gWord.length >= 4 && cWord.length >= 4) {
            if (gWord.includes(cWord) || cWord.includes(gWord)) {
              console.log(`✓ Word containment match: "${gWord}" ↔ "${cWord}" in "${generated}" ↔ "${catalog}"`);
              hasWordMatch = true;
              break;
            }
          }
        }
        if (hasWordMatch) break;
      }

      if (hasWordMatch && !similarCategories.includes(catalog)) {
        similarCategories.push(catalog);
      }
    }
  }

  console.log('Final similar categories found:', similarCategories);
  console.log('=== End Word-Based Category Matching Debug ===\n');

  return similarCategories;
}

/**
 * Calculate a relevance score based on category matches and ratings
 * Now includes recency penalty for fair visibility
 */
function calculateCategoryMatchScore(
  merchantCategories: string[],
  requestCategories: string[],
  averageRating?: number,
  totalRatings?: number,
  lastMatchedAt?: string
): number {
  if (merchantCategories.length === 0 || requestCategories.length === 0) {
    return 0;
  }

  let score = 0;
  const merchantCategoriesLower = merchantCategories.map(cat => cat.toLowerCase());
  const requestCategoriesLower = requestCategories.map(cat => cat.toLowerCase());

  // Exact matches get highest score
  for (const requestCat of requestCategoriesLower) {
    if (merchantCategoriesLower.includes(requestCat)) {
      score += 100;
    }
  }

  // Containment matches get medium score
  for (const requestCat of requestCategoriesLower) {
    for (const merchantCat of merchantCategoriesLower) {
      if (requestCat !== merchantCat) {
        if ((requestCat.includes(merchantCat) && merchantCat.length >= 3) ||
          (merchantCat.includes(requestCat) && requestCat.length >= 3)) {
          score += 50;
        } else {
          const requestWords = requestCat.split(/\s+/);
          const merchantWords = merchantCat.split(/\s+/);

          for (const rWord of requestWords) {
            for (const mWord of merchantWords) {
              if (rWord === mWord && rWord.length >= 3) {
                score += 20;
              } else if (rWord.length >= 4 && mWord.length >= 4 &&
                (rWord.includes(mWord) || mWord.includes(rWord))) {
                score += 10;
              }
            }
          }
        }
      }
    }
  }

  // Semantic matches get extremely low score (1 point)
  // This is handled implicitly since semantic matches are added to the category list
  // but don't get high scores from exact/containment matching above

  // Normalize score by number of merchant categories to favor specialists
  let normalizedScore = score / Math.max(merchantCategories.length, 1);

  // Apply rating boost
  if (averageRating && totalRatings) {
    const ratingBoost = 1 + ((averageRating - 3) * 0.1);
    normalizedScore *= ratingBoost;

    if (totalRatings >= 5) {
      normalizedScore += 0.2;
    }
  }

  // Apply recency penalty for fair visibility
  if (lastMatchedAt) {
    const now = new Date();
    const lastMatched = new Date(lastMatchedAt);
    const hoursSinceLastMatch = (now.getTime() - lastMatched.getTime()) / (1000 * 60 * 60);

    // Apply penalty if matched within last 24 hours
    if (hoursSinceLastMatch < 24) {
      // Penalty ranges from 0.5 (just matched) to 1.0 (24 hours ago)
      const recencyPenalty = 0.5 + (hoursSinceLastMatch / 24) * 0.5;
      normalizedScore *= recencyPenalty;
      console.log(`Applied recency penalty to merchant: ${recencyPenalty.toFixed(2)} (${hoursSinceLastMatch.toFixed(1)} hours ago)`);
    }
  }

  return normalizedScore;
}

/**
 * Complete AI-powered merchant matching with ratings integration
 */
export async function findMerchantsForRequest(
  requestText: string,
  universityName: string,
  limit: number = 5
): Promise<MerchantMatchResult & {
  generatedCategories?: string[];
  matchedCategories?: string[];
  sellerCategories?: Record<string, string[]>;
}> {
  try {
    console.log('=== AI-Powered Merchant Matching ===');
    console.log('Request:', requestText);
    console.log('University:', universityName);

    const generationResult = await generateCategoriesFromRequest(requestText);

    if (!generationResult.success || generationResult.categories.length === 0) {
      console.log('No categories generated from request');
      return {
        merchants: [],
        success: true,
        generatedCategories: [],
        matchedCategories: [],
        sellerCategories: {}
      };
    }

    console.log('Generated categories from request:', generationResult.categories);

    const availableCategories = await fetchExistingCategories();
    console.log('Available categories in catalog:', availableCategories);

    const matchResult = await findSimilarCategoriesWithAI(generationResult.categories, availableCategories);

    if (!matchResult.success || matchResult.categories.length === 0) {
      console.log('No matching categories found in catalog');
      return {
        merchants: [],
        success: true,
        generatedCategories: generationResult.categories,
        matchedCategories: [],
        sellerCategories: {}
      };
    }

    console.log('Similar categories found in catalog:', matchResult.categories);

    const { merchants, sellerCategories } = await findMerchantsByCategories(matchResult.categories, universityName, generationResult.categories, limit);

    console.log('=== End AI-Powered Merchant Matching ===\n');

    return {
      merchants,
      success: true,
      generatedCategories: generationResult.categories,
      matchedCategories: matchResult.categories,
      sellerCategories
    };

  } catch (error) {
    console.error('Error in AI-powered merchant matching:', error);
    return {
      merchants: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      generatedCategories: [],
      matchedCategories: [],
      sellerCategories: {}
    };
  }
}

/**
 * Find merchants that have any of the specified categories, ranked by relevance and ratings
 */
async function findMerchantsByCategories(
  categoryNames: string[],
  universityName: string,
  originalRequestCategories: string[],
  limit: number = 5
): Promise<{
  merchants: MerchantWithCategories[];
  sellerCategories: Record<string, string[]>;
}> {
  try {
    if (categoryNames.length === 0) {
      return { merchants: [], sellerCategories: {} };
    }

    console.log('=== Merchant Search with Ratings Debug ===');
    console.log('Searching for categories:', categoryNames);
    console.log('University:', universityName);

    const { data: categories, error: categoryError } = await supabase
      .from('product_categories')
      .select('id, name')
      .in('name', categoryNames);

    if (categoryError) {
      console.error('Error fetching category IDs:', categoryError);
      return { merchants: [], sellerCategories: {} };
    }

    if (!categories || categories.length === 0) {
      console.log('No matching categories found in database');
      return { merchants: [], sellerCategories: {} };
    }

    console.log('Found matching categories in DB:', categories.map(c => c.name));

    const categoryIds = categories.map(cat => cat.id);

    // Get current date for billing check
    const currentDate = new Date().toISOString().split('T')[0];
    const { data: merchantCategories, error: merchantError } = await supabase
      .from('merchant_categories')
      .select(`
        merchant_id,
        product_categories!inner (
          name
        ),
        merchants!inner (
          id,
          seller_id,
          email,
          full_name,
          phone_number,
          school_name,
          seller_description,
          created_at,
          last_matched_at,
          average_rating,
          total_ratings,
          rating_breakdown,
          billing_date,
          is_billing_active
        )
      `)
      .in('category_id', categoryIds);

    if (merchantError) {
      console.error('Error fetching merchants by categories:', merchantError);
      return { merchants: [], sellerCategories: {} };
    }

    if (!merchantCategories || merchantCategories.length === 0) {
      console.log('No merchants found with matching categories');
      return { merchants: [], sellerCategories: {} };
    }

    console.log('Found merchant-category relationships:', merchantCategories.length);

    const merchantMap = new Map<string, MerchantWithCategories>();
    const sellerCategories: Record<string, string[]> = {};

    merchantCategories.forEach((item: any) => {
      const merchant = item.merchants;
      const categoryName = item.product_categories.name;

      // Skip merchants with due billing dates
      if (merchant.billing_date && merchant.billing_date <= currentDate && merchant.is_billing_active) {
        console.log(`Skipping merchant ${merchant.full_name} due to billing date: ${merchant.billing_date}`);
        return;
      }
      if (!merchantMap.has(merchant.id)) {
        merchantMap.set(merchant.id, {
          ...merchant,
          categories: [],
          categoryMatchScore: 0,
          average_rating: merchant.average_rating || 0,
          total_ratings: merchant.total_ratings || 0,
          rating_breakdown: merchant.rating_breakdown || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        });
        sellerCategories[merchant.seller_id] = [];
      }

      const existingMerchant = merchantMap.get(merchant.id)!;
      if (!existingMerchant.categories.includes(categoryName)) {
        existingMerchant.categories.push(categoryName);
        sellerCategories[merchant.seller_id].push(categoryName);
      }
    });

    const filteredMerchants = Array.from(merchantMap.values()).filter(merchant =>
      merchant.school_name === universityName
    );

    const merchants = filteredMerchants.map(merchant => {
      merchant.categoryMatchScore = calculateCategoryMatchScore(
        merchant.categories,
        originalRequestCategories,
        merchant.average_rating,
        merchant.total_ratings,
        merchant.last_matched_at
      );
      return merchant;
    });

    // Enhanced sorting with fair visibility considerations
    merchants.sort((a, b) => {
      const scoreA = a.categoryMatchScore || 0;
      const scoreB = b.categoryMatchScore || 0;

      // If scores are very close (within 10%), prioritize merchants who haven't been matched recently
      const scoreDifference = Math.abs(scoreA - scoreB);
      const averageScore = (scoreA + scoreB) / 2;
      const isCloseScore = averageScore > 0 && (scoreDifference / averageScore) < 0.1;

      if (isCloseScore) {
        // For close scores, prioritize merchants who haven't been matched recently
        const aLastMatched = a.last_matched_at ? new Date(a.last_matched_at).getTime() : 0;
        const bLastMatched = b.last_matched_at ? new Date(b.last_matched_at).getTime() : 0;

        // Merchants never matched (0) should come before recently matched merchants
        if (aLastMatched === 0 && bLastMatched > 0) return -1;
        if (bLastMatched === 0 && aLastMatched > 0) return 1;
        if (aLastMatched === 0 && bLastMatched === 0) {
          // Both never matched, fall back to other criteria
        } else {
          // Both have been matched, prioritize the one matched longer ago
          return aLastMatched - bLastMatched;
        }
      }
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      const ratingA = a.average_rating || 0;
      const ratingB = b.average_rating || 0;

      if (ratingA !== ratingB) {
        return ratingB - ratingA;
      }

      return a.categories.length - b.categories.length;
    });

    console.log('Ranked merchants with fair visibility:');
    merchants.forEach((merchant, index) => {
      const lastMatchedInfo = merchant.last_matched_at
        ? `Last matched: ${new Date(merchant.last_matched_at).toLocaleString()}`
        : 'Never matched';
      console.log(`${index + 1}. ${merchant.full_name} - Score: ${merchant.categoryMatchScore?.toFixed(2)}, Rating: ${merchant.average_rating}⭐ (${merchant.total_ratings}), ${lastMatchedInfo}`);
    });

    console.log('=== End Merchant Search with Fair Visibility ===\n');

    return {
      merchants: merchants.slice(0, limit),
      sellerCategories
    };

  } catch (error) {
    console.error('Error finding merchants by categories with fair visibility:', error);
    return { merchants: [], sellerCategories: {} };
  }
}

export async function extractProductInfoFromText(
  title: string,
  description: string
): Promise<ProductExtractionResult> {
  if (!genAI) {
    return {
      success: false,
      error: 'Gemini API key not configured'
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    }, { apiVersion: 'v1' });

    const prompt = `
Extract product information from the following title and description.

Title: "${title}"
Description: "${description}"

Requirements:
- Return a JSON object with these fields:
  - price: number (integer in NGN, null if not found)
  - location: string (concise location, null if not found)
  - category: string (1-3 words, null if not found)
  - contact_phone: string (phone number, null if not found)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = parseJSONResponse(response.text());

    return {
      price: typeof data.price === 'number' ? data.price : undefined,
      location: typeof data.location === 'string' ? data.location : undefined,
      category: typeof data.category === 'string' ? data.category : undefined,
      contact_phone: typeof data.contact_phone === 'string' ? data.contact_phone : undefined,
      success: true
    };

  } catch (error) {
    console.error('Error identifying product info with Gemini:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract price from hostel product post text
 */
export async function extractPriceFromHostelPost(description: string): Promise<number | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1' });

    const prompt = `
    Extract the price from this text. Return ONLY the number.
    If multiple prices, return the main product price.
    If no price, return null. 
    Ignore currency symbols like 'N', 'NGN', 'naira'.
    
    Text: "${description}"
    
    Response (number or null):
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (text.toLowerCase() === 'null') return null;

    const price = parseInt(text.replace(/[^0-9]/g, ''));
    return isNaN(price) ? null : price;
  } catch (error) {
    console.error('Error extracting price:', error);
    return null;
  }
}


export async function categorizePost(post: string, mode: string = 'store'): Promise<string> {
  if (!genAI) return 'others'

  const generativeModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1' });

  // const post_description = await transformDescriptionForEmbedding(post);


  let categories = [];
  if (mode === 'hostel') {

    categories = [
      'food & snacks',
      'clothing',
      'shoes',
      'caps',
      'gadgets',
      'phones',
      'jewelries',
      'bags',
      'fragrances',
      'beauty & skincare',
      'hair accessories',
      'others'
    ];
  } else {

    categories = [
      'bags',
      'fragrances',
      'health, beauty & personal care',
      'shoes',
      'jewelry & accessories',
      'home & kitchen',
      'others',
      'electronics & gadgets',
      'sports & fitness',
      'food & beverage',
      'clothing',
      'books & stationery',
      'caps & hats'
    ];
  }

  let categorizationPrompt = '';

  if (mode === 'hostel') {
    categorizationPrompt =
      `
    Analyze the following product description and categorize it into EXACTLY ONE of these categories: ${categories.join(', ')}.
    
    Return the result as a JSON object with a single key: "category" containing the chosen category string.
    
    Guidelines:
    - "food & snacks": Any edible items, beverages, food products
    - "clothing": Apparel items like shirts, pants, jeans, dresses, jackets (but NOT shoes, caps, or bags)
    - "shoes": Footwear of any kind, shoes, adidas shoes, nike shoes, puma shoes, converse shoes
    - "caps": Headwear, hats, caps
    - "gadgets": Electronic devices like laptops, tablets, smartwatches, cameras (but NOT phones)
    - "phones": Mobile phones, smartphones, cellphones
    - "jewelries": Accessories like rings, necklaces, earrings, bracelets, watches
    - "bags": Purses, backpacks, handbags, luggage
    - "others": Anything that doesn't fit the above categories

    Product Description: "${post}"

    Example output format:
    {
      "category": "shoes"
    }
    
    Return ONLY the JSON object, nothing else.
  `;
  } else {
    categorizationPrompt =
      `
    Analyze the following product description and categorize it into EXACTLY ONE of these categories: ${categories.join(', ')}.
    
    Return the result as a JSON object with a single key: "category" containing the chosen category string.
    
    Guidelines:
    - "food & beverages": Any edible items, beverages, food products
    - "clothing": Apparel items like shirts, pants, jeans, dresses, jackets (but NOT shoes, caps, or bags)
    - "shoes": Footwear of any kind
    - "caps": Headwear, hats, caps
    - "Electronics & Gadgets": Electronic devices like laptops, tablets, smartwatches, cameras, Mobile phones, smartphones, cellphones
    - "Jewelry & Accessories": Accessories like rings, necklaces, earrings, bracelets, watches
    - "bags": Purses, backpacks, handbags, luggage
    - "others": Anything that doesn't fit the above categories

    Product Description: "${post}"

    Example output format:
    {
      "category": "shoes"
    }
    
    Return ONLY the JSON object, nothing else.
  `;


  }

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: categorizationPrompt }] }]
    });

    const categorizationData = parseJSONResponse(result.response.text());
    console.log('Categorization result:', categorizationData.category);
    console.log('Available categories:', categories);
    // Validate that the returned category is in our list
    if (categorizationData.category && categories.includes(categorizationData.category.toLowerCase())) {
      return categorizationData.category.toLowerCase();
    } else {
      console.warn('Invalid category returned, defaulting to "others"');
      return 'others';
    }
  } catch (error) {
    console.error('Error categorizing post:', error);
    // Return 'others' as fallback in case of any error
    return 'others';
  }
}

export async function extractProductKeywordsFromDescription(description: string): Promise<string[]> {
  if (!genAI) return ['product'];

  const generativeModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1' });

  // Adjusted Prompt
  const extractionPrompt = `
    Analyze the following text, which can be a product post or a user search query. Your task is to extract a list of the most relevant and important search words or keywords that identify the *item or product itself*.

    **DO NOT** include:
    - Transactional words (e.g., selling, have, for sale, looking for).
    - Condition/Quality words (e.g., new, used, old, discount).
    - Price or currency information (e.g., 14k, 700k, naira, price).
    - Generic location terms (e.g., room 5, hostel, location).

    The keywords should focus ONLY on:
    1.  The primary **product** (e.g., "sneakers", "bread", "tops").
    2.  Any specific **brands** or **models** (e.g., "Gucci", "dell xps 13", "munchit").
    3.  A likely **category** if the product is generic (e.g., "laptop", "snacks").
    
    Return the result as a JSON object with a single key: "keywords" containing an array of strings.
    
    Text Description: "${description}"
    
    Example output for "I have a Gucci bag selling 14k":
    {
      "keywords": ["Gucci bag", "bag"]
    }

    Example output for "Im selling my new dell xps 13 for 700k":
    {
        "keywords": ["dell xps 13", "laptop"]
    }

    Example output for "I'm selling 200 naira bread and 500 naira bread at old hostel":
    {
        "keywords": ["bread", "food"]
    }
    
    Return ONLY the JSON object, nothing else. All keywords should be lowercased and single words or essential phrases.
  `;

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: extractionPrompt }] }]
    });

    const extractionData = parseJSONResponse(result.response.text());

    if (Array.isArray(extractionData.keywords)) {
      // Ensure all elements are strings and lowercased before returning
      return extractionData.keywords.map((word: unknown) =>
        String(word).trim().toLowerCase()
      );
    } else {
      console.warn('Could not extract keywords array, defaulting to ["product"]');
      return ['product'];
    }
  } catch (error) {
    console.error('Error extracting product keywords:', error);
    return ['product'];
  }
}
/**
 * Smartly determine if a product fits a specialized category title
 */
export async function smartMatchProductWithCategory(
  description: string,
  categoryTitle: string,
  price?: number | null
): Promise<boolean> {
  if (!genAI) return false;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1' });

    const prompt = `
    Determine if the following product fits into the specialized row titled "${categoryTitle}".
    
    Product Description: "${description}"
    ${price ? `Product Price: ${price} Naira` : ''}
    
    Row Title: "${categoryTitle}"
    
    Consider:
    1. Direct mentions of items that fit the title.
    2. Semantic relationships (e.g., "iPhone" fits "Gadgets").
    3. Price constraints mentioned in the Row Title (e.g., "Under 5k" should check the Product Price).
    4. Use your best judgment for vibe-based rows (e.g., "Friday Night" might include snacks or drinks).
    
    Return ONLY "YES" or "NO".
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().toUpperCase();

    return text.includes('YES');
  } catch (error) {
    console.error('Error in smartMatchProductWithCategory:', error);
    return false;
  }
}
