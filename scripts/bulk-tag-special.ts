import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getTaggedSpecialCategoryIds } from '../src/lib/databaseServices.ts';
import { smartMatchProductWithCategory } from '../src/lib/gemini.ts';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runBulkTagging(dryRun = true) {
    console.log(`[bulk-tag-special] Starting tagging process (${dryRun ? 'DRY RUN' : 'LIVE UPDATE'})...`);

    // 1. Fetch active special categories
    const { data: categories, error: catError } = await supabase
        .from('hostel_special_categories')
        .select('*')
        .eq('is_active', true);

    if (catError) {
        console.error('Error fetching categories:', catError);
        return;
    }
    console.log(`Found ${categories?.length || 0} active special categories.`);

    // 2. Fetch all open products
    const { data: products, error: prodError } = await supabase
        .from('hostel_product_updates')
        .select('id, post_description, price, post_category, special_category_ids')
        .or('status.eq.open,status.is.null');

    if (prodError) {
        console.error('Error fetching products:', prodError);
        return;
    }
    console.log(`Loaded ${products?.length || 0} open products.`);

    let updateCount = 0;

    for (const product of products) {
        const newSpecialCategoryIds = getTaggedSpecialCategoryIds(
            {
                post_description: product.post_description || '',
                price: product.price ? Number(product.price) : null,
                post_category: product.post_category || 'others'
            },
            categories || []
        );

        // 2.1 Handle AI Matches (Smart Tagging)
        const aiCategories = (categories || []).filter(c => c.rule_type === 'ai');
        for (const cat of aiCategories) {
            // Check if it already has this tag (either matched by heuristics or already in DB)
            const isAlreadyMatched = newSpecialCategoryIds.includes(cat.id);
            const hasTagInDB = product.special_category_ids?.includes(cat.id);

            if (!isAlreadyMatched && !hasTagInDB) {
                try {
                    console.log(`[AI] Checking product ${product.id} against "${cat.title}"...`);
                    await delay(1500); // Wait 1.5s to avoid 429
                    const isMatch = await smartMatchProductWithCategory(product.post_description || '', cat.title, product.price ? Number(product.price) : null);
                    if (isMatch) {
                        console.log(`[AI MATCH] Product ${product.id} matches "${cat.title}"`);
                        newSpecialCategoryIds.push(cat.id);
                    }
                } catch (err: any) {
                    if (err.status === 429) {
                        console.warn('[AI] Rate limit hit. Waiting 20s...');
                        await delay(20000);
                        // Retry once
                        const isMatch = await smartMatchProductWithCategory(product.post_description || '', cat.title, product.price ? Number(product.price) : null);
                        if (isMatch) newSpecialCategoryIds.push(cat.id);
                    } else {
                        console.error(`[AI] Error matching product ${product.id}:`, err);
                    }
                }
            } else {
                // Keep existing tag if it's already there
                if (!newSpecialCategoryIds.includes(cat.id)) {
                    newSpecialCategoryIds.push(cat.id);
                }
            }
        }

        const currentIds = product.special_category_ids || [];
        const modified = JSON.stringify([...newSpecialCategoryIds].sort()) !== JSON.stringify([...currentIds].sort());

        if (modified) {
            updateCount++;
            if (!dryRun) {
                const { error: updateError } = await supabase
                    .from('hostel_product_updates')
                    .update({ special_category_ids: newSpecialCategoryIds })
                    .eq('id', product.id);

                if (updateError) {
                    console.error(`Failed to update product ${product.id}:`, updateError);
                } else {
                    console.log(`[MATCH] Updated product ${product.id} with ${newSpecialCategoryIds.length} tags.`);
                }
            } else {
                console.log(`[DRY RUN] Would update product ${product.id} with ${newSpecialCategoryIds.length} tags.`);
            }
        }
    }

    console.log(`\n\nSummary: 
    - Total Products Scanned: ${products.length}
    - Products Needing Updates: ${updateCount}
    - Status: ${dryRun ? 'COMPLETED (NO CHANGES MADE)' : 'COMPLETED (LIVE)'}`);
}

const isLive = process.argv.includes('--run');
runBulkTagging(!isLive).catch(console.error);
