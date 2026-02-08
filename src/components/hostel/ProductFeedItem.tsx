import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { HostelsProductUpdates, UniqueVisitor, supabase } from '../../lib/supabase';
import ContactSellerButton from '../ContactSellerButton';
import { useState } from 'react';
import { Button } from '../ui/Button';

const formatTimeAgo = (timestamp: string): string => {
    const diffInHours = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
};

const renderImageGrid = (images: string[], openModal: (images: string[], startIndex: number) => void) => {
    if (!images || images.length === 0) return null;

    const count = images.length;
    const gridClass = count === 1 ? 'grid-cols-1' : 'grid-cols-2';

    return (
        <div className={`mt-3 grid ${gridClass} gap-1.5 rounded-2xl overflow-hidden`}>
            {images.slice(0, 4).map((url, idx) => {
                const isThreeLeft = count === 3 && idx === 0;
                const containerClasses = `relative overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 ${isThreeLeft ? 'col-span-2' : ''} ${count === 1 ? 'aspect-[4/3]' : 'aspect-square'}`;

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
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />

                        {count > 4 && idx === 3 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold text-xl backdrop-blur-sm">
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
    currentVisitor?: UniqueVisitor | null;
    openImageModal: (images: string[], startIndex: number) => void;
    onDelete?: (id: string) => void;
    discountValue?: number;
    onContactMerchant?: (item: HostelsProductUpdates) => void;
    onRecommend?: (item: HostelsProductUpdates) => void;
    onUserClick?: (user: UniqueVisitor) => void;
}

export default function ProductFeedItem({
    item,
    currentVisitor,
    openImageModal,
    onDelete,
    discountValue,
    onContactMerchant,
    onRecommend,
    onUserClick
}: ProductFeedItemProps) {
    const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);

    // Local state to track fulfilled status, initialized from prop
    const [isFulfilled, setIsFulfilled] = useState(item.fulfilled || false);

    const handleIHaveIt = () => {
        onContactMerchant?.(item);
    };

    const handleRecommend = () => {
        onRecommend?.(item);
    };

    const handleMarkFulfilled = async () => {
        try {
            const { error } = await supabase
                .from('hostel_product_updates')
                .update({ fulfilled: true })
                .eq('id', item.id);

            if (error) throw error;
            setIsFulfilled(true);
            setIsFulfillModalOpen(false);
        } catch (error) {
            console.error('Error marking request as fulfilled:', error);
        }
    };

    const visitor = item.unique_visitors as UniqueVisitor | undefined;
    const initials = String(visitor?.brand_name || visitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
    const name = visitor?.brand_name || visitor?.full_name || 'User';
    const hostel = visitor?.hostels?.name;
    const room = visitor?.room ? ` Room ${visitor.room}` : '';
    const timeAgo = formatTimeAgo(item.created_at);

    const isOwnPost = currentVisitor?.id && visitor?.id === currentVisitor?.id;
    const isRequest = item.post_type === 'request';
    const isAdmin = currentVisitor?.is_admin === true;

    const handleProfileClick = () => {
        if (visitor && onUserClick) {
            onUserClick(visitor);
        }
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
            className={`
                bg-white dark:bg-gray-900 
                border-b border-gray-100 dark:border-gray-800
                pb-4 mb-4
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 mb-3">
                <div className="flex items-center gap-3">
                    <div
                        onClick={handleProfileClick}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700"
                    >
                        {visitor?.profile_picture ? (
                            <img src={visitor.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold text-gray-500">{initials}</span>
                        )}
                    </div>
                    <div>
                        <div onClick={handleProfileClick} className="font-bold text-sm text-gray-900 dark:text-white cursor-pointer hover:underline">
                            {name}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
                            <span>{timeAgo}</span>
                            {hostel && (
                                <>
                                    <span>·</span>
                                    <span>{hostel}{room}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Badges & Actions */}
                <div className="flex items-center gap-2">
                    {isRequest && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${isFulfilled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {isFulfilled ? 'Found' : 'Request'}
                        </span>
                    )}

                    {(isOwnPost || isAdmin) && onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                            onClick={() => onDelete(item.id)}
                        >
                            <Icon icon="mdi:delete" width={16} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-4">
                {item.post_description && (
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isRequest ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                        {item.post_description}
                    </p>
                )}

                {item.price != null && !isRequest && (
                    <div className="mt-2 flex items-baseline gap-2">
                        {discountValue && discountValue > 0 ? (
                            <>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ₦{Math.max(0, Number(item.price) - discountValue).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-400 line-through decoration-gray-400/50">
                                    ₦{Number(item.price).toLocaleString()}
                                </span>
                            </>
                        ) : (
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                ₦{Number(item.price).toLocaleString()}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Images */}
            {item.post_images && item.post_images.length > 0 && (
                <div className="mt-3 px-4">
                    {renderImageGrid(item.post_images, openImageModal)}
                </div>
            )}

            {/* Action Bar */}
            <div className="px-4 mt-4">
                {!isOwnPost && !isRequest && (
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <ContactSellerButton
                                product={{
                                    product_description: item.post_description,
                                    phone_number: visitor?.phone_number || '',
                                    school_short_name: visitor?.schools?.short_name,
                                    merchant_id: visitor?.id,
                                }}
                            >
                                <Button className="w-full" variant="primary">
                                    <Icon icon="mdi:message-text" width={18} className="mr-2" />
                                    Message Seller
                                </Button>
                            </ContactSellerButton>
                        </div>
                        {/* <Button variant="secondary" size="icon" className="shrink-0">
                            <Heart size={20} />
                        </Button> */}
                    </div>
                )}

                {!isOwnPost && isRequest && !isFulfilled && (
                    <div className="flex gap-3">
                        <Button
                            onClick={handleIHaveIt}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white border-transparent"
                        >
                            I Have It
                        </Button>
                        <Button
                            onClick={handleRecommend}
                            variant="secondary"
                            className="flex-1"
                        >
                            Recommend
                        </Button>
                    </div>
                )}

                {(isOwnPost || isAdmin) && isRequest && !isFulfilled && (
                    <Button
                        onClick={() => setIsFulfillModalOpen(true)}
                        variant="outline"
                        className="w-full mt-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                    >
                        Mark as Found
                    </Button>
                )}
            </div>

            {/* Fulfill Modal - Kept as inline modal or could be drawer */}
            {isFulfillModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setIsFulfillModalOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Found what you need?
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            Marking this as found will hide action buttons for other users.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setIsFulfillModalOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleMarkFulfilled}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                            >
                                Yes, Found It
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </motion.article>
    );
}