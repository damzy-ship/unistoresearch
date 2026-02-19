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
    const handlePost = async (text: string, images: File[], request: boolean = false, merchantId?: string) => {
        if (!currentVisitor?.id) return;
        if (!text.trim() && images.length === 0) return;

        try {
            setPosting(true);

            // Timeout wrapper for AI calls to prevent hanging forever
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

            // Wrap Gemini AI calls with 10s timeout
            const postCategory = await withTimeout(categorizePost(text.trim(), 'hostel'), 10000, 'others');
            const postSearchWords = await withTimeout(extractProductKeywordsFromDescription(text.trim()), 10000, ['product']);
            const extractedPrice = await withTimeout(extractPriceFromHostelPost(text.trim()), 10000, null);

            // Use provided merchantId or fall back to current visitor's ID
            const posterId = merchantId || currentVisitor.id;

            const { error: insertError } = await supabase
                .from('hostel_product_updates')
                .insert({
                    post_description: text.trim(),
                    post_images: uploadedUrls,
                    actual_user_id: posterId,
                    post_category: postCategory,
                    search_words: postSearchWords,
                    post_type: request ? 'request' : 'update',
                    fulfilled: request ? false : null,
                    price: extractedPrice
                });

            if (insertError) throw insertError;

            console.log(`[HostelPost] Request successfully logged to Database for user: ${currentVisitor.id}`);

            if (request) {
                console.log(`[HostelPost] Post is a REQUEST. Triggering mass notification logic...`);
                const schoolName = currentVisitor.schools?.name || currentVisitor.hostels?.schools?.name ||
                    currentVisitor.schools?.short_name || currentVisitor.hostels?.schools?.short_name || 'N/A';

                sendMassVendorNotification({
                    university: schoolName,
                    request_text: text.trim()
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
