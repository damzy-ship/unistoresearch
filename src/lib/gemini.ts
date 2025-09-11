import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import { fetchExistingCategories } from './categoryService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY not found. Category generation will be disabled.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface CategoryGenerationResult {
  categories: string[];
  success: boolean;
  error?: string;
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
Based on the following seller description, generate relevant product categories that this seller might offer.

Seller Description: "${sellerDescription}"

Requirements:
- Return ONLY a JSON array of strings
- Each category should be 1-3 words maximum
- Categories should be general product types (e.g., "Electronics", "Clothing", "Books", "Food Items")
- Maximum 5 categories
- Use title case (e.g., "Mobile Phones" not "mobile phones")
- Be specific but not overly narrow
- Don't generate categories to general like accessories, rather be more specific like, hair accessories, tech accessories, fashion accessories.

Example response format:
["Electronics", "Mobile Accessories", "Gadgets"]

Generate categories now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else if (text.startsWith('```') && text.endsWith('```')) {
      jsonText = text.slice(3, -3).trim();
    }

    // Try to parse the JSON response
    let categories: string[];
    try {
      categories = JSON.parse(jsonText);
      
      if (!Array.isArray(categories) || !categories.every(cat => typeof cat === 'string')) {
        throw new Error('Invalid response format');
      }
      
      categories = categories
        .map(cat => cat.trim()) 
        .filter(cat => cat.length > 0)
        .slice(0, 5);
        
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', jsonText);
      return {
        categories: [],
        success: false,
        error: 'Failed to parse AI response'
      };
    }

    return {
      categories,
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
You are a product categorization expert. Given a user's product request, generate the most likely product categories that would contain the items they're looking for.

User Request: "${requestText}"

Requirements:
- Return ONLY a JSON array of category names that represent what the user is looking for
- Generate categories based on the request content, not from any predefined list
- Maximum 5 categories
- Each category should be 1-3 words maximum
- Use title case (e.g., "Mobile Phones" not "mobile phones")
- Be specific and relevant to the request
- Order by relevance (most relevant first)
- If the request is unclear or inappropriate, return an empty array
- Don't generate categories to general like accessories, rather be more specific like, hair accessories, tech accessories, fashion accessories.

Example response format:
For request "I need a laptop for school":
["Laptops", "Electronics", "Computers"]

Generate categories for this request:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else if (text.startsWith('```') && text.endsWith('```')) {
      jsonText = text.slice(3, -3).trim();
    }

    // Try to parse the JSON response
    let categories: string[];
    try {
      categories = JSON.parse(jsonText);
      
      if (!Array.isArray(categories) || !categories.every(cat => typeof cat === 'string')) {
        throw new Error('Invalid response format');
      }
      
      categories = categories
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0)
        .slice(0, 5);
        
    } catch (parseError) {
      console.error('Failed to parse Gemini response for category generation:', jsonText);
      return {
        categories: [],
        success: false,
        error: 'Failed to parse AI response'
      };
    }

    return {
      categories,
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
You are a semantic matching expert. Given generated categories and a catalog of existing categories, find semantic matches.

Generated Categories: ${JSON.stringify(generatedCategories)}
Catalog Categories: ${JSON.stringify(catalogCategories)}

Find categories from the catalog that are semantically similar to the generated categories, even if they don't share exact words.

Requirements:
- Return ONLY a JSON array of category names from the catalog
- Only include categories that are semantically related but NOT exact word matches
- Maximum 3 semantic matches
- Focus on conceptual similarity (e.g., "Laptops" might semantically match "Computing Equipment")
- Be conservative - only include strong semantic relationships

Example:
Generated: ["Laptops"]
Catalog: ["Computing Equipment", "Tech Gadgets", "Office Supplies", "Books"]
Response: ["Computing Equipment", "Tech Gadgets"]

Return semantic matches:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    let jsonText = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else if (text.startsWith('```') && text.endsWith('```')) {
      jsonText = text.slice(3, -3).trim();
    }

    let semanticMatches: string[];
    try {
      semanticMatches = JSON.parse(jsonText);
      
      if (!Array.isArray(semanticMatches) || !semanticMatches.every(cat => typeof cat === 'string')) {
        return [];
      }
      
      // Validate that returned categories exist in catalog
      semanticMatches = semanticMatches.filter(match => catalogCategories.includes(match));
      
    } catch (parseError) {
      console.error('Failed to parse semantic matching response:', jsonText);
      return [];
    }

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
Extract product information from the following title and description. Return ONLY a JSON object with the extracted information.

Title: "${title}"
Description: "${description}"

Requirements:
- Return ONLY a JSON object with these fields:
  - price: number (extract price in NGN, if mentioned)
  - location: string (extract location if mentioned, e.g., "Campus Hostel", "Block A")
  - category: string (extract product category, e.g., "Electronics", "Clothing", "Books")
  - contact_phone: string (extract phone number if mentioned)

- If a field is not found, set it to null
- Price should be a number (remove currency symbols)
- Category should be 1-3 words maximum
- Location should be specific but concise
- Phone should be in format like "+234..." or "080..."

Example response format:
{
  "price": 50000,
  "location": "Campus Hostel Block A",
  "category": "Electronics",
  "contact_phone": null
}

Extract information now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else if (text.startsWith('```') && text.endsWith('```')) {
      jsonText = text.slice(3, -3).trim();
    }

    // Parse JSON response
    const extractedData = JSON.parse(jsonText);

    return {
      price: extractedData.price || null,
      location: extractedData.location || null,
      category: extractedData.category || null,
      contact_phone: extractedData.contact_phone || null,
      success: true
    };
  } catch (error) {
    console.error('Error extracting product info with Gemini:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract product information'
    };
  }
}