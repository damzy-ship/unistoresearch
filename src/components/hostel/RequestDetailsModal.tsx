import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MessageCircle, Share2, CheckCircle, Trash2 } from 'lucide-react';
import { HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';

interface RequestDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: HostelsProductUpdates | null;
    currentVisitor?: UniqueVisitor | null;
    onContact: (type: 'merchant' | 'recommend', item: HostelsProductUpdates) => void;
    onFulfill?: (item: HostelsProductUpdates) => void;
    onDelete?: (item: HostelsProductUpdates) => void;
}

export default function RequestDetailsModal({
    isOpen,
    onClose,
    request,
    currentVisitor,
    onContact,
    onFulfill,
    onDelete
}: RequestDetailsModalProps) {
    const { currentTheme } = useTheme();
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    if (!isOpen || !request) return null;

    const visitor = request.unique_visitors as UniqueVisitor | undefined;
    const initials = String(visitor?.brand_name || visitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
    const name = visitor?.brand_name || visitor?.full_name || 'User';

    // Check ownership or admin status
    const isOwner = currentVisitor && (currentVisitor.id === request.actual_user_id || (currentVisitor as any).is_admin);
    const isFulfilled = request.fulfilled;

    const images = request.post_images || [];
    const hasImages = images.length > 0;

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const formatTimeAgo = (timestamp: string): string => {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'Now';
            const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
            if (diffInSeconds < 60) return 'Just now';
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours}h ago`;
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        } catch { return 'Recently'; }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl max-h-[85vh] bg-gray-900 border border-gray-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md"
                        >
                            <X size={18} />
                        </button>

                        {/* Image Section (if exists) */}
                        {hasImages && (
                            <div className="relative w-full bg-black aspect-video sm:aspect-[16/9] flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                    src={images[activeImageIndex]}
                                    alt={`Request image ${activeImageIndex + 1}`}
                                    className="w-full h-full object-contain"
                                />

                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevImage}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={handleNextImage}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs text-white">
                                            {activeImageIndex + 1} / {images.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Content Section */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900">
                            <div className="p-4 md:p-6">
                                {/* User Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-bold shadow-inner ${isFulfilled ? 'bg-emerald-800/80 text-emerald-100' : 'bg-amber-800/80 text-amber-100'}`}>
                                            {visitor?.profile_picture ? (
                                                <img src={visitor.profile_picture} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                            ) : initials}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-base md:text-lg ${isFulfilled ? 'text-emerald-100' : 'text-amber-100'}`}>
                                                {name}
                                            </h3>
                                            <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wide">
                                                {formatTimeAgo(request.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border ${isFulfilled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                                        {isFulfilled ? 'Found' : 'Request'}
                                    </div>
                                </div>

                                {/* Request Description */}
                                <div className="prose prose-invert max-w-none">
                                    <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap ${isFulfilled ? 'text-gray-300' : 'text-gray-100'}`}>
                                        {request.post_description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-3 md:p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                            <div className={`flex ${isOwner ? 'flex-col md:flex-row' : 'flex-row'} gap-3`}>
                                {/* Standard Actions */}
                                <div className="flex-1 flex gap-2 md:gap-3 w-full">
                                    {!isFulfilled ? (
                                        <>
                                            <button
                                                onClick={() => onContact('merchant', request)}
                                                className={`flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-xl text-sm font-bold text-white shadow-lg bg-gradient-to-r ${visitor?.id === currentVisitor?.id ? 'from-gray-600 to-gray-700 opacity-50 cursor-not-allowed' : currentTheme.buttonGradient} hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 md:gap-2`}
                                                disabled={visitor?.id === currentVisitor?.id}
                                            >
                                                <MessageCircle size={16} className="md:w-[18px] md:h-[18px]" />
                                                I Have It
                                            </button>
                                            <button
                                                onClick={() => onContact('recommend', request)}
                                                className="flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-xl text-sm font-bold text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 md:gap-2"
                                                disabled={visitor?.id === currentVisitor?.id}
                                            >
                                                <Share2 size={16} className="md:w-[18px] md:h-[18px]" />
                                                Recommend
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full py-2.5 md:py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-center text-sm font-medium italic">
                                            Request functionality disabled (Fulfilled)
                                        </div>
                                    )}
                                </div>

                                {/* Admin Controls */}
                                {isOwner && (
                                    <div className="flex gap-2 md:gap-1 md:pl-3 md:border-l border-gray-700 w-full md:w-auto">
                                        {!isFulfilled && onFulfill && (
                                            <button
                                                onClick={() => onFulfill(request)}
                                                className="flex-1 md:flex-none p-2.5 md:p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center"
                                                title="Mark as Fulfilled"
                                            >
                                                <CheckCircle size={18} className="md:w-5 md:h-5" />
                                                <span className="md:hidden ml-2 font-semibold">Fulfill</span>
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(request)}
                                                className="flex-1 md:flex-none p-2.5 md:p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                                                title="Delete Request"
                                            >
                                                <Trash2 size={18} className="md:w-5 md:h-5" />
                                                <span className="md:hidden ml-2 font-semibold">Delete</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
