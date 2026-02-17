import { useState, useCallback, useMemo, useRef } from 'react';
import { supabase, HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';
import { getUserId } from '../useTracking';

const ITEMS_PER_PAGE = 40;

/**
 * Hook to manage the hostel product feed.
 * Handles fetching, filtering, and sorting (time-bucket logic).
 */
export function useHostelFeed(
    selectedSchoolId: string | null,
    selectedHostel: string,
    selectedCategory: string,
    showMyProducts: boolean,
    currentVisitor: UniqueVisitor | null
) {
    const [feed, setFeed] = useState<HostelsProductUpdates[]>([]);
    const [loadingFeed, setLoadingFeed] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState(true);

    // Use ref for page to prevent loadFeed from being recreated every time page increments
    const pageRef = useRef(0);
    const hasMoreRef = useRef(true);
    const loadingMoreRef = useRef(false);

    /**
     * Internal shuffle helper
     */
    const shuffle = <T,>(arr: T[]) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    };

    /**
     * Logic to order a batch of items
     */
    const orderBatch = (items: HostelsProductUpdates[]) => {
        if (items.length === 0) return [];

        const now = Date.now();
        const H = 60 * 60 * 1000;
        const bucketsA: HostelsProductUpdates[] = []; // <2 hours
        const bucketsB: HostelsProductUpdates[] = []; // 2-10 hours
        const bucketsC: HostelsProductUpdates[] = []; // 10-24 hours
        const bucketsD: HostelsProductUpdates[] = []; // 24h-72h
        const bucketsEByDay: Record<string, HostelsProductUpdates[]> = {};

        const safeDateMs = (d?: string | null) => {
            if (!d) return 0;
            const t = new Date(d).getTime();
            return Number.isNaN(t) ? 0 : t;
        };

        for (const item of items) {
            const createdMs = safeDateMs(item.created_at as unknown as string);
            const age = now - createdMs;

            if (!createdMs || age >= 3 * 24 * H) {
                const dayKey = createdMs ? new Date(createdMs).toISOString().split('T')[0] : 'unknown';
                bucketsEByDay[dayKey] = bucketsEByDay[dayKey] || [];
                bucketsEByDay[dayKey].push(item);
            } else if (age < 2 * H) {
                bucketsA.push(item);
            } else if (age < 10 * H) {
                bucketsB.push(item);
            } else if (age < 24 * H) {
                bucketsC.push(item);
            } else {
                bucketsD.push(item);
            }
        }

        const partA = shuffle(bucketsA);
        const partB = shuffle(bucketsB);
        const partC = shuffle(bucketsC);
        const partD = shuffle(bucketsD);

        const dayKeys = Object.keys(bucketsEByDay).filter(k => k !== 'unknown').sort().reverse();
        const partE: HostelsProductUpdates[] = [];
        for (const dayKey of dayKeys) {
            partE.push(...shuffle(bucketsEByDay[dayKey]));
        }
        if (bucketsEByDay['unknown']) partE.push(...shuffle(bucketsEByDay['unknown']));

        return [...partA, ...partB, ...partC, ...partD, ...partE];
    };

    /**
     * Fetches the feed data from Supabase.
     */
    const loadFeed = useCallback(async (
        schoolId: string | null = selectedSchoolId,
        isLoadMore: boolean = false
    ) => {
        console.log(`[useHostelFeed] Load attempt (schoolId: ${schoolId}, isLoadMore: ${isLoadMore}, page: ${pageRef.current})`);
        try {
            if (!isLoadMore) {
                setLoadingFeed(true);
                pageRef.current = 0;
                hasMoreRef.current = true;
                setHasMore(true);
            } else {
                if (!hasMoreRef.current || loadingMoreRef.current) return;
                setLoadingMore(true);
                loadingMoreRef.current = true;
            }

            await getUserId();

            const currentPage = isLoadMore ? pageRef.current + 1 : 0;
            const from = currentPage * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('hostel_product_updates')
                .select(`
                    id,
                    post_category,
                    post_description,
                    post_images,
                    created_at,
                    actual_user_id,
                    unique_visitors:actual_user_id !inner (
                        id,
                        full_name,
                        profile_picture,
                        phone_number,
                        room,
                        is_hostel_merchant,
                        hostel_id,
                        hostels (id, name, school_id),
                        schools (id, short_name),
                        brand_name,
                        school_id
                    ),
                    status,
                    post_type,
                    fulfilled,
                    price,
                    discount_price
                `, { count: 'exact' })
                .eq('post_type', 'update');

            // Apply Server-side filters
            if (schoolId) {
                // Filter by school: either user's school_id, or their hostel's school_id
                // Use foreignTable option for OR on joined columns
                query = query.or(`school_id.eq.${schoolId},hostels.school_id.eq.${schoolId}`, { foreignTable: 'unique_visitors' });
            }

            if (selectedHostel && selectedHostel !== 'all') {
                query = query.eq('unique_visitors.hostel_id', selectedHostel);
            }

            if (selectedCategory && selectedCategory !== 'all') {
                query = query.ilike('post_category', selectedCategory);
            }

            if (showMyProducts && currentVisitor?.id) {
                query = query.eq('actual_user_id', currentVisitor.id);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (!data || data.length < ITEMS_PER_PAGE) {
                hasMoreRef.current = false;
                setHasMore(false);
            }

            const mapped: HostelsProductUpdates[] = data.map((d: any) => ({
                id: d.id,
                post_description: d.post_description,
                post_images: Array.isArray(d.post_images) ? d.post_images : [],
                post_category: d.post_category ?? '',
                created_at: d.created_at,
                actual_user_id: d.actual_user_id,
                unique_visitors: d.unique_visitors,
                post_type: (d.post_type === 'request' ? 'request' : 'update') as 'request' | 'update',
                search_words: Array.isArray(d.search_words) ? d.search_words : [],
                fulfilled: d.fulfilled ?? null,
                status: d.status as 'open' | 'fulfilled' | 'cancelled' | 'hide' | undefined,
                price: d.price,
                discount_price: d.discount_price
            }));

            // If we want shuffling, we do it here per batch or just skip it if it's too much.
            // But let's keep it consistent: we just append.
            // If the user wants shuffling, it should probably be on the whole rendered list
            // but that causes the "jumping" the user complained about.
            // SO: WE DISABLE DYNAMIC SHUFFLING IN THE USEMEMO AND DO IT ONLY ONCE HERE.

            const orderedBatch = isLoadMore ? mapped : orderBatch(mapped);

            if (isLoadMore) {
                setFeed(prev => [...prev, ...orderedBatch]);
                pageRef.current = currentPage;
            } else {
                setFeed(orderedBatch);
            }
        } catch (e) {
            console.error('Failed to load feed', e);
        } finally {
            setLoadingFeed(false);
            setLoadingMore(false);
            loadingMoreRef.current = false;
        }
    }, [selectedSchoolId, selectedHostel, selectedCategory, showMyProducts, currentVisitor?.id]);

    const loadMore = useCallback(() => {
        loadFeed(selectedSchoolId, true);
    }, [loadFeed, selectedSchoolId]);

    /**
     * Filters the feed based on UI selections.
     * Since most filtering is now in SQL, we only handle access control/hide logic here.
     */
    const displayedFeed = useMemo(() => {
        return feed.filter((item) => {
            const isHidden = item.status === 'hide';
            if (isHidden) {
                const isAdmin = currentVisitor?.is_admin;
                const isOwner = currentVisitor?.id === item.actual_user_id;
                if (!isAdmin && !isOwner) return false;
            }
            return true;
        });
    }, [feed, currentVisitor?.id, currentVisitor?.is_admin]);

    /**
     * Final feed for display.
     */
    const orderedDisplayedFeed = useMemo(() => {
        return displayedFeed;
    }, [displayedFeed]);

    return {
        feed,
        loadingFeed,
        loadingMore,
        hasMore,
        setLoadingFeed,
        loadFeed,
        loadMore,
        displayedFeed,
        orderedDisplayedFeed,
        setFeed
    };
}
