import { Trash2 } from 'lucide-react';
import { HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';
import ContactSellerButton from '../ContactSellerButton';

const formatTimeAgo = (timestamp: string): string => {
    const diffInHours = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return '<1h';
    if (diffInHours < 24) return `${diffInHours}h`;
    return new Date(timestamp).toLocaleDateString();
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
    currentUserId?: string;
    openImageModal: (images: string[], startIndex: number) => void;
    onDelete?: (id: string) => void;
}

export default function ProductFeedItem({ item, currentUserId, openImageModal, onDelete }: ProductFeedItemProps) {
    const visitor = item.unique_visitors as UniqueVisitor | undefined;
    const postType = (item as any).post_type || 'update';
    const isRequest = postType === 'request';
    const initials = String(visitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
    const name = visitor?.full_name || 'User';
    const handle = `@${name.toLowerCase().replace(/\s/g, '').slice(0, 7)}b`;
    const hostel = visitor?.hostels?.name;
    const room = visitor?.room ? `Room ${visitor.room}` : '';
    const timeAgo = formatTimeAgo(item.created_at);

    const isOwnPost = currentUserId && visitor?.id === currentUserId;

    return (
        <article className={`border-b border-gray-800 p-4 transition-colors relative ${
            isRequest
                ? 'bg-gray-900/40 hover:bg-gray-800/20'
                : 'hover:bg-gray-800/30'
        }`}>
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
                            {isRequest && (
                                <>
                                    <span className="text-gray-500">·</span>
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/50">REQUEST</span>
                                </>
                            )}
                            <span className="text-gray-500">·</span>
                            <span className={`font-semibold ${
                                isRequest ? 'text-blue-400' : 'text-gray-500'
                            }`}>{timeAgo}</span>
                        </div>
                        {isOwnPost && onDelete && (
                            <button
                                onClick={() => onDelete(item.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                                aria-label="Delete post"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {!isRequest && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                            <span>{hostel}</span>
                            <span>·</span>
                            {room && <span>{room}</span>}
                        </div>
                    )}

                    {item.post_description && (
                        <p className="text-white mt-2 text-[15px] leading-normal whitespace-pre-wrap">
                            {item.post_description}
                        </p>
                    )}

                    {renderImageGrid(item.post_images, openImageModal)}

                    <div className="mt-3">
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
                    </div>
                </div>
            </div>
        </article>
    );
}
