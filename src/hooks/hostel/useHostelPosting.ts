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
    const handlePost = async (text: string, images: File[], request: boolean = false) => {
        if (!currentVisitor?.id) return;
        if (!text.trim() && images.length === 0) return;

        try {
            setPosting(true);
            const uploadedUrls = images.length > 0
                ? await Promise.all(
                    images.map((file) => uploadImageToSupabase(file, currentVisitor.id as string, 'product-images', 'hostel-updates'))
                )
                : [];

            const postCategory = await categorizePost(text.trim(), 'hostel');
            const postSearchWords = await extractProductKeywordsFromDescription(text.trim());
            const extractedPrice = await extractPriceFromHostelPost(text.trim());

            const { error: insertError } = await supabase
                .from('hostel_product_updates')
                .insert({
                    post_description: text.trim(),
                    post_images: uploadedUrls,
                    actual_user_id: currentVisitor.id,
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
