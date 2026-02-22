import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
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

async function processImages(tableName: string, urlColumn: string, isArray: boolean = true) {
    console.log(`\n\n--- Fetching from ${tableName} ---`);

    // Fetch records that have images
    const query = supabase
        .from(tableName)
        .select(`id, ${urlColumn}`)
        .not(urlColumn, 'is', null);

    if (isArray) {
        query.not(urlColumn, 'eq', '{}');
    } else {
        query.not(urlColumn, 'eq', '');
    }

    const { data: records, error } = await query;

    if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return;
    }

    if (!records || records.length === 0) {
        console.log(`No records with images found in ${tableName}.`);
        return;
    }

    console.log(`Found ${records.length} records to process in ${tableName}.\n`);

    let totalImagesProcessed = 0;
    let totalRecordsUpdated = 0;

    for (const record of records) {
        const imageUrls: string[] = isArray ? (record[urlColumn] || []) : [record[urlColumn]];
        let hasChanges = false;
        const newUrls: string[] = [];

        for (const url of imageUrls) {
            // Check if it's already a webp from our Supabase storage
            if (url && (url.includes('product-images') || url.includes('post_images')) && !url.toLowerCase().endsWith('.webp')) {
                console.log(`[Processing] Found uncompressed image:`);
                console.log(`Original: ${url}`);
                try {
                    // Determine bucket and file path
                    const bucketName = url.includes('post_images') ? 'post_images' : 'product-images';
                    const urlParts = url.split('/');
                    const fileNameObj = urlParts.slice(urlParts.indexOf(bucketName) + 1).join('/');

                    const { data: fileData, error: downloadError } = await supabase.storage
                        .from(bucketName)
                        .download(fileNameObj);

                    if (downloadError || !fileData) {
                        console.error(`  - Failed to download image ${fileNameObj}:`, downloadError);
                        newUrls.push(url); // Keep original if failed
                        continue;
                    }

                    const arrayBuffer = await fileData.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Compress and convert using sharp
                    const compressedBuffer = await sharp(buffer)
                        .resize({
                            width: 1920,
                            height: 1920,
                            fit: 'inside', // Maintain aspect ratio, shrink if larger
                            withoutEnlargement: true
                        })
                        .webp({ quality: 80 })
                        .toBuffer();

                    // Upload new WebP image
                    const newFileName = `${fileNameObj.split('.')[0]}_compressed.webp`;
                    const { error: uploadError } = await supabase.storage
                        .from(bucketName)
                        .upload(newFileName, compressedBuffer, {
                            contentType: 'image/webp',
                            upsert: true
                        });

                    if (uploadError) {
                        console.error(`  - Failed to upload compressed image ${newFileName}:`, uploadError);
                        newUrls.push(url);
                        continue;
                    }

                    // Get the new public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(newFileName);

                    newUrls.push(publicUrl);
                    hasChanges = true;
                    totalImagesProcessed++;

                    console.log(`New WebP: ${publicUrl}`);

                    // Try to delete old image (optional, but good for cleanup)
                    /*
                    const { error: removeError } = await supabase.storage
                        .from(bucketName)
                        .remove([fileNameObj]);
                        
                    if(removeError) {
                        console.warn(`  - Warning: Failed to clean up old image ${fileNameObj}`, removeError.message);
                    } else {
                        console.log(`  - Successfully compressed and replaced.`);
                    }
                    */
                } catch (e) {
                    console.error(`  - Unexpected error processing ${url}:`, e);
                    newUrls.push(url);
                }
            } else {
                // If it's already webp or external, string keep as is
                if (url) newUrls.push(url);
            }
        }

        // Update the database record if we made changes
        if (hasChanges) {
            const finalValue = isArray ? newUrls : newUrls[0];
            const { error: updateError } = await supabase
                .from(tableName)
                .update({ [urlColumn]: finalValue })
                .eq('id', record.id);

            if (updateError) {
                console.error(`Failed to update ${tableName} ${record.id} in DB:`, updateError);
            } else {
                console.log(`✓ Updated ${tableName} ${record.id} in database to point to the new WebP versions.`);
                totalRecordsUpdated++;
            }
        }
    }

    console.log(`\nFinished! Processed ${totalImagesProcessed} images across ${totalRecordsUpdated} records in ${tableName}.`);
}

async function runAll() {
    await processImages('merchant_products', 'image_urls', true);
    await processImages('hostel_product_updates', 'post_images', true);
    await processImages('school_banners', 'image_url', false);
    console.log('\nAll bulk compression tasks completed!');
}

runAll();
