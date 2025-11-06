import { useEffect, useMemo, useState, useCallback } from 'react';
import { Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { supabase, HostelsProductUpdates, UniqueVisitor } from '../lib/supabase';
import { uploadImageToSupabase } from '../lib/databaseServices';
import ConfirmUniversityModal from '../components/ConfirmUniversityModal';
import AuthModal from '../components/AuthModal';
import ConfirmContactModal from '../components/ConfirmContactModal';
import { categorizePost, extractProductKeywordsFromDescription } from '../lib/gemini';
import { useHostelMode } from '../hooks/useHostelMode';
import PostComposer from '../components/hostel/PostComposer';
import ProductFeedItem from '../components/hostel/ProductFeedItem';
import FilterBar from '../components/hostel/FilterBar';
import ImageModal from '../components/hostel/ImageModal';
import ConfirmDeleteModal from '../components/hostel/ConfirmDeleteModal';
import LoadingSpinner from '../components/hostel/LoadingSpinner';
import { getUserId } from '../hooks/useTracking';

export default function HostelHomePage() {
    const [currentVisitor, setCurrentVisitor] = useState<UniqueVisitor | null>(null);
    const [posting, setPosting] = useState<boolean>(false);
    const [feed, setFeed] = useState<HostelsProductUpdates[]>([]);
    const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

    const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
    const [imageModalImages, setImageModalImages] = useState<string[]>([]);
    const [imageModalActive, setImageModalActive] = useState<number>(0);

    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
    const [showConfirmUniversityModal, setShowConfirmUniversityModal] = useState(false);

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
    const [myProductsActive, setMyProductsActive] = useState<boolean>(false);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isSearchView, setIsSearchView] = useState(true);
    const [showImageSearchPrompt, setShowImageSearchPrompt] = useState(false);
    const [searchResults, setSearchResults] = useState<HostelsProductUpdates[] | null>(null);
    const [searchTerm, setSearchTerm] = useState<string | null>(null);
    const [showConfirmContactModal, setShowConfirmContactModal] = useState(false);
    const [pendingContactProduct, setPendingContactProduct] = useState(null);

    const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletePostId, setDeletePostId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const navigate = useNavigate();
    const { toggleHostelMode } = useHostelMode();

    const userIsHostelMerchant = currentVisitor?.is_hostel_merchant === true;


    const loadFeed = useCallback(async (schoolId: string | null = selectedSchoolId) => {
        try {
            //added this cause we need to ensure user is tracked
            await getUserId();
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
                        schools (id, short_name)
                    ),
                    status,
                    post_type
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
            };
            const rawList: RawUpdate[] = (data || []) as RawUpdate[];
            const filteredBySchool = (schoolId
                ? rawList.filter((d) => (d.unique_visitors as UniqueVisitor | undefined)?.hostels?.school_id === schoolId)
                : rawList);

            const mapped: HostelsProductUpdates[] = filteredBySchool.map((d) => ({
                id: d.id,
                post_description: d.post_description,
                post_images: Array.isArray(d.post_images) ? d.post_images : [],
                post_category: d.post_category ?? '',
                created_at: d.created_at,
                actual_user_id: d.actual_user_id,
                unique_visitors: d.unique_visitors,
            }));

            setFeed(mapped);
        } catch (e) {
            console.error('Failed to load feed', e);
        } finally {
            setLoadingFeed(false);
        }
    }, [selectedSchoolId]);

    const displayedFeed = useMemo(() => {
        let filtered = feed.filter((item) => {
            const visitor = item.unique_visitors as UniqueVisitor | undefined;
            const matchesHostel = selectedHostel === 'all' || !selectedHostel
                ? true
                : visitor?.hostel_id === selectedHostel || visitor?.hostels?.id === selectedHostel;

            const matchesCategory = selectedCategory === 'all' || !selectedCategory
                ? true
                : (item.post_category || '').toLowerCase() === selectedCategory.toLowerCase();

            return matchesHostel && matchesCategory;
        });

        if (myProductsActive && currentVisitor?.id) {
            filtered = filtered.filter((item) => item.actual_user_id === currentVisitor.id);
        }

        return filtered;
    }, [feed, selectedHostel, selectedCategory, myProductsActive, currentVisitor?.id]);

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
                // setIsSearchView(!visitor?.is_hostel_merchant);
            }

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
            const detail = (e as CustomEvent).detail;
            setPendingContactProduct(detail);
            setShowConfirmContactModal(true);
        };

        window.addEventListener('pending-contact-available', onPending as EventListener);
        return () => {
            window.removeEventListener('pending-contact-available', onPending as EventListener);
        };
    }, [loadFeed]);

    useEffect(() => {
        if (!userIsAuthenticated) return;
        const raw = localStorage.getItem('pending_contact_product');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setShowAuthModal(false);
                const ev = new CustomEvent('pending-contact-available', { detail: parsed });
                window.dispatchEvent(ev);
            } catch {
                localStorage.removeItem('pending_contact_product');
            }
        }
    }, [userIsAuthenticated]);

    const handlePost = async (text: string, images: File[]) => {
        if (!currentVisitor?.id) return;
        if (!text.trim() && images.length === 0) return;

        try {
            setPosting(true);
            const uploadedUrls = images.length > 0
                ? await Promise.all(
                    images.map((file) => uploadImageToSupabase(file, currentVisitor.id as string, 'product-images', 'hostel-updates'))
                )
                : [];

            const postCategory = await categorizePost(text.trim());
            const postSearchWords = await extractProductKeywordsFromDescription(text.trim());

            const { error } = await supabase
                .from('hostel_product_updates')
                .insert({
                    post_description: text.trim(),
                    post_images: uploadedUrls,
                    actual_user_id: currentVisitor.id,
                    post_category: postCategory,
                    search_words: postSearchWords
                });

            if (error) throw error;

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
                        schools (id, short_name)
                    ),
                    status,
                    post_type
                    `)
                .eq('post_category', postCategory)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const list = (data || []) as HostelsProductUpdates[];

            const filtered = selectedSchoolId
                ? list.filter((d) => (d.unique_visitors as UniqueVisitor | undefined)?.hostels?.school_id === selectedSchoolId)
                : list;

            if (postSearchWords.length > 0) {
                const rankedResults = filtered.map(item => {
                    const itemSearchWords: string[] = Array.isArray(item.search_words) ? item.search_words : [];
                    let score = 0;

                    for (const queryWord of postSearchWords) {
                        // Normalize for case-insensitive matching
                        const lowerQueryWord = queryWord.toLowerCase();

                        // Check if ANY of the item's search words contain the query word
                        const matchFound = itemSearchWords.some(itemWord =>
                            itemWord.toLowerCase().includes(lowerQueryWord)
                        );

                        if (matchFound) {
                            score += 1;
                        }
                    }

                    return { ...item, score };
                });

                rankedResults.sort((a, b) => {
                    if (b.score !== a.score) {
                        return b.score - a.score;
                    }

                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return dateB - dateA;
                });

                const finalResults = rankedResults.map(({ score, ...rest }) => rest);
                setSearchResults(finalResults as HostelsProductUpdates[]);
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
        setSelectedHostel('all');
        setSelectedCategory('all');
        setMyProductsActive(false);
    };

    const handleDeleteClick = (postId: string) => {
        setDeletePostId(postId);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletePostId) return;

        try {
            setDeleting(true);
            const { error } = await supabase
                .from('hostel_product_updates')
                .delete()
                .eq('id', deletePostId);

            if (error) throw error;

            setFeed((prev) => prev.filter((item) => item.id !== deletePostId));
            if (searchResults) {
                setSearchResults((prev) => prev ? prev.filter((item) => item.id !== deletePostId) : null);
            }
            setDeleteModalOpen(false);
            setDeletePostId(null);
        } catch (e) {
            console.error('Failed to delete post', e);
        } finally {
            setDeleting(false);
        }
    };

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

    const handleConfirmUniversity = (schoolId: string) => {
        localStorage.setItem('selectedSchoolId', schoolId);
        setSelectedSchoolId(schoolId);
        setShowConfirmUniversityModal(false);
        loadFeed(schoolId);
    };

    const feedToDisplay = searchResults !== null ? searchResults : displayedFeed;
    const showLoading = loadingFeed || posting;

    return (
        <>
            {selectedSchoolId ? (
                <main className="min-h-screen bg-gray-900">
                    <Toaster position="top-center" richColors />

                    <div className="w-full max-w-2xl mx-auto px-2">
                        <Header isHostelMerchant={userIsHostelMerchant} onAuthClick={() => setShowAuthModal(true)} />
                    </div>

                    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen">
                        <PostComposer
                            currentVisitor={currentVisitor}
                            userIsHostelMerchant={userIsHostelMerchant}
                            isSearchView={isSearchView}
                            onToggleView={setIsSearchView}
                            onPost={handlePost}
                            onSearch={handleSearch}
                            posting={posting}
                            onImageSearchPrompt={() => setShowImageSearchPrompt(true)}
                        />

                        <FilterBar
                            hostels={hostels}
                            selectedHostel={selectedHostel}
                            onSelectHostel={setSelectedHostel}
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            showMyProducts={userIsHostelMerchant}
                            myProductsActive={myProductsActive}
                            onToggleMyProducts={() => {
                                setMyProductsActive(!myProductsActive);
                                setSelectedCategory('all');
                            }}
                            searchTerm={searchTerm}
                            onClearSearch={handleClearSearch}
                        />

                        <div className="flex flex-col">
                            {showLoading ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    {feedToDisplay.length === 0 && (
                                        <div className="p-4 text-sm text-[#8b98a5] text-center">
                                            {searchResults !== null ? (
                                                <>
                                                    No results for product. Would you like to check the main store for the product?
                                                    <div className="mt-3">
                                                        <button
                                                            onClick={() => {
                                                                toggleHostelMode();
                                                                navigate('/');
                                                            }}
                                                            className="bg-emerald-500 text-white px-4 py-2 rounded-full"
                                                        >
                                                            Yes, take me to store
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                'No updates yet.'
                                            )}
                                        </div>
                                    )}

                                    {feedToDisplay.map((item) => (
                                        <ProductFeedItem
                                            key={item.id}
                                            item={item}
                                            currentUserId={currentVisitor?.id}
                                            openImageModal={openImageModal}
                                            onDelete={userIsHostelMerchant ? handleDeleteClick : undefined}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    <ImageModal
                        isOpen={imageModalOpen}
                        images={imageModalImages}
                        initialIndex={imageModalActive}
                        onClose={() => setImageModalOpen(false)}
                    />

                    {ImageSearchPrompt()}

                    <AuthModal
                        isOpen={showAuthModal}
                        onClose={() => setShowAuthModal(false)}
                        onSuccess={() => setUserIsAuthenticated(true)}
                    />

                    <ConfirmContactModal
                        isOpen={showConfirmContactModal}
                        product={pendingContactProduct || undefined}
                        onClose={() => {
                            setShowConfirmContactModal(false);
                            setPendingContactProduct(null);
                            localStorage.removeItem('pending_contact_product');
                        }}
                        onConfirm={() => {
                            setShowConfirmContactModal(false);
                            setPendingContactProduct(null);
                            localStorage.removeItem('pending_contact_product');
                        }}
                        hostelMode={true}
                    />

                    <ConfirmDeleteModal
                        isOpen={deleteModalOpen}
                        onClose={() => {
                            setDeleteModalOpen(false);
                            setDeletePostId(null);
                        }}
                        onConfirm={handleDeleteConfirm}
                        deleting={deleting}
                    />
                </main>
            ) : (
                <ConfirmUniversityModal
                    isOpen={showConfirmUniversityModal}
                    onClose={() => setShowConfirmUniversityModal(false)}
                    initialSchoolId={selectedSchoolId}
                    onConfirm={handleConfirmUniversity}
                />
            )}
        </>
    );
}
