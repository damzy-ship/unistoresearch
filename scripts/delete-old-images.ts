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

async function cleanOldImages(bucket: string, folder: string) {
    console.log(`Scanning bucket: ${bucket}, folder: ${folder || 'root'}...`);
    let allFiles = [];
    let hasMore = true;
    let limit = 500;
    let offset = 0;

    while (hasMore) {
        const { data, error } = await supabase.storage.from(bucket).list(folder, {
            limit: limit,
            offset: offset,
        });

        if (error) {
            console.error(`Error listing ${bucket}/${folder}:`, error);
            break;
        }

        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            allFiles.push(...data);
            offset += data.length;
            if (data.length < limit) hasMore = false;
        }
    }

    // Filter out .jpg, .jpeg, .png files
    const filesToDelete = allFiles.filter(f => {
        // Skip subdirectories if they somehow get returned
        if (!f.id) return false;

        const name = f.name.toLowerCase();
        return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');
    }).map(f => folder ? `${folder}/${f.name}` : f.name);

    console.log(`Found ${filesToDelete.length} old original images to delete in ${bucket}/${folder || 'root'}.`);

    if (filesToDelete.length === 0) return;

    // Delete in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < filesToDelete.length; i += chunkSize) {
        const chunk = filesToDelete.slice(i, i + chunkSize);
        const { error } = await supabase.storage.from(bucket).remove(chunk);

        if (error) {
            console.error(`Error deleting chunk in ${bucket}:`, error);
        } else {
            console.log(`  - Deleted chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} items)...`);
        }
    }
}

async function runCleanup() {
    console.log("Starting cleanup of old chunky images...");
    // The previous script used these buckets and paths
    await cleanOldImages('product-images', 'product-images');
    await cleanOldImages('product-images', 'hostel-updates');
    await cleanOldImages('post_images', 'banners');

    console.log("\nCleanup successfully finished! Storage space freed.");
}

runCleanup();
