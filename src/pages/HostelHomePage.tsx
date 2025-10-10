import { useEffect, useMemo, useState, useCallback } from 'react';
import { Toaster } from 'sonner';
import Header from '../components/Header';
import { supabase, HostelsProductUpdates, UniqueVisitor } from '../lib/supabase';
import { uploadImageToSupabase } from '../lib/databaseServices';
import { X, ChevronLeft, ChevronRight, Search, Upload } from 'lucide-react';
import ConfirmUniversityModal from '../components/ConfirmUniversityModal';
import ContactSellerButton from '../components/ContactSellerButton';
import AuthModal from '../components/AuthModal';
import ConfirmContactModal from '../components/ConfirmContactModal';
import { useTheme } from '../hooks/useTheme';
import { categorizePost, extractProductKeywordsFromDescription } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';
import { useHostelMode } from '../hooks/useHostelMode';

// Helper function to format time (placeholder implementation for a Twitter-like "Xh" format)
const formatTimeAgo = (timestamp: string): string => {
    const diffInHours = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return '<1h';
    if (diffInHours < 24) return `${diffInHours}h`;
    return new Date(timestamp).toLocaleDateString();
};

// (no icon components needed; using inline SVG where required)
// removed unused action icons as actions row replaced by ContactSellerButton


export default function HostelHomePage() {
    const [currentVisitor, setCurrentVisitor] = useState<UniqueVisitor | null>(null);

    const [composerText, setComposerText] = useState<string>('');
    const [composerImages, setComposerImages] = useState<File[]>([]);
    const [posting, setPosting] = useState<boolean>(false);
    // limit composer images to 4
    const [feed, setFeed] = useState<HostelsProductUpdates[]>([]);
    const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

    // Modal state
    const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
    const [imageModalImages, setImageModalImages] = useState<string[]>([]);
    // initial index now handled by imageModalActive only
    const [imageModalActive, setImageModalActive] = useState<number>(0);

    // University gating (mirror HomePage)
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
    const [showConfirmUniversityModal, setShowConfirmUniversityModal] = useState(false);

    // Hostel & Category filters
    const [hostels, setHostels] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedHostel, setSelectedHostel] = useState<string>('all');
    const [categories] = useState<string[]>([
        'food & snacks',
        'clothing',
        'shoes',
        'caps',
        'gadgets',
        'phones',
        'jewelries',
        'bags',
        'beauty & skincare',
        'hair accessories',
        'others'
    ]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const [showAuthModal, setShowAuthModal] = useState(false);
    // composer mode: false = post form, true = search form
    const [isSearchView, setIsSearchView] = useState(false);
    const [showImageSearchPrompt, setShowImageSearchPrompt] = useState(false);
    const [searchResults, setSearchResults] = useState<HostelsProductUpdates[] | null>(null);
    const [showConfirmContactModal, setShowConfirmContactModal] = useState(false);
    const [pendingContactProduct, setPendingContactProduct] = useState(null);

    const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

    const navigate = useNavigate();
    const { toggleHostelMode } = useHostelMode();

    const { currentTheme } = useTheme();

    // Only visitors who are hostel merchants may switch between search and post composer modes.
    const userIsHostelMerchant = currentVisitor?.is_hostel_merchant === true;

    // If the current visitor is NOT a hostel merchant, force the composer into search view.
    useEffect(() => {
        if (!userIsHostelMerchant) {
            setIsSearchView(true);
        }
    }, [userIsHostelMerchant]);




    const loadFeed = useCallback(async (schoolId: string | null = selectedSchoolId) => {

        try {
            setLoadingFeed(true);
            const { data, error } = await supabase
                .from('hostel_product_updates')
                .select(`
                    id,
                                post_category,
                    post_description,
                    post_images,
                    created_at,
                    merchant_id,
                    unique_visitors:merchant_id (
                        id,
                        full_name,
                        profile_picture,
                        phone_number,
                        room,
                        is_hostel_merchant,
                        hostel_id,
                        hostels (id, name, school_id),
                        schools (short_name)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            type RawUpdate = {
                id: string;
                post_description: string;
                post_images: string[];
                post_category?: string | null;
                created_at: string;
                merchant_id: string;
                unique_visitors?: UniqueVisitor;
            };
            const rawList: RawUpdate[] = (data || []) as RawUpdate[];
            const filteredBySchool = (schoolId
                ? rawList.filter((d) => (d.unique_visitors as UniqueVisitor | undefined)?.hostels?.school_id === schoolId)
                : rawList);

            // Keep full list (we'll apply hostel/category filters client-side when rendering)
            const filtered = filteredBySchool;

            const mapped: HostelsProductUpdates[] = filtered.map((d) => ({
                id: d.id,
                post_description: d.post_description,
                post_images: Array.isArray(d.post_images) ? d.post_images : [],
                post_category: d.post_category ?? '',
                created_at: d.created_at,
                merchant_id: d.merchant_id,
                unique_visitors: d.unique_visitors,
            }));

            setFeed(mapped);
        } catch (e) {
            console.error('Failed to load feed', e);
        } finally {
            setLoadingFeed(false);
        }
    }, [selectedSchoolId]);

    // Compute displayed feed by applying hostel and category filters client-side
    const displayedFeed = useMemo(() => {
        return feed.filter((item) => {
            const visitor = item.unique_visitors as UniqueVisitor | undefined;
            const matchesHostel = selectedHostel === 'all' || !selectedHostel
                ? true
                : visitor?.hostel_id === selectedHostel || visitor?.hostels?.id === selectedHostel;

            const matchesCategory = selectedCategory === 'all' || !selectedCategory
                ? true
                : (item.post_category || '').toLowerCase() === selectedCategory.toLowerCase();

            return matchesHostel && matchesCategory;
        });
    }, [feed, selectedHostel, selectedCategory]);

    // Fetch hostels for the current school when selectedSchoolId changes
    useEffect(() => {
        const fetchHostels = async () => {
            if (!selectedSchoolId) return;
            try {
                const { data, error } = await supabase
                    .from('hostels')
                    .select('id, name')
                    .eq('school_id', selectedSchoolId)
                    .order('name', { ascending: true });

                if (error) throw error;
                setHostels((data || []) as Array<{ id: string; name: string }>);
            } catch (e) {
                console.error('Failed to fetch hostels', e);
            }
        };
        fetchHostels();
    }, [selectedSchoolId]);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;

            setUserIsAuthenticated(!!session);

            if (userId) {
                const { data: visitor } = await supabase
                    .from('unique_visitors')
                    .select('id, full_name, profile_picture, hostel_id, room, is_hostel_merchant, hostels(*), schools(*)')
                    .eq('auth_user_id', userId)
                    .single();
                setCurrentVisitor(visitor as unknown as UniqueVisitor);
                // default view for merchants is post form, for others default to search
                setIsSearchView(!visitor?.is_hostel_merchant);
            }

            // Initialize selected school from DB or localStorage
            const storedId = localStorage.getItem('selectedSchoolId');
            if (storedId) {
                setSelectedSchoolId(storedId);
            } else {
                setShowConfirmUniversityModal(true);
            }

            await loadFeed(storedId || null);
        };
        init();

        const onPending = (e: Event) => {
            // event detail contains the product
            // types are not strict here
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detail = (e as CustomEvent).detail as any;
            setPendingContactProduct(detail);
            setShowConfirmContactModal(true);
        };

        window.addEventListener('pending-contact-available', onPending as EventListener);
        return () => {
            window.removeEventListener('pending-contact-available', onPending as EventListener);
        };
    }, [loadFeed]);

    // Check for pending contact product when userIsAuthenticated changes to true
    useEffect(() => {
        if (!userIsAuthenticated) return;
        const raw = localStorage.getItem('pending_contact_product');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                // open confirm modal by dispatching a custom event or local state; we'll use local state below
                // store it in localStorage is enough; we'll use a small state to trigger the modal
                setShowAuthModal(false);
                // create an event so other components/pages can show confirm modal if needed
                const ev = new CustomEvent('pending-contact-available', { detail: parsed });
                window.dispatchEvent(ev);
            } catch {
                localStorage.removeItem('pending_contact_product');
            }
        }
    }, [userIsAuthenticated]);


    // permission helper for posting is determined by currentVisitor.is_hostel_merchant when needed

    const onSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        // allow up to 4 images
        setComposerImages((prev) => [...prev, ...files].slice(0, 4));
        // Clear the input value so the same file(s) can be selected again if needed
        e.target.value = '';
    };

    const removeComposerImage = (index: number) => {
        setComposerImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePost = async () => {
        if (!currentVisitor?.id) return;
        if (!composerText.trim() && composerImages.length === 0) return;

        try {
            setPosting(true);
            const uploadedUrls = composerImages.length > 0
                ? await Promise.all(
                    composerImages.map((file) => uploadImageToSupabase(file, currentVisitor.id as string, 'product-images', 'hostel-updates'))
                )
                : [];

            const postCategory = await categorizePost(composerText.trim())
            const postSearchWords = await extractProductKeywordsFromDescription(composerText.trim())

            const { error } = await supabase
                .from('hostel_product_updates')
                .insert({
                    post_description: composerText.trim(),
                    post_images: uploadedUrls,
                    merchant_id: currentVisitor.id, // FK to unique_visitors
                    post_category: postCategory,
                    search_words: postSearchWords
                });

            if (error) throw error;

            setComposerText('');
            setComposerImages([]);
            await loadFeed();
        } catch (e) {
            console.error('Failed to post update', e);
        } finally {
            setPosting(false);
        }
    };

    const openImageModal = (images: string[], startIndex: number) => {
        setImageModalImages(images);
        setImageModalActive(startIndex);
        setImageModalOpen(true);
    };

    // Search handler: queries post_description and post_category
    // Search handler: queries post_category and search_words
    const handleSearch = async () => {
        const q = composerText.trim();

        if (!q) return;

        try {
            setPosting(true);

            // --- Step 1: Get categorization and search words for the query ---
            const postCategory = await categorizePost(q);
            const postSearchWords = await extractProductKeywordsFromDescription(q);

            // Crucial check: If we can't determine a category, we won't get results based on the new requirement.
            if (!postCategory) {
                console.warn('Could not determine post category for the query.');
                setSearchResults([]);
                return;
            }

            // --- Step 2: Fetch data filtered STRICTLY by postCategory ---
            // 1. Filter: Use .eq() to ensure post_category EXACTLY matches the determined category.
            // 2. Search: We could potentially use .or() on search_words if Supabase supported advanced array matching/text search here, 
            //    but since we are doing the ranking later, we'll keep the filter strict and let the ranking handle keyword relevance.

            const { data, error } = await supabase
                .from('hostel_product_updates')
                .select(`id, post_description, post_images, post_category, search_words, created_at, merchant_id, unique_visitors:merchant_id (id, full_name, profile_picture, phone_number, room, hostel_id, hostels(id, name, school_id), schools(short_name))`)
                .eq('post_category', postCategory) // NEW: Strict filter for the determined category
                .order('created_at', { ascending: false });

            if (error) throw error;

            const list = (data || []) as HostelsProductUpdates[];

            // Filter by school if selected
            const filtered = selectedSchoolId
                ? list.filter((d) => (d.unique_visitors as UniqueVisitor | undefined)?.hostels?.school_id === selectedSchoolId)
                : list;

            // --- Step 3: Client-Side Ranking by Search Words Similarity ---
            if (postSearchWords.length > 0) {
                // Calculate a score for each result based on keyword overlap
                const rankedResults = filtered.map(item => {
                    // Ensure item.search_words is an array for safe comparison
                    const itemSearchWords: string[] = Array.isArray(item.search_words) ? item.search_words : [];
                    let score = 0;

                    // Calculate score based on keyword overlap
                    for (const queryWord of postSearchWords) {
                        if (itemSearchWords.includes(queryWord)) {
                            // Give a point for each exact match
                            score += 1;
                        }
                    }

                    return { ...item, score };
                });

                // Sort the results: 
                // 1. Higher score first (most similar)
                // 2. Then by the original created_at (most recent)
                rankedResults.sort((a, b) => {
                    // Primary sort: score (descending)
                    if (b.score !== a.score) {
                        return b.score - a.score;
                    }

                    // Secondary sort: created_at (descending - ensures recency for ties)
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return dateB - dateA;
                });

                // Remove the temporary 'score' property before setting the state
                const finalResults = rankedResults.map(({ score, ...rest }) => rest);
                setSearchResults(finalResults as HostelsProductUpdates[]);

            } else {
                // If no keywords were generated from the query, use the filtered list directly (already category-filtered)
                setSearchResults(filtered);
            }

        } catch (e) {
            console.error('Search failed', e);
            setSearchResults([]);
        } finally {
            setPosting(false);
        }
    };

    // Image-search prompt modal (coming soon)
    const ImageSearchPrompt = () => (
        showImageSearchPrompt ? (
            <div
                className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
                onClick={() => setShowImageSearchPrompt(false)}
            >
                <div className="bg-gray-900 p-6 rounded-2xl max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-white text-lg font-semibold">Find products using images</h3>
                    <p className="text-gray-400 mt-2">(Coming soon...)</p>
                    <div className="mt-4">
                        <button onClick={() => setShowImageSearchPrompt(false)} className="px-4 py-2 bg-emerald-500 text-white rounded-full">Close</button>
                    </div>
                </div>
            </div>
        ) : null
    );

    // FIX: Added to address the issue of modal not unappearing when background is touched.
    const closeImageModal = () => setImageModalOpen(false);
    // Add a utility to stop event propagation (used on modal content)
    const stopPropagation = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

    // Helper to render image grid based on count (PostCard-like layouts)
    const renderImageGrid = (images: string[], openModal: (images: string[], startIndex: number) => void) => {
        if (!images || images.length === 0) return null;

        const count = images.length;
        // single: large single column, otherwise two-column grid
        const gridClass = count === 1 ? 'grid-cols-1' : 'grid-cols-2';

        return (
            <div className={`mt-3 grid ${gridClass} gap-2`}>
                {images.slice(0, 4).map((url, idx) => {
                    // For a 3-image layout, make the first image span both columns
                    const isThreeLeft = count === 3 && idx === 0;
                    const containerClasses = `relative rounded-2xl overflow-hidden border border-gray-800 cursor-pointer transition-opacity hover:opacity-90 ${isThreeLeft ? 'col-span-2' : ''}`;
                    const maxHeight = count === 1 ? '500px' : '250px';

                    return (
                        <button
                            key={idx}
                            onClick={() => openModal(images, idx)}
                            className={containerClasses}
                            aria-label={`Open image ${idx + 1}`}
                        >
                            <img
                                src={url}
                                alt={`post image ${idx + 1}`}
                                className="w-full h-full object-cover"
                                style={{ maxHeight }}
                            />

                            {count > 4 && idx === 3 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-bold text-xl">
                                    +{count - 4}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };


    const handleConfirmUniversity = (schoolId: string) => {
        localStorage.setItem('selectedSchoolId', schoolId);
        setSelectedSchoolId(schoolId);
        setShowConfirmUniversityModal(false);
        loadFeed(schoolId);
    };

    return (
        <>
            {selectedSchoolId ?
                <main className="min-h-screen bg-gray-900">
                    <Toaster position="top-center" richColors />

                    {/* Header container spacing to match HomePage */}
                    <div className="w-full max-w-2xl mx-auto px-2">
                        <Header onAuthClick={() => setShowAuthModal(true)} />
                    </div>


                    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen">
                        {/* Post Composer Area */}
                        {/* Post Composer Area */}
                        <div className="p-4 border-b border-gray-800 flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-[#253341] flex items-center justify-center overflow-hidden">
                                    {currentVisitor?.profile_picture ? (
                                        <img src={currentVisitor.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-semibold text-[#8b98a5]">
                                            {String(currentVisitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <textarea
                                        value={composerText}
                                        onChange={(e) => setComposerText(e.target.value)}
                                        placeholder={isSearchView ? 'What are you looking for?' : 'What are you selling?'}
                                        className="w-full bg-transparent text-white text-xl placeholder-gray-500 outline-none resize-none"
                                        rows={2}
                                    />
                                    <div className="ml-3">
                                        {/* Toggle icons: only show to hostel merchants. Other users always stay in search view. */}
                                        {userIsHostelMerchant ? (
                                            !isSearchView ? (
                                                <button
                                                    onClick={() => setIsSearchView(true)}
                                                    className="text-gray-400 hover:text-white p-2 rounded-full"
                                                    aria-label="Search mode"
                                                >
                                                    <Search className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setIsSearchView(false)}
                                                    className="text-gray-400 hover:text-white p-2 rounded-full"
                                                    aria-label="Post mode"
                                                >
                                                    <Upload className="w-5 h-5" />
                                                </button>
                                            )
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    {/* <div className="w-10 h-10 rounded-full bg-[#253341] flex items-center justify-center overflow-hidden">
                                        {currentVisitor?.profile_picture ? (
                                            <img src={currentVisitor.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-semibold text-[#8b98a5]">
                                                {String(currentVisitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)}
                                            </span>
                                        )}
                                    </div> */}
                                </div>
                                <div className="flex-1">
                                    {/* <textarea
                                        value={composerText}
                                        onChange={(e) => setComposerText(e.target.value)}
                                        placeholder="What are you selling?"
                                        className="w-full bg-transparent text-white text-xl placeholder-gray-500 outline-none resize-none"
                                        rows={2}
                                    /> */}

                                    {/* Composer Image Preview */}
                                    {composerImages.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            {composerImages.map((file, idx) => (
                                                <div key={idx} className="relative rounded-2xl overflow-hidden">
                                                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-48 object-cover" />
                                                    <button
                                                        onClick={() => removeComposerImage(idx)}
                                                        className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full p-2 transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                                        <div className="flex gap-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={onSelectImages}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            {/* If in search view, clicking the image icon should show a modal prompt (coming soon). */}
                                            <button
                                                onClick={() => {
                                                    if (isSearchView) setShowImageSearchPrompt(true);
                                                    else document.getElementById('image-upload')?.click();
                                                }}
                                                className={`text-emerald-500 hover:bg-emerald-500/10 p-2 rounded-full transition-colors cursor-pointer`}
                                                aria-label="Add images"
                                            >
                                                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5"><path fill="currentColor" d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2M8.5 12.5l2.5 3l3.5-4.5L19 17H5m3-7a2 2 0 1 1 2-2a2 2 0 0 1-2 2Z" /></svg>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (isSearchView) handleSearch();
                                                else handlePost();
                                            }}
                                            disabled={posting || (!composerText.trim() && composerImages.length === 0 && !isSearchView)}
                                            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors"
                                        >
                                            {isSearchView ? (posting ? 'Searching...' : 'Search') : (posting ? 'Posting...' : 'Post')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feed Divider */}
                        {/* <div className="h-2 bg-[#2f3336]"></div> */}


                        {/* Main Feed Area */}
                        {/* Filters: Hostels and Categories */}
                        <div className="px-4 pt-3">
                            <div className="flex gap-2 sm:gap-3 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                                <button
                                    onClick={() => setSelectedHostel('all')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${selectedHostel === 'all'
                                        ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    All Hostels
                                </button>
                                {hostels.map(hostel => (
                                    <button
                                        key={hostel.id}
                                        onClick={() => setSelectedHostel(hostel.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${selectedHostel === hostel.id
                                            ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {hostel.name}
                                    </button>
                                ))}
                            </div>

                            {/* Category Filters */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                                        ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    All
                                </button>
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                            ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            {isSearchView ? (
                                <div>
                                    {searchResults === null && (
                                        <div>
                                            {loadingFeed && (
                                                <div className="p-4 text-sm text-[#8b98a5] text-center">Loading updates...</div>
                                            )}
                                            {!loadingFeed && feed.length === 0 && (
                                                <div className="p-4 text-sm text-[#8b98a5] text-center">No updates yet.</div>
                                            )}
                                            {!loadingFeed && feed.length > 0 && (
                                                displayedFeed.map((item) => {
                                                    const visitor = item.unique_visitors as UniqueVisitor | undefined;
                                                    const initials = String(visitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
                                                    const name = visitor?.full_name || 'User';
                                                    const handle = `@${name.toLowerCase().replace(/\s/g, '').slice(0, 7)}b`;
                                                    const hostel = visitor?.hostels?.name;
                                                    const room = visitor?.room ? `Room ${visitor.room}` : '';
                                                    const timeAgo = formatTimeAgo(item.created_at);

                                                    return (
                                                        <article key={item.id} className="border-b border-gray-800 p-4 hover:bg-gray-800/30 transition-colors">
                                                            <div className="flex gap-3">
                                                                {/* Avatar Column */}
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-12 h-12 rounded-full bg-[#253341] flex items-center justify-center overflow-hidden">
                                                                        {visitor?.profile_picture ? (
                                                                            <img src={visitor.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-sm font-semibold text-[#8b98a5]">{initials}</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Content Column */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2 flex-wrap text-sm">
                                                                            <span className="font-bold text-white hover:underline cursor-pointer">{name}</span>
                                                                            <span className="text-gray-500">{handle}</span>
                                                                            <span className="text-gray-500">·</span>
                                                                            <span className="text-gray-500">{timeAgo}</span>
                                                                        </div>
                                                                        {/* More options icon would go here */}
                                                                    </div>

                                                                    {/* Location Line - emphasized */}
                                                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                                                        <span>{hostel}</span>
                                                                        <span>·</span>
                                                                        {room && <span>{room}</span>}
                                                                    </div>

                                                                    {/* Post Description */}
                                                                    {item.post_description && (
                                                                        <p className="text-white mt-2 text-[15px] leading-normal whitespace-pre-wrap">
                                                                            {item.post_description}
                                                                        </p>
                                                                    )}

                                                                    {/* Image Grid */}
                                                                    {renderImageGrid(item.post_images, openImageModal)}

                                                                    {/* Replace actions with ContactSellerButton */}
                                                                    <div className="mt-3">
                                                                        <ContactSellerButton
                                                                            product={{
                                                                                product_description: item.post_description,
                                                                                phone_number: (visitor as UniqueVisitor | undefined)?.phone_number || '',
                                                                                school_short_name: visitor?.schools?.short_name,
                                                                                merchant_id: visitor?.id,
                                                                            }}
                                                                        >
                                                                            Contact Seller
                                                                        </ContactSellerButton>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </article>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                    {searchResults !== null && searchResults.length === 0 && (
                                        <div className="p-4 text-sm text-[#8b98a5] text-center">
                                            No results for product. Would you like to check the main store for the product?
                                            <div className="mt-3">
                                                <button
                                                    onClick={() => { toggleHostelMode(); navigate('/'); }}
                                                    className="bg-emerald-500 text-white px-4 py-2 rounded-full"
                                                >
                                                    Yes, take me to store
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {searchResults && searchResults.length > 0 && (
                                        searchResults.map((item) => {
                                            const visitor = item.unique_visitors as UniqueVisitor | undefined;
                                            const initials = String(visitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
                                            const name = visitor?.full_name || 'User';
                                            const handle = `@${name.toLowerCase().replace(/\s/g, '').slice(0, 7)}b`;
                                            const hostel = visitor?.hostels?.name;
                                            const room = visitor?.room ? `Room ${visitor.room}` : '';
                                            const timeAgo = formatTimeAgo(item.created_at);

                                            return (
                                                <article key={item.id} className="border-b border-gray-800 p-4 hover:bg-gray-800/30 transition-colors">
                                                    <div className="flex gap-3">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-12 h-12 rounded-full bg-[#253341] flex items-center justify-center overflow-hidden">
                                                                {visitor?.profile_picture ? (
                                                                    <img src={visitor.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-sm font-semibold text-[#8b98a5]">{initials}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                                                    <span className="font-bold text-white hover:underline cursor-pointer">{name}</span>
                                                                    <span className="text-gray-500">{handle}</span>
                                                                    <span className="text-gray-500">·</span>
                                                                    <span className="text-gray-500">{timeAgo}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                                                <span>{hostel}</span>
                                                                <span>·</span>
                                                                {room && <span>{room}</span>}
                                                            </div>
                                                            {item.post_description && (
                                                                <p className="text-white mt-2 text-[15px] leading-normal whitespace-pre-wrap">{item.post_description}</p>
                                                            )}
                                                            {renderImageGrid(item.post_images, openImageModal)}

                                                            {/* Replace actions with ContactSellerButton */}
                                                            <div className="mt-3">
                                                                <ContactSellerButton
                                                                    product={{
                                                                        product_description: item.post_description,
                                                                        phone_number: (visitor as UniqueVisitor | undefined)?.phone_number || '',
                                                                        school_short_name: visitor?.schools?.short_name,
                                                                        merchant_id: visitor?.id,
                                                                    }}
                                                                >
                                                                    Contact Seller
                                                                </ContactSellerButton>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {loadingFeed && (
                                        <div className="p-4 text-sm text-[#8b98a5] text-center">Loading updates...</div>
                                    )}
                                    {!loadingFeed && feed.length === 0 && (
                                        <div className="p-4 text-sm text-[#8b98a5] text-center">No updates yet.</div>
                                    )}
                                    {!loadingFeed && feed.length > 0 && (
                                        displayedFeed.map((item) => {
                                            const visitor = item.unique_visitors as UniqueVisitor | undefined;
                                            const initials = String(visitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
                                            const name = visitor?.full_name || 'User';
                                            const handle = `@${name.toLowerCase().replace(/\s/g, '').slice(0, 7)}b`;
                                            const hostel = visitor?.hostels?.name;
                                            const room = visitor?.room ? `Room ${visitor.room}` : '';
                                            const timeAgo = formatTimeAgo(item.created_at);

                                            return (
                                                <article key={item.id} className="border-b border-gray-800 p-4 hover:bg-gray-800/30 transition-colors">
                                                    <div className="flex gap-3">
                                                        {/* Avatar Column */}
                                                        <div className="flex-shrink-0">
                                                            <div className="w-12 h-12 rounded-full bg-[#253341] flex items-center justify-center overflow-hidden">
                                                                {visitor?.profile_picture ? (
                                                                    <img src={visitor.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-sm font-semibold text-[#8b98a5]">{initials}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Content Column */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                                                    <span className="font-bold text-white hover:underline cursor-pointer">{name}</span>
                                                                    <span className="text-gray-500">{handle}</span>
                                                                    <span className="text-gray-500">·</span>
                                                                    <span className="text-gray-500">{timeAgo}</span>
                                                                </div>
                                                                {/* More options icon would go here */}
                                                            </div>

                                                            {/* Location Line - emphasized */}
                                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                                                <span>{hostel}</span>
                                                                <span>·</span>
                                                                {room && <span>{room}</span>}
                                                            </div>

                                                            {/* Post Description */}
                                                            {item.post_description && (
                                                                <p className="text-white mt-2 text-[15px] leading-normal whitespace-pre-wrap">
                                                                    {item.post_description}
                                                                </p>
                                                            )}

                                                            {/* Image Grid */}
                                                            {renderImageGrid(item.post_images, openImageModal)}

                                                            {/* Replace actions with ContactSellerButton */}
                                                            <div className="mt-3">
                                                                <ContactSellerButton
                                                                    product={{
                                                                        product_description: item.post_description,
                                                                        phone_number: (visitor as UniqueVisitor | undefined)?.phone_number || '',
                                                                        school_short_name: visitor?.schools?.short_name,
                                                                        merchant_id: visitor?.id,
                                                                    }}
                                                                >
                                                                    Contact Seller
                                                                </ContactSellerButton>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Image Modal - custom UI */}
                    {imageModalOpen && (
                        <div
                            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) closeImageModal();
                            }}
                            role="dialog"
                            aria-modal="true"
                        >
                            <button
                                onClick={closeImageModal}
                                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                                aria-label="Close"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={stopPropagation}>
                                {imageModalImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setImageModalActive((prev) => (prev === 0 ? imageModalImages.length - 1 : prev - 1)); }}
                                            className="absolute left-4 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft className="w-8 h-8" />
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setImageModalActive((prev) => (prev === imageModalImages.length - 1 ? 0 : prev + 1)); }}
                                            className="absolute right-4 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="w-8 h-8" />
                                        </button>
                                    </>
                                )}

                                <div className="max-w-6xl max-h-full">
                                    <img
                                        src={imageModalImages[imageModalActive]}
                                        alt={`Image ${imageModalActive + 1}`}
                                        className="max-w-full max-h-[90vh] object-contain"
                                    />
                                </div>

                                {imageModalImages.length > 1 && (
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full">
                                        <span className="text-white font-medium">
                                            {imageModalActive + 1} / {imageModalImages.length}
                                        </span>
                                    </div>
                                )}

                                {imageModalImages.length > 1 && (
                                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
                                        {imageModalImages.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={(e) => { e.stopPropagation(); setImageModalActive(index); }}
                                                className={`w-2 h-2 rounded-full transition-all ${index === imageModalActive ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'}`}
                                                aria-label={`Go to image ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {ImageSearchPrompt()}

                    {/* Auth Modal */}
                    <AuthModal
                        isOpen={showAuthModal}
                        onClose={() => setShowAuthModal(false)}
                        onSuccess={() => setUserIsAuthenticated(true)}
                    />

                    <ConfirmContactModal
                        isOpen={showConfirmContactModal}
                        product={pendingContactProduct || undefined}
                        onClose={() => { setShowConfirmContactModal(false); setPendingContactProduct(null); localStorage.removeItem('pending_contact_product'); }}
                        onConfirm={() => { setShowConfirmContactModal(false); setPendingContactProduct(null); localStorage.removeItem('pending_contact_product'); }}
                        hostelMode={true}
                    />

                </main>
                : <ConfirmUniversityModal
                    isOpen={showConfirmUniversityModal}
                    onClose={() => setShowConfirmUniversityModal(false)}
                    initialSchoolId={selectedSchoolId}
                    onConfirm={handleConfirmUniversity}
                />}

        </>
    );
}