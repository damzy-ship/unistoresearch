import { useState } from 'react';
import { supabase, HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';
import { categorizePost, extractProductKeywordsFromDescription } from '../../lib/gemini';

/**
 * Hook to manage search functionality within the hostel page.
 */
export function useHostelSearch(
    currentVisitor: UniqueVisitor | null,
    selectedSchoolId: string | null,
    setLoadingFeed: (loading: boolean) => void,
    setPosting: (posting: boolean) => void
) {
    const [isSearchView, setIsSearchView] = useState(true);
    const [showImageSearchPrompt, setShowImageSearchPrompt] = useState(false);
    const [searchResults, setSearchResults] = useState<HostelsProductUpdates[] | null>(null);
    const [searchTerm, setSearchTerm] = useState<string | null>(null);

    const handleSearch = async (text: string) => {
        const q = text.trim();
        if (!q) return;

        try {
            setPosting(true);
            setLoadingFeed(true);

            const postCategory = await categorizePost(q, 'hostel');
            const postSearchWords = await extractProductKeywordsFromDescription(q);

            if (!postCategory) {
                console.warn('Could not determine post category for the query.');
                setSearchResults([]);
                setSearchTerm(q);
                return;
            }

            const { data, error } = await supabase
                .from('hostel_product_updates')
                .select(`
                    id,
                    post_category,
                    post_description,
                    post_images,
                    created_at,
                    actual_user_id,
                    unique_visitors:actual_user_id (
                        id,
                        full_name,
                        profile_picture,
                        phone_number,
                        room,
                        is_hostel_merchant,
                        hostel_id,
                        hostels (id, name, school_id),
                        schools (id, short_name),
                        brand_name
                    ),
                    status,
                    post_type,
                    fulfilled
                `)
                .eq('post_category', postCategory)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const list = (data || []) as unknown as HostelsProductUpdates[];

            // Filter results
            const filtered = list.filter((d) => {
                const schoolMatch = selectedSchoolId
                    ? (d.unique_visitors as UniqueVisitor | undefined)?.hostels?.school_id === selectedSchoolId
                    : true;

                const isHidden = d.status === 'hide';
                if (isHidden) {
                    const isAdmin = currentVisitor?.is_admin;
                    const isOwner = currentVisitor?.id === d.actual_user_id;
                    if (!isAdmin && !isOwner) return false;
                }
                return schoolMatch;
            });

            // Rank results by keyword match
            if (postSearchWords.length > 0) {
                const rankedResults = filtered.map(item => {
                    const itemSearchWords: string[] = Array.isArray(item.search_words) ? item.search_words : [];
                    let score = 0;

                    for (const queryWord of postSearchWords) {
                        const lowerQueryWord = queryWord.toLowerCase();
                        const matchFound = itemSearchWords.some(itemWord =>
                            itemWord.toLowerCase().includes(lowerQueryWord)
                        );
                        if (matchFound) score += 1;
                    }

                    return { ...item, score };
                });

                rankedResults.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return dateB - dateA;
                });

                const finalResults = rankedResults.map(item => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { score, ...rest } = item;
                    return rest as HostelsProductUpdates;
                });
                setSearchResults(finalResults);
            } else {
                setSearchResults(filtered);
            }

            setSearchTerm(q);
        } catch (e) {
            console.error('Search failed', e);
            setSearchResults([]);
            setSearchTerm(q);
        } finally {
            setPosting(false);
            setLoadingFeed(false);
        }
    };

    const handleClearSearch = () => {
        setSearchResults(null);
        setSearchTerm(null);
        // Additional reset logic might be needed in parent (e.g., reseting filters)
    };

    return {
        isSearchView,
        setIsSearchView,
        showImageSearchPrompt,
        setShowImageSearchPrompt,
        searchResults,
        setSearchResults,
        searchTerm,
        setSearchTerm,
        handleSearch,
        handleClearSearch
    };
}
