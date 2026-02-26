import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCategories() {
    console.log("--- Analyzing Categories in hostel_product_updates ---\n");

    const { data: records, error } = await supabase
        .from('hostel_product_updates')
        .select('post_description, post_category');

    if (error) {
        console.error("Error fetching records:", error);
        return;
    }

    if (!records || records.length === 0) {
        console.log("No records found.");
        return;
    }

    const categoryCounts: Record<string, number> = {};
    const uncategorizedSamples: string[] = [];

    records.forEach(record => {
        const cat = record.post_category || 'NULL';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        if (cat === 'NULL' || cat === 'others') {
            if (uncategorizedSamples.length < 20) {
                uncategorizedSamples.push(record.post_description || '(No description)');
            }
        }
    });

    console.log("Category Distribution:");
    Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
            console.log(`- ${cat}: ${count}`);
        });

    console.log("\nSamples of Uncategorized/Others Descriptions:");
    uncategorizedSamples.forEach((desc, i) => {
        console.log(`${i + 1}. ${desc.substring(0, 100)}${desc.length > 100 ? '...' : ''}`);
    });
}

analyzeCategories();
