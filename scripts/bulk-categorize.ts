import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

// Categories from gemini.ts (hostel mode)
const hostelCategories = [
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

interface KeywordMap {
    [category: string]: string[];
}

const categoryKeywordMap: KeywordMap = {
    'food & snacks': ['bread', 'food', 'snack', 'peanut', 'coconut', 'eat', 'delicious', 'tasty', 'crunch', 'cake', 'drink', 'beverage', 'rice', 'beans', 'noodles', 'yam', 'garri', 'soup', 'meat'],
    'clothing': ['top', 'skirt', 'dress', 'shirt', 'pants', 'trousers', 'jeans', 'jacket', 'hoodie', 'gown', 'lace', 'socks', 'outfit', 'clothing', 'wear', 't-shirt', 'tee', 'knitted'],
    'shoes': ['shoe', 'sneaker', 'loafer', 'heels', 'flat', 'slippers', 'crocs', 'footwear', 'sandal', 'boots'],
    'caps': ['cap', 'hat', 'beanie', 'beret'],
    'gadgets': ['laptop', 'tablet', 'ipad', 'watch', 'smartwatch', 'camera', 'monitor', 'keyboard', 'mouse', 'tech', 'dell', 'xps', 'macbook', 'charger', 'powerbank', 'earbud', 'headphone'],
    'phones': ['phone', 'iphone', 'samsung', 'android', 'smartphone', 'cellphone'],
    'jewelries': ['necklace', 'ring', 'earring', 'bracelet', 'jewelry', 'gold', 'silver', 'rosary', 'hoop', 'pendant', 'glasses', 'frame', 'watch', 'bangle', 'chain'],
    'bags': ['bag', 'backpack', 'purse', 'handbag', 'luggage', 'pouch', 'tote', 'clutch'],
    'fragrances': ['perfume', 'spray', 'fragrance', 'cologne', 'scent', 'body mist', 'deodorant', 'roll-on'],
    'beauty & skincare': ['beauty', 'skin', 'soap', 'cream', 'lotion', 'nails', 'lashes', 'cosmetics', 'makeup', 'oil', 'body butter', 'scrub'],
    'hair accessories': ['hair', 'wig', 'attachment', 'closure', 'headband', 'scrunchie', 'gel', 'braids', 'bonnet']
};

/**
 * Robustly parse JSON from AI response
 */
function parseJSONResponse(text: string): any {
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            try { return JSON.parse(jsonMatch[1]); } catch (e2) { }
        }
        const startIdx = Math.min(
            text.indexOf('{') === -1 ? Infinity : text.indexOf('{'),
            text.indexOf('[') === -1 ? Infinity : text.indexOf('[')
        );
        const endIdx = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
        if (startIdx !== Infinity && endIdx !== -1 && endIdx > startIdx) {
            try { return JSON.parse(text.substring(startIdx, endIdx + 1)); } catch (e3) { }
        }
        return null;
    }
}

async function categorizeWithAI(description: string): Promise<string> {
    if (!genAI) return 'others';

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1' });
        const prompt = `
            Analyze the following product description and categorize it into EXACTLY ONE of these categories: ${hostelCategories.join(', ')}.
            
            Return ONLY a JSON object: {"category": "chosen_category"}.
            
            Product Description: "${description}"
        `;
        const result = await model.generateContent(prompt);
        const data = parseJSONResponse(result.response.text());
        return (data?.category || 'others').toLowerCase();
    } catch (error) {
        return 'others';
    }
}

function categorizeWithKeywords(description: string): string | null {
    const descLower = description.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywordMap)) {
        for (const keyword of keywords) {
            // Check for whole word match to avoid partial matches like "laces" in "lace"
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(descLower)) {
                return category;
            }
        }
    }
    return null;
}

async function runCleanup() {
    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) {
        console.log("🚀 DRY RUN MODE ENABLED - No database changes will be made.\n");
    }

    console.log("--- Starting Bulk Categorization Cleanup ---\n");

    // Fetch records that need categorization
    const { data: records, error } = await supabase
        .from('hostel_product_updates')
        .select('id, post_description, post_category')
        .or('post_category.is.null, post_category.eq.others');

    if (error) {
        console.error("❌ Error fetching records:", error);
        return;
    }

    if (!records || records.length === 0) {
        console.log("✅ All records are already categorized.");
        return;
    }

    console.log(`🔍 Found ${records.length} records to process.\n`);

    let updatedCount = 0;
    let keywordMatches = 0;
    let aiMatches = 0;
    let skippedCount = 0;

    for (const record of records) {
        const desc = record.post_description || '';
        if (!desc.trim()) {
            console.log(`[ID: ${record.id}] ⚠️  Empty description, skipping.`);
            skippedCount++;
            continue;
        }

        let finalCategory = categorizeWithKeywords(desc);
        let method = 'KEYWORDS';

        if (!finalCategory) {
            finalCategory = await categorizeWithAI(desc);
            method = 'GEMINI AI';
            aiMatches++;
        } else {
            keywordMatches++;
        }

        console.log(`[ID: ${record.id}] 📝 Method: ${method}`);
        console.log(`   Desc: "${desc.substring(0, 80)}${desc.length > 80 ? '...' : ''}"`);
        console.log(`   Result: ${finalCategory.toUpperCase()}`);

        if (!isDryRun && finalCategory !== 'others') {
            const { error: updateError } = await supabase
                .from('hostel_product_updates')
                .update({ post_category: finalCategory })
                .eq('id', record.id);

            if (updateError) {
                console.error(`   ❌ Failed to update:`, updateError.message);
            } else {
                console.log(`   ✅ Database updated.`);
                updatedCount++;
            }
        } else if (isDryRun) {
            console.log(`   ❕ Dry run: Record would have been updated to ${finalCategory}.`);
        }

        console.log(""); // Spacer
    }

    console.log("--- Cleanup Process Finished ---");
    console.log(`📊 Summary:`);
    console.log(`- Total Processed: ${records.length}`);
    console.log(`- Keyword Matches: ${keywordMatches}`);
    console.log(`- AI Fallback Matches: ${aiMatches}`);
    console.log(`- Skipped: ${skippedCount}`);
    if (!isDryRun) {
        console.log(`- Database Records Updated: ${updatedCount}`);
    } else {
        console.log(`- Dry Run: No records modified.`);
    }
}

runCleanup();
