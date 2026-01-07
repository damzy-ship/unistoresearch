import { Trash2 } from 'lucide-react';
import { HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';
import ContactSellerButton from '../ContactSellerButton';
import AuthModal from '../AuthModal';
import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

const formatTimeAgo = (timestamp: string): string => {
    const diffInHours = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
    if (diffInHours < 1) return '<1h';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${diffInDays}d`;
};

const renderImageGrid = (images: string[], openModal: (images: string[], startIndex: number) => void) => {
    if (!images || images.length === 0) return null;

    const count = images.length;
    const gridClass = count === 1 ? 'grid-cols-1' : 'grid-cols-2';

    return (
        <div className={`mt-3 grid ${gridClass} gap-2`}>
            {images.slice(0, 4).map((url, idx) => {
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

interface ProductFeedItemProps {
    item: HostelsProductUpdates;
    currentVisitor?: UniqueVisitor;
    userIsHostelMerchant?: boolean;
    userIsAuthenticated?: boolean;
    openImageModal: (images: string[], startIndex: number) => void;
    onDelete?: (id: string) => void;
}

export default function ProductFeedItem({ item, currentVisitor, openImageModal, onDelete, userIsHostelMerchant, userIsAuthenticated }: ProductFeedItemProps) {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [showBecomeMerchantModal, setShowBecomeMerchantModal] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const { currentTheme } = useTheme();
    const [signInContext, setSignInContext] = useState<'merchant' | 'recommend'>('merchant');

    const handleIHaveIt = () => {
        if (!userIsAuthenticated) {
            setSignInContext('merchant');
            setShowSignInModal(true);
            return;
        }

        if (userIsHostelMerchant) {
            const phone = visitor?.phone_number;
            if (!phone) return;
            const msg = `hi there, i have ${item.post_description || ''}`;
            const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            setShowBecomeMerchantModal(true);
        }
    };

    const handleRecommend = () => {
        if (!userIsAuthenticated) {
            setSignInContext('recommend');
            setShowSignInModal(true);
            return;
        }

        const phone = visitor?.phone_number;
        if (!phone) return;
        const msg = `hi there, i have a recommendation for ${item.post_description || ''}`;
        const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(whatsappUrl, '_blank');
    };

    const visitor = item.unique_visitors as UniqueVisitor | undefined;
    const initials = String(visitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
    const name = visitor?.full_name || 'User';
    const handle = `@${name.toLowerCase().replace(/\s/g, '').slice(0, 7)}b`;
    const hostel = visitor?.hostels?.name;
    const room = visitor?.room ? `Room ${visitor.room}` : '';
    const timeAgo = formatTimeAgo(item.created_at);

    const isOwnPost = currentVisitor?.id && visitor?.id === currentVisitor?.id || currentVisitor?.is_admin;
    const isRequest = item.post_type === 'request';

    // Unique styling for request posts
    const articleClass = isRequest
        ? 'border-b border-gray-700 border-l-4 border-l-amber-500 p-4 bg-gray-900/40 hover:bg-gray-900/50 transition-colors relative' // Unique Request BG/Border
        : 'border-b border-gray-800 p-4 hover:bg-gray-800/30 transition-colors relative'; // Preserved non-request BG/Border

    const avatarBgClass = isRequest ? 'bg-amber-500' : 'bg-[#253341]'; // Unique Request Initials BG
    const initialsTextColor = isRequest ? 'text-gray-900' : 'text-[#8b98a5]'; // Unique Request Initials Color
    const nameClass = isRequest ? 'font-bold text-amber-300 hover:underline cursor-pointer' : 'font-bold text-white hover:underline cursor-pointer'; // Unique Request Name Color
    const handleClass = isRequest ? 'text-amber-500/70' : 'text-gray-500'; // Unique Request Handle Color

    const handleDeleteConfirm = () => {
        if (onDelete) {
            onDelete(item.id);
        }
        setIsConfirmModalOpen(false);
    };

    return (
        <article className={articleClass}>
            {/* Request Badge positioned at top-right with pop effect */}
            {isRequest && (
                <div className="absolute top-4 right-4 text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-400 text-gray-900 shadow-lg shadow-amber-500/30 z-10 animate-pulse-once">
                    ✨ REQUEST
                </div>
            )}

            <div className="flex gap-3">
                <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full ${avatarBgClass} flex items-center justify-center overflow-hidden`}>
                        {visitor?.profile_picture ? (
                            <img src={visitor.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className={`text-sm font-semibold ${initialsTextColor}`}>{initials}</span>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap text-sm">
                            <span className={nameClass}>{isRequest ? name.split(' ')[0] : name}</span>

                            {/* Original badge removed, new one is absolute position */}

                            <span className={handleClass}>{!isRequest ? handle : ''}</span>
                            <span className="text-gray-500">·</span>
                            <span className={isRequest ? 'text-amber-300 font-semibold' : 'text-gray-500'}>{timeAgo} ago</span>
                        </div>
                    </div>

                    {!isRequest && <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <span>{hostel}</span>
                        <span>·</span>
                        {room && <span>{room}</span>}
                    </div>}

                    {/* Adjusted text color for request description */}
                    {item.post_description && (
                        <p className={isRequest ? 'text-amber-100 mt-2 text-[15px] leading-normal whitespace-pre-wrap' : 'text-white mt-2 text-[15px] leading-normal whitespace-pre-wrap'}>
                            {item.post_description}
                        </p>
                    )}

                    {renderImageGrid(item.post_images, openImageModal)}

                    {!isOwnPost && !isRequest && <div className="mt-3">
                        <ContactSellerButton
                            product={{
                                product_description: item.post_description,
                                phone_number: visitor?.phone_number || '',
                                school_short_name: visitor?.schools?.short_name,
                                merchant_id: visitor?.id,
                            }}
                        >
                            Contact Seller
                        </ContactSellerButton>
                    </div>}

                    {!isOwnPost && isRequest && (
                        <div className="mt-3 flex gap-2 w-full">
                            <button
                                onClick={handleIHaveIt}
                                className={`flex-1 bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 font-medium`}
                            >
                                I have it
                            </button>
                            <button
                                onClick={handleRecommend}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 font-medium"
                            >
                                Recommend
                            </button>

                            {/* Modals */}
                            {showBecomeMerchantModal && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity"
                                    onClick={() => setShowBecomeMerchantModal(false)}
                                >
                                    <div
                                        className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-sm mx-4 transform transition-all"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h3 className="text-xl font-bold text-white mb-2">Become a hostel merchant</h3>
                                        <p className="text-gray-400 mb-6 text-sm">Hi {currentVisitor?.full_name}, you need to become a hostel merchant to be able to contact users.</p>

                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => setShowBecomeMerchantModal(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const whatsappUrl = `https://wa.me/2349082753819?text=${encodeURIComponent('hi, dami, i want to become a hostel merchant.')}`;
                                                    window.open(whatsappUrl, '_blank');
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 transition-colors"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showSignInModal && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity"
                                    onClick={() => setShowSignInModal(false)}
                                >
                                    <div
                                        className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-sm mx-4 transform transition-all"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            {signInContext === 'recommend' ? 'Sign in to recommend' : 'Sign in to contact'}
                                        </h3>
                                        <p className="text-gray-400 mb-6 text-sm">
                                            {signInContext === 'recommend'
                                                ? 'Sign in to include your recommendation.'
                                                : 'Sign in as a merchant to be able to contact users.'}
                                        </p>

                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => setShowSignInModal(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowSignInModal(false);
                                                    setShowAuthModal(true);
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 transition-colors"
                                            >
                                                Sign in
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
                        </div>
                    )}

                    {isOwnPost && onDelete && (
                        <div className='w-full flex justify-end mt-2'>
                            <button
                                onClick={() => onDelete(item.id)}
                                className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-lg text-red-500 border border-red-500 hover:bg-red-500/10 transition-colors"
                                aria-label="Delete post"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Post
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isConfirmModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity"
                    onClick={() => setIsConfirmModalOpen(false)} // Close when clicking outside
                >
                    <div
                        className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-sm mx-4 transform transition-all"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                    >
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Confirm Deletion
                        </h3>
                        <p className="text-gray-400 mb-6 text-sm">
                            Are you sure you want to delete this post? This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </article>


    );
}

// NOTE: Tailwind CSS classes like 'animate-pulse-once' are assumed to be defined
// or equivalent to what you use in your project for a single, eye-catching animation.