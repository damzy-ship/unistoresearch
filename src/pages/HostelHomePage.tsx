import { useEffect, useMemo, useState, useCallback } from 'react';
import { Toaster } from 'sonner';
import Header from '../components/Header';
import { supabase, HostelsProductUpdates, UniqueVisitor } from '../lib/supabase';
import { uploadImageToSupabase } from '../lib/databaseServices';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmUniversityModal from '../components/ConfirmUniversityModal';
import ContactSellerButton from '../components/ContactSellerButton';
import AuthModal from '../components/AuthModal';

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

    const [showAuthModal, setShowAuthModal] = useState(false);


    const loadFeed = useCallback(async (schoolId: string | null = selectedSchoolId) => {
        try {
            setLoadingFeed(true);
            const { data, error } = await supabase
                .from('hostel_product_updates')
                .select(`
          id,
          post_description,
          post_images,
          created_at,
          merchant_id,
          unique_visitors:merchant_id (
            id,
            full_name,
            profile_picture,
            room,
            is_hostel_merchant,
            hostels (name, school_id),
            schools (short_name)
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            type RawUpdate = {
                id: string;
                post_description: string;
                post_images: string[];
                created_at: string;
                merchant_id: string;
                unique_visitors?: UniqueVisitor;
            };
            const rawList: RawUpdate[] = (data || []) as RawUpdate[];
            const filtered = (schoolId
                ? rawList.filter((d) => (d.unique_visitors as UniqueVisitor | undefined)?.hostels?.school_id === schoolId)
                : rawList);

            const mapped: HostelsProductUpdates[] = filtered.map((d) => ({
                id: d.id,
                post_description: d.post_description,
                post_images: Array.isArray(d.post_images) ? d.post_images : [],
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

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;

            // setUserIsAuthenticated(!!session);

            if (userId) {
                const { data: visitor } = await supabase
                    .from('unique_visitors')
                    .select('id, full_name, profile_picture, hostel_id, room, is_hostel_merchant, hostels(*), schools(*)')
                    .eq('auth_user_id', userId)
                    .single();
                setCurrentVisitor(visitor as unknown as UniqueVisitor);
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
    }, [loadFeed]);


    const canPost = useMemo(() => {
        if (!currentVisitor) return false;
        // Assuming 'is_hostel_merchant' is the field that determines posting ability based on the screenshot structure
        // If the screenshot implies only the current user can post a "What are you selling?" prompt
        return !!currentVisitor.is_hostel_merchant;
    }, [currentVisitor]);

    const onSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setComposerImages((prev) => [...prev, ...files].slice(0, 8)); // cap to reasonable number
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

            const { error } = await supabase
                .from('hostel_product_updates')
                .insert({
                    post_description: composerText.trim(),
                    post_images: uploadedUrls,
                    merchant_id: currentVisitor.id, // FK to unique_visitors
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
        <main className="min-h-screen bg-gray-900">
            <Toaster position="top-center" richColors />

            {/* Header container spacing to match HomePage */}
            <div className="w-full max-w-2xl mx-auto px-2">
                <Header onAuthClick={() => setShowAuthModal(true)}/>
            </div>

            {selectedSchoolId ? (
                <main className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen">
                    {/* Post Composer Area */}
                    {canPost && (
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
                                <textarea
                                    value={composerText}
                                    onChange={(e) => setComposerText(e.target.value)}
                                    placeholder="What are you selling?"
                                    className="w-full bg-transparent text-white text-xl placeholder-gray-500 outline-none resize-none"
                                    rows={2}
                                />

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
                                        <label
                                            htmlFor="image-upload"
                                            className={`text-emerald-500 hover:bg-emerald-500/10 p-2 rounded-full transition-colors cursor-pointer`}
                                        >
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5"><path fill="currentColor" d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2M8.5 12.5l2.5 3l3.5-4.5L19 17H5m3-7a2 2 0 1 1 2-2a2 2 0 0 1-2 2Z"/></svg>
                                        </label>
                                    </div>
                                    <button
                                        onClick={handlePost}
                                        disabled={posting || (!composerText.trim() && composerImages.length === 0)}
                                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors"
                                    >
                                        {posting ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feed Divider */}
                    {/* <div className="h-2 bg-[#2f3336]"></div> */}


                    {/* Main Feed Area */}
                    <div className="flex flex-col">
                        {loadingFeed ? (
                            <div className="p-4 text-sm text-[#8b98a5] text-center">Loading updates...</div>
                        ) : feed.length === 0 ? (
                            <div className="p-4 text-sm text-[#8b98a5] text-center">No updates yet.</div>
                        ) : (
                            feed.map((item) => {
                                const visitor = item.unique_visitors as UniqueVisitor | undefined;
                                const initials = String(visitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
                                const name = visitor?.full_name || 'User';
                                // Use the at-handle format from the screenshot
                                const handle = `@${name.toLowerCase().replace(/\s/g, '').slice(0, 7)}b`;
                                const hostel = visitor?.hostels?.name;
                                const room = visitor?.room ? `Room ${visitor.room}` : '';
                                // const location = [hostel, room].filter(Boolean).join(' • ');
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
                </main>
            ) : (
                <ConfirmUniversityModal
                    isOpen={showConfirmUniversityModal || !selectedSchoolId}
                    onClose={() => setShowConfirmUniversityModal(false)}
                    initialSchoolId={selectedSchoolId}
                    onConfirm={handleConfirmUniversity}
                />
            )}

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

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => setShowAuthModal(false)}
            />
        </main>
    );
}