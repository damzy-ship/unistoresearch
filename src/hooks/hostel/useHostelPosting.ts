import { useState } from 'react';
import { supabase, UniqueVisitor } from '../../lib/supabase';
import { uploadImageToSupabase } from '../../lib/databaseServices';
import { categorizePost, extractProductKeywordsFromDescription, extractPriceFromHostelPost } from '../../lib/gemini';
import { sendMassVendorNotification } from '../../lib/brevoService';

/**
 * Hook to manage posting updates and requests.
 */
export function useHostelPosting(
    currentVisitor: UniqueVisitor | null,
    reloadFeed: () => Promise<void>
) {
    const [posting, setPosting] = useState(false);

    /**
     * Handles the creation of a new post or request.
     */
    const handlePost = async (text: string, images: File[], request: boolean = false, merchantId?: string, selectedCategory?: string) => {
        if (!currentVisitor?.id) return;
        if (!text.trim() && !selectedCategory && images.length === 0) return;

        try {
            setPosting(true);

            // ... (timeout wrapper implementation remains the same)
            const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
                let timeoutId: any;
                const timeoutPromise = new Promise<T>((resolve) => {
                    timeoutId = setTimeout(() => {
                        console.warn(`[HostelPost] Operation timed out after ${timeoutMs}ms, using fallback.`);
                        resolve(fallback);
                    }, timeoutMs);
                });
                try {
                    const result = await Promise.race([promise, timeoutPromise]);
                    return result;
                } finally {
                    clearTimeout(timeoutId);
                }
            };

            const uploadedUrls = images.length > 0
                ? await Promise.all(
                    images.map((file) => uploadImageToSupabase(file, currentVisitor.id as string, 'product-images', 'hostel-updates'))
                )
                : [];

            // Bypass AI categorization if a manual category is selected
            let postCategory = selectedCategory;
            if (!postCategory) {
                // Wrap Gemini AI calls with 10s timeout
                postCategory = await withTimeout(categorizePost(text.trim(), 'hostel'), 10000, 'others');
            }

            const postSearchWords = await withTimeout(extractProductKeywordsFromDescription(text.trim() || postCategory || ''), 10000, ['product']);
            const extractedPrice = await withTimeout(extractPriceFromHostelPost(text.trim()), 10000, null);

            // Use provided merchantId or fall back to current visitor's ID
            const posterId = merchantId || currentVisitor.id;

            // If text is empty but category is selected, use category name as description
            const finalDescription = text.trim() || (postCategory ? `[${postCategory.charAt(0).toUpperCase() + postCategory.slice(1)}]` : '');

            // Special Category Tagging Logic
            let specialCatIds: string[] = [];
            try {
                const schoolId = currentVisitor.school_id || currentVisitor.hostels?.school_id;
                if (schoolId) {
                    const { data: activeSpecialCats } = await supabase
                        .from('hostel_special_categories')
                        .select('*')
                        .eq('school_id', schoolId)
                        .eq('is_active', true);

                    if (activeSpecialCats && activeSpecialCats.length > 0) {
                        const { getTaggedSpecialCategoryIds } = await import('../../lib/databaseServices');
                        const { smartMatchProductWithCategory } = await import('../../lib/gemini');

                        // 1. Get standard rule matches (Price, Category, Keyword)
                        specialCatIds = getTaggedSpecialCategoryIds(
                            { post_description: finalDescription, price: extractedPrice, post_category: postCategory || 'others' },
                            activeSpecialCats
                        );

                        // 2. Get AI (Smart) rule matches in parallel
                        // Only for categories that weren't ALREADY matched by heuristics in step 1
                        const aiCategories = activeSpecialCats.filter(c =>
                            c.rule_type === 'ai' && !specialCatIds.includes(c.id)
                        );

                        if (aiCategories.length > 0) {
                            const aiMatches = await Promise.all(
                                aiCategories.map(async (cat) => {
                                    const isMatch = await smartMatchProductWithCategory(finalDescription, cat.title, extractedPrice);
                                    return isMatch ? cat.id : null;
                                })
                            );

                            // Add AI results to the list
                            aiMatches.forEach(id => {
                                if (id && !specialCatIds.includes(id)) {
                                    specialCatIds.push(id);
                                }
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('[HostelPost] Special category tagging failed:', err);
            }

            const { error: insertError } = await supabase
                .from('hostel_product_updates')
                .insert({
                    post_description: finalDescription,
                    post_images: uploadedUrls,
                    actual_user_id: posterId,
                    post_category: postCategory || 'others',
                    search_words: postSearchWords,
                    post_type: request ? 'request' : 'update',
                    fulfilled: request ? false : null,
                    price: extractedPrice,
                    special_category_ids: specialCatIds,
                    status: 'open'
                });

            if (insertError) throw insertError;

            console.log(`[HostelPost] Request successfully logged to Database for user: ${currentVisitor.id}`);

            if (request) {
                console.log(`[HostelPost] Post is a REQUEST. Triggering mass notification logic...`);
                const schoolName = currentVisitor.schools?.name || currentVisitor.hostels?.schools?.name ||
                    currentVisitor.schools?.short_name || currentVisitor.hostels?.schools?.short_name || 'N/A';

                sendMassVendorNotification({
                    university: schoolName,
                    request_text: finalDescription
                }).then(() => {
                    console.log(`[HostelPost] Notification dispatch attempt finished for: ${schoolName}`);
                });
            } else {
                console.log(`[HostelPost] Post is a regular UPDATE. No notification sent.`);
            }

            await reloadFeed();
        } catch (e) {
            console.error('Failed to post update', e);
            throw e; // RE-THROW so caller knows it failed
        } finally {
            setPosting(false);
        }
    };

    return {
        posting,
        setPosting,
        handlePost
    };
}
