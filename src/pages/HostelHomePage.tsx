import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Toaster, toast } from 'sonner';
import Header from '../components/Header';
import { supabase, HostelsProductUpdates, UniqueVisitor } from '../lib/supabase';



import { useHostelMode } from '../hooks/useHostelMode';
// Components
import PostComposerVuna from '../components/hostel/PostComposerVuna';
import FilterBar from '../components/hostel/FilterBar';
import ProductFeedItem from '../components/hostel/ProductFeedItem';
import RequestsCarousel from '../components/hostel/RequestsCarousel';
import LiveActivityHub from '../components/hostel/LiveActivityHub';
import LoadingSpinner from '../components/hostel/LoadingSpinner';
import { HostelHeader } from '../components/hostel/HostelHeader';
import { HostelModals } from '../components/hostel/HostelModals';
import BannerSlider from '../components/hostel/BannerSlider';
// Hooks
import { useHostelFeed } from '../hooks/hostel/useHostelFeed';
import { useHostelCoupons } from '../hooks/hostel/useHostelCoupons';
import { useHostelSearch } from '../hooks/hostel/useHostelSearch';
import { useHostelPosting } from '../hooks/hostel/useHostelPosting';

/**
 * Main Hostel Home Page Component.
 * Refactored to use custom hooks for logic separation and smaller components for UI.
 */
export default function HostelHomePage() {
    // --- Global State / Refs ---
    const { } = useHostelMode(); // Ensure this is available if needed (used in original?)

    // --- Local Page State ---
    const [currentVisitor, setCurrentVisitor] = useState<UniqueVisitor | null>(null);
    const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
    const [showConfirmUniversityModal, setShowConfirmUniversityModal] = useState(false);
    const [hostels, setHostels] = useState<Array<{ id: string; name: string }>>([]);

    // Filters
    const [selectedHostel, setSelectedHostel] = useState<string>('all');
    const [categories] = useState<string[]>([
        'food & snacks', 'clothing', 'shoes', 'caps', 'gadgets', 'phones',
        'jewelries', 'bags', 'fragrances', 'beauty & skincare', 'hair accessories', 'others'
    ]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [myProductsActive, setMyProductsActive] = useState<boolean>(false);

    // Modals & User Interaction State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showConfirmContactModal, setShowConfirmContactModal] = useState(false);
    const [pendingContactProduct, setPendingContactProduct] = useState<HostelsProductUpdates | null>(null);
    const [merchantModalOpen, setMerchantModalOpen] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState<UniqueVisitor | null>(null);
    const [showBecomeMerchantModal, setShowBecomeMerchantModal] = useState(false);

    // Image Modal
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModalImages, setImageModalImages] = useState<string[]>([]);
    const [imageModalActive, setImageModalActive] = useState(0);
    const [imageModalDescription, setImageModalDescription] = useState<string>('');

    // Deletion
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletePostId, setDeletePostId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);


    // --- Custom Hooks ---

    // 1. Feed Logic
    const {
        loadingFeed,
        setLoadingFeed,
        loadFeed,
        orderedDisplayedFeed,
        setFeed
    } = useHostelFeed(selectedSchoolId, selectedHostel, selectedCategory, myProductsActive, currentVisitor);

    // 2. Search Logic
    const {
        isSearchView,
        setIsSearchView,
        showImageSearchPrompt,
        setShowImageSearchPrompt,
        searchResults,
        setSearchResults,
        searchTerm,
        handleSearch,
        handleClearSearch
    } = useHostelSearch(currentVisitor, selectedSchoolId, setLoadingFeed, () => { /* no-op for posting status in search? or add setter */ });

    // 3. Posting Logic
    const {
        posting,
        handlePost
    } = useHostelPosting(currentVisitor, loadFeed);

    // 4. Coupon Logic
    const {
        couponModalOpen,
        setCouponModalOpen,
        handleGameCouponClaimed,
        activeCoupon,
        setActiveCoupon,
        timeRemaining
    } = useHostelCoupons(currentVisitor, userIsAuthenticated, selectedSchoolId, loadingFeed);


    // --- Derived State for UI ---
    const userIsHostelMerchant = currentVisitor?.is_hostel_merchant === true;
    const feedToDisplay = searchResults !== null ? searchResults : orderedDisplayedFeed;
    const requestItems = feedToDisplay.filter(item => item.post_type === 'request');
    const productItems = feedToDisplay.filter(item => item.post_type !== 'request');
    const showLoading = loadingFeed || posting;

    // --- Side Effects ---

    // Initialize User & School
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;

            setUserIsAuthenticated(!!session);

            if (userId) {
                const { data: visitor } = await supabase
                    .from('unique_visitors')
                    .select('id, full_name, profile_picture, hostel_id, room, is_hostel_merchant, hostels(*), schools(*), is_admin')
                    .eq('auth_user_id', userId)
                    .single();
                setCurrentVisitor(visitor as unknown as UniqueVisitor);
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

        // Event Listeners for cross-component communication
        const onPending = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setPendingContactProduct(detail);
            setShowConfirmContactModal(true);
        };
        const onOpenAuth = () => setShowAuthModal(true);

        window.addEventListener('pending-contact-available', onPending as EventListener);
        window.addEventListener('open-auth-modal', onOpenAuth);
        return () => {
            window.removeEventListener('pending-contact-available', onPending as EventListener);
            window.removeEventListener('open-auth-modal', onOpenAuth);
        };
    }, [loadFeed]);

    // Pending Contact LocalStorage Check
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


    // Fetch Hostels for Filter
    useEffect(() => {
        const fetchHostels = async () => {
            if (!selectedSchoolId) return;
            try {
                const { data, error } = await supabase
                    .from('hostels')
                    .select('id, name')
                    .eq('school_id', selectedSchoolId);

                if (error) throw error;
                setHostels((data || []) as Array<{ id: string; name: string }>);
            } catch (e) {
                console.error('Failed to fetch hostels', e);
            }
        };
        fetchHostels();
    }, [selectedSchoolId]);


    // --- Event Handlers ---

    const handleConfirmUniversity = (schoolId: string) => {
        localStorage.setItem('selectedSchoolId', schoolId);
        setSelectedSchoolId(schoolId);
        setShowConfirmUniversityModal(false);
        loadFeed(schoolId);
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

            // Optimistic update
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

    const handleRequestContact = (type: 'merchant' | 'recommend', item: HostelsProductUpdates) => {
        if (!userIsAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        const visitor = item.unique_visitors as UniqueVisitor | undefined;
        const phone = visitor?.phone_number;
        if (!phone) {
            toast.error('Contact not available');
            return;
        }

        if (type === 'merchant') {
            if (!userIsHostelMerchant) {
                setShowBecomeMerchantModal(true);
                return;
            }
            const msg = `hi there, i have ${item.post_description || ''}`;
            const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
            window.open(whatsappUrl, '_blank');
        } else if (type === 'recommend') {
            const msg = `hi there, i have a recommendation for ${item.post_description || ''}`;
            const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const handleUserClick = (user: UniqueVisitor) => {
        setSelectedMerchant(user);
        setMerchantModalOpen(true);
    };

    const handleProductClick = (product: HostelsProductUpdates) => {
        setMerchantModalOpen(false);
        const images = product.post_images || [];
        if (images.length > 0) {
            setImageModalImages(images);
            setImageModalActive(0);
            setImageModalDescription(product.post_description || '');
            setImageModalOpen(true);
        }
    };

    const handleFulfillRequest = async (item: HostelsProductUpdates) => {
        try {
            const { error } = await supabase
                .from('hostel_product_updates')
                .update({ fulfilled: true })
                .eq('id', item.id);

            if (error) throw error;
            toast.success('Request marked as fulfilled!');
            setFeed(prev => prev.map(p => p.id === item.id ? { ...p, fulfilled: true } : p));
        } catch (error) {
            console.error('Error fulfilling request:', error);
            toast.error('Failed to update request');
        }
    };

    const openImageModal = (images: string[], startIndex: number) => {
        setImageModalImages(images);
        setImageModalActive(startIndex);
        setImageModalOpen(true);
    };

    // --- Render ---

    return (
        <>
            {selectedSchoolId ? (
                <main className="min-h-screen bg-gray-900">
                    <Toaster position="top-center" richColors />

                    <div className="w-full max-w-2xl mx-auto px-2">
                        <Header
                            isHostelMerchant={userIsHostelMerchant}
                            onAuthClick={() => setShowAuthModal(true)}
                            showAuth={true}
                            showToggle={false}
                            showPayment={false}
                        />

                        {/* Title & Badge */}
                        <HostelHeader
                            currentVisitor={currentVisitor}
                            userIsHostelMerchant={userIsHostelMerchant}
                        />

                        {/* Promotional Slider */}
                        {selectedSchoolId && (
                            <div className="px-4 mb-2">
                                {/* Vuna Students (Food + Discounts) */}
                                {selectedSchoolId === '1724171a-6664-44fd-aa1e-f509b124ab51' && (
                                    <BannerSlider
                                        slides={[
                                            {
                                                id: 'vuna-1',
                                                image: '/images/banner_food.png',
                                                title: 'Food & Discounts Day',
                                                subtitle: 'Delicious deals you currently cannot resist!'
                                            },
                                            {
                                                id: 'vuna-2',
                                                image: '/images/banner_discounts.png',
                                                title: 'Special Offers',
                                                subtitle: 'Exclusive discounts just for you.'
                                            }
                                        ]}
                                    />
                                )}

                                {/* BHU Students (Fashion + Discounts) */}
                                {selectedSchoolId === '684c03a5-a18d-4df9-b064-0aaeee2a5f01' && (
                                    <BannerSlider
                                        slides={[
                                            {
                                                id: 'bhu-1',
                                                // Typo in filename as per existing assets
                                                image: '/images/benner_fashion.png',
                                                title: 'Fashion & Discounts Day',
                                                subtitle: 'Upgrade your style with amazing deals!'
                                            },
                                            {
                                                id: 'bhu-2',
                                                image: '/images/banner_discounts.png',
                                                title: 'Special Offers',
                                                subtitle: 'Grab the best prices on top brands.'
                                            }
                                        ]}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen">
                        {/* Composer & Search */}
                        <PostComposerVuna
                            currentVisitor={currentVisitor}
                            userIsHostelMerchant={userIsHostelMerchant}
                            isSearchView={isSearchView}
                            onToggleView={setIsSearchView}
                            onPost={handlePost}
                            onSearch={handleSearch}
                            posting={posting}
                            onImageSearchPrompt={() => setShowImageSearchPrompt(true)}
                            userIsAuthenticated={userIsAuthenticated}
                            setShowAuthModal={setShowAuthModal}
                        />

                        {/* Filtering */}
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
                            onClearSearch={() => {
                                handleClearSearch();
                                setSelectedHostel('all');
                                setSelectedCategory('all');
                                setMyProductsActive(false);
                            }}
                        />

                        {/* Activity & Requests (only if not searching, or show anyway?) */}
                        {!loadingFeed && !searchTerm && (
                            <>
                                <LiveActivityHub onUserClick={handleUserClick} />
                                <RequestsCarousel
                                    requests={requestItems}
                                    onItemClick={(item) => console.log("Clicked request", item.id)}
                                    currentVisitor={currentVisitor}
                                    onContact={handleRequestContact}
                                    onDelete={(item) => handleDeleteClick(item.id)}
                                    onFulfill={handleFulfillRequest}
                                />
                            </>
                        )}

                        {/* Product Feed */}
                        <div className="pb-24">
                            {showLoading ? (
                                <LoadingSpinner />
                            ) : (
                                <div className="divide-y divide-gray-800">
                                    {(searchTerm ? feedToDisplay : productItems).map((item) => (
                                        <ProductFeedItem
                                            key={item.id}
                                            item={item}
                                            currentVisitor={currentVisitor}
                                            openImageModal={openImageModal}
                                            onDelete={() => handleDeleteClick(item.id)}
                                            discountValue={activeCoupon?.value || 0}
                                            onContactMerchant={(item) => handleRequestContact('merchant', item)}
                                            onRecommend={(item) => handleRequestContact('recommend', item)}
                                            onUserClick={handleUserClick}
                                        />
                                    ))}

                                    {!showLoading && feedToDisplay.length === 0 && (
                                        <div className="text-center py-12 text-gray-400">
                                            {searchTerm ? 'No matches found.' : 'No updates yet. Be the first to post!'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            ) : null}

            {/* All Modals */}
            <HostelModals
                showConfirmUniversityModal={showConfirmUniversityModal}
                setShowConfirmUniversityModal={setShowConfirmUniversityModal}
                onConfirmUniversity={handleConfirmUniversity}
                showAuthModal={showAuthModal}
                setShowAuthModal={setShowAuthModal}
                showConfirmContactModal={showConfirmContactModal}
                setShowConfirmContactModal={setShowConfirmContactModal}
                pendingContactProduct={pendingContactProduct}
                imageModalOpen={imageModalOpen}
                setImageModalOpen={setImageModalOpen}
                imageModalImages={imageModalImages}
                imageModalActive={imageModalActive}
                setImageModalActive={setImageModalActive}
                imageModalDescription={imageModalDescription}
                deleteModalOpen={deleteModalOpen}
                setDeleteModalOpen={setDeleteModalOpen}
                handleDeleteConfirm={handleDeleteConfirm}
                deleting={deleting}
                couponModalOpen={couponModalOpen}
                setCouponModalOpen={setCouponModalOpen}
                handleGameCouponClaimed={handleGameCouponClaimed}
                selectedSchoolId={selectedSchoolId}
                currentVisitorId={currentVisitor?.id}
                activeCoupon={activeCoupon}
                merchantModalOpen={merchantModalOpen}
                setMerchantModalOpen={setMerchantModalOpen}
                selectedMerchant={selectedMerchant}
                currentVisitor={currentVisitor}
                onProductClick={handleProductClick}
                showBecomeMerchantModal={showBecomeMerchantModal}
                setShowBecomeMerchantModal={setShowBecomeMerchantModal}
                userIsHostelMerchant={userIsHostelMerchant}
                onContactSeller={(item) => handleRequestContact('merchant', item)}
            />

            {/* Active Coupon Floating Timer */}
            {activeCoupon && timeRemaining !== null && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in duration-500 pointer-events-none group">
                    <div className="bg-gray-900/90 backdrop-blur-md border border-purple-500/30 shadow-lg shadow-purple-500/10 rounded-full pl-5 pr-2 py-2 flex items-center gap-3 pointer-events-auto relative">
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => setCouponModalOpen(true)}
                        >
                            <span className="text-xl">
                                {activeCoupon.type === 'product' ? '🎁' : '🎟️'}
                            </span>
                            <div>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-tight">
                                    {activeCoupon.type === 'product' ? 'Gift Unlocked' : 'Coupon Active'}
                                </p>
                                {activeCoupon.type !== 'product' && (
                                    <p className="text-[10px] text-white font-bold leading-tight">
                                        -₦{activeCoupon.value.toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="h-8 w-px bg-gray-700"></div>
                        <div className="text-right min-w-[60px] mr-2">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-tight">Expires</p>
                            <p className={`text-sm font-mono font-bold leading-tight ${timeRemaining < 300000 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                                {Math.floor(timeRemaining / 60000)}m {Math.floor((timeRemaining % 60000) / 1000)}s
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveCoupon(null);
                            }}
                            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <Icon icon="mdi:close-circle" width="16" height="16" />
                        </button>
                    </div>
                </div>
            )}

            {/* Image Search Placeholder Prompt */}
            {showImageSearchPrompt && (
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
            )}
        </>
    );
}
