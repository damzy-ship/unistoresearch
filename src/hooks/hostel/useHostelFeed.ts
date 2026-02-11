import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase, HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';
import { getUserId } from '../useTracking';

/**
 * Hook to manage the hostel product feed.
 * Handles fetching, filtering, and sorting (time-bucket logic).
 */
export function useHostelFeed(
    selectedSchoolId: string | null,
    selectedHostel: string,
    selectedCategory: string,
    myProductsActive: boolean,
    currentVisitor: UniqueVisitor | null
) {
    const [feed, setFeed] = useState<HostelsProductUpdates[]>([]);
    const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

    /**
     * Fetches the feed data from Supabase.
     */
    const loadFeed = useCallback(async (schoolId: string | null = selectedSchoolId) => {
        console.log('Loading feed for school ID:', schoolId);
        try {
            getUserId(); // Ensure user tracking
            setLoadingFeed(true);

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
                    fulfilled,
                    price,
                    discount_price
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            type RawUpdate = {
                id: string;
                post_description: string;
                post_images: string[];
                post_category?: string | null;
                created_at: string;
                actual_user_id: string;
                unique_visitors?: UniqueVisitor;
                post_type?: string | null;
                search_words?: string[] | null;
                fulfilled?: boolean | null;
                status?: string | null;
                price?: number | null;
                discount_price?: number | null;
            };

            const rawList: RawUpdate[] = (data || []) as RawUpdate[];

            // Filter by school if selected
            const filteredBySchool = (schoolId
                ? rawList.filter((d) => {
                    const uv = d.unique_visitors as UniqueVisitor | undefined;
                    return (uv?.schools?.id === schoolId && d.post_type === 'request') || (uv?.hostels?.school_id === schoolId);
                })
                : rawList);

            const mapped: HostelsProductUpdates[] = filteredBySchool.map((d) => ({
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

            setFeed(mapped);
        } catch (e) {
            console.error('Failed to load feed', e);
        } finally {
            setLoadingFeed(false);
        }
    }, [selectedSchoolId]);

    /**
     * Filters the feed based on UI selections (hostel, category, my products).
     */
    const displayedFeed = useMemo(() => {
        let filtered = feed.filter((item) => {
            const visitor = item.unique_visitors as UniqueVisitor | undefined;
            // Requests should be visible regardless of selected hostel
            const matchesHostel = selectedHostel === 'all' || !selectedHostel
                ? true
                : item.post_type === 'request'
                    ? true
                    : visitor?.hostel_id === selectedHostel || visitor?.hostels?.id === selectedHostel;

            const matchesCategory = selectedCategory === 'all' || !selectedCategory
                ? true
                : (item.post_category || '').toLowerCase() === selectedCategory.toLowerCase();

            const isHidden = item.status === 'hide';
            if (isHidden) {
                const isAdmin = currentVisitor?.is_admin;
                const isOwner = currentVisitor?.id === item.actual_user_id;
                if (!isAdmin && !isOwner) return false;
            }

            return matchesHostel && matchesCategory;
        });

        if (myProductsActive && currentVisitor?.id) {
            filtered = filtered.filter((item) => item.actual_user_id === currentVisitor.id);
        }

        return filtered;
    }, [feed, selectedHostel, selectedCategory, myProductsActive, currentVisitor?.id]);

    /**
     * Sorts the feed into time buckets and shuffles them for freshness.
     */
    const orderedDisplayedFeed = useMemo(() => {
        if (!displayedFeed || displayedFeed.length === 0) return [] as HostelsProductUpdates[];

        const now = Date.now();
        const H = 60 * 60 * 1000;
        const bucketsA: HostelsProductUpdates[] = []; // <2 hours
        const bucketsB: HostelsProductUpdates[] = []; // 2-10 hours
        const bucketsC: HostelsProductUpdates[] = []; // 10-24 hours
        const bucketsD: HostelsProductUpdates[] = []; // 24h-72h
        const bucketsEByDay: Record<string, HostelsProductUpdates[]> = {}; // >=72h grouped by day

        const safeDateMs = (d?: string | null) => {
            if (!d) return 0;
            const t = new Date(d).getTime();
            return Number.isNaN(t) ? 0 : t;
        };

        for (const item of displayedFeed) {
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

        const partA = shuffle(bucketsA);
        const partB = shuffle(bucketsB);
        const partC = shuffle(bucketsC);
        const partD = shuffle(bucketsD);

        const dayKeys = Object.keys(bucketsEByDay).filter(k => k !== 'unknown');
        dayKeys.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

        const partE: HostelsProductUpdates[] = [];
        for (const dayKey of dayKeys) {
            const group = bucketsEByDay[dayKey] || [];
            const shuffledGroup = shuffle(group);
            partE.push(...shuffledGroup);
        }

        if (bucketsEByDay['unknown']) {
            partE.push(...shuffle(bucketsEByDay['unknown']));
        }

        return [...partA, ...partB, ...partC, ...partD, ...partE];
    }, [displayedFeed]);

    return {
        feed,
        loadingFeed,
        setLoadingFeed,
        loadFeed,
        displayedFeed,
        orderedDisplayedFeed,
        setFeed // Expose setter for optimistic updates or deletions
    };
}
