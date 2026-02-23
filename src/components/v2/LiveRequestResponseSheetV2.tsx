import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimeAgo } from '../../lib/utils';
import { toast } from 'sonner';

interface LiveRequestResponseSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    request: any;
    currentVisitorId?: string;
    isAdmin?: boolean;
}

export const LiveRequestResponseSheetV2: React.FC<LiveRequestResponseSheetV2Props> = ({
    isOpen,
    onClose,
    request,
    currentVisitorId,
    isAdmin
}) => {
    const isOwner = request?.actual_user_id === currentVisitorId;
    const isOwnerOrAdmin = isOwner || isAdmin;
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    // Prevent body scroll when image viewer is open
    useEffect(() => {
        if (selectedImageIndex !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [selectedImageIndex]);

    const handleContactRequester = () => {
        if (!currentVisitorId) {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }

        const phone = request?.unique_visitors?.phone_number;
        if (!phone) {
            alert('Contact not available for this requester');
            return;
        }

        const message = `Hi! I saw your request: "${request?.post_description || request?.text || ''}". I have this item available!`;
        const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        onClose();
    };

    const handleRecommendProduct = () => {
        if (!currentVisitorId) {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }

        const phone = request?.unique_visitors?.phone_number;
        if (!phone) {
            toast.error('Requester phone number not available');
            return;
        }

        const message = `Hi ${request.unique_visitors.full_name}, I have a recommendation for your request on Unistore: "${request.post_description || request.text || 'an item'}"`;
        const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[110] flex items-end lg:items-center lg:justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
                            onClick={onClose}
                        />

                        {/* The Sheet */}
                        <motion.div
                            drag={window.innerWidth < 1024 ? "y" : false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(_e: any, info: any) => {
                                if (info.offset.y > 100) onClose();
                            }}
                            initial={{ y: window.innerWidth < 1024 ? '100%' : 20, opacity: window.innerWidth < 1024 ? 1 : 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: window.innerWidth < 1024 ? '100%' : 20, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative flex w-full lg:max-w-xl flex-col rounded-t-[3rem] lg:rounded-[3rem] bg-[#f8f6f5] dark:bg-[#221610] shadow-2xl overflow-hidden border-t lg:border border-white/20 z-10 p-6 pb-12"
                        >
                            {/* Handle - Mobile Only */}
                            <div className="flex justify-center mb-6 lg:hidden">
                                <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                            </div>

                            {/* Request Preview */}
                            <div className="flex flex-col gap-4 mb-8 p-5 bg-white dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Item Requested</p>
                                        <h4 className="text-[#1a2a40] dark:text-white font-bold leading-tight mb-3 text-lg">
                                            "{request?.post_description || request?.text || 'I am looking for something...'}"
                                        </h4>
                                    </div>
                                    {request?.post_images?.length > 0 && (
                                        <div
                                            className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-black/5 cursor-pointer shadow-sm hover:ring-2 hover:ring-primary/50 transition-all z-20 relative group"
                                            onClick={() => setSelectedImageIndex(0)}
                                        >
                                            <img src={request.post_images[0]} alt="Request main" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-1">
                                                <span className="material-symbols-outlined text-white text-xl">zoom_in</span>
                                                {request.post_images.length > 1 && (
                                                    <span className="text-white text-[10px] font-bold">1/{request.post_images.length}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {request?.post_images?.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mt-2">
                                        {request.post_images.slice(1).map((img: string, i: number) => (
                                            <div
                                                key={i + 1}
                                                className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/5 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all relative group"
                                                onClick={() => setSelectedImageIndex(i + 1)}
                                            >
                                                <img src={img} alt={`Request ${i + 2}`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="material-symbols-outlined text-white text-sm">zoom_in</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[12px] text-primary">schedule</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                        {request?.created_at ? formatTimeAgo(request.created_at) : 'Just now'}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-[#1a2a40] dark:text-white mb-5 px-1">
                                {isOwner ? 'Manage your request' : (isAdmin ? 'Manage & Respond' : 'How would you like to respond?')}
                            </h3>

                            <div className="space-y-4">
                                {!isOwner && (
                                    <>
                                        {/* Option 1: Sell */}
                                        <button
                                            onClick={handleContactRequester}
                                            className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-2xl">storefront</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg leading-tight text-white">I have this item</p>
                                                    <p className="text-white/80 text-xs mt-1">Contact requester to sell yours</p>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-xl">arrow_forward_ios</span>
                                        </button>

                                        {/* Option 2: Recommend */}
                                        <button
                                            onClick={handleRecommendProduct}
                                            className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all text-left shadow-sm mt-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                                                    <span className="material-symbols-outlined text-2xl">recommend</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg leading-tight text-[#1a2a40] dark:text-white">Recommend Product</p>
                                                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Suggest an existing product</p>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-zinc-400 text-xl">arrow_forward_ios</span>
                                        </button>
                                    </>
                                )}

                                {isOwnerOrAdmin && (
                                    <>
                                        {/* Admin/Owner: Mark as fulfilled */}
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Are you sure you want to mark this request as fulfilled?')) return;
                                                const { supabase } = await import('../../lib/supabase');
                                                const { error } = await supabase
                                                    .from('hostel_product_updates')
                                                    .update({ fulfilled: true })
                                                    .eq('id', request.id);
                                                if (!error) {
                                                    toast.success('Request marked as fulfilled');
                                                    onClose();
                                                    window.dispatchEvent(new CustomEvent('hostel-feed-refresh'));
                                                } else {
                                                    toast.error('Failed to update request');
                                                }
                                            }}
                                            className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg leading-tight text-white">Mark Fulfilled</p>
                                                    <p className="text-white/80 text-xs mt-1">Hide this request from the active feed</p>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-xl">check</span>
                                        </button>

                                        {/* Admin/Owner: Delete */}
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Are you sure you want to delete this request?')) return;
                                                const { supabase } = await import('../../lib/supabase');
                                                const { error } = await supabase
                                                    .from('hostel_product_updates')
                                                    .delete()
                                                    .eq('id', request.id);
                                                if (!error) {
                                                    toast.success('Request deleted');
                                                    onClose();
                                                    window.dispatchEvent(new CustomEvent('hostel-feed-refresh'));
                                                } else {
                                                    toast.error('Failed to delete request');
                                                }
                                            }}
                                            className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-red-500 text-white shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-2xl">delete</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg leading-tight text-white">Delete Request</p>
                                                    <p className="text-white/80 text-xs mt-1">Permanently remove this from the live feed</p>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-xl">close</span>
                                        </button>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={onClose}
                                className="mt-8 w-full py-5 text-zinc-400 dark:text-zinc-500 font-bold hover:text-primary transition-colors text-sm uppercase tracking-widest"
                            >
                                Nevermind
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fullscreen Image Viewer Modal */}
            <AnimatePresence>
                {selectedImageIndex !== null && request?.post_images && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                            onClick={() => setSelectedImageIndex(null)}
                        />

                        <div className="absolute top-6 right-6 z-[210] flex items-center gap-4">
                            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold text-sm tracking-widest border border-white/10">
                                {selectedImageIndex + 1} / {request.post_images.length}
                            </div>
                            <button
                                onClick={() => setSelectedImageIndex(null)}
                                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 active:scale-95 flex items-center justify-center text-white backdrop-blur-md transition-all border border-white/10"
                            >
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>

                        {/* Navigation Arrows (Desktop) */}
                        {request.post_images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex((prev) =>
                                            prev !== null ? (prev > 0 ? prev - 1 : request.post_images.length - 1) : null
                                        );
                                    }}
                                    className="hidden lg:flex absolute left-8 z-[210] w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white backdrop-blur-md transition-all border border-white/10"
                                >
                                    <span className="material-symbols-outlined text-3xl">chevron_left</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex((prev) =>
                                            prev !== null ? (prev < request.post_images.length - 1 ? prev + 1 : 0) : null
                                        );
                                    }}
                                    className="hidden lg:flex absolute right-8 z-[210] w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white backdrop-blur-md transition-all border border-white/10"
                                >
                                    <span className="material-symbols-outlined text-3xl">chevron_right</span>
                                </button>
                            </>
                        )}

                        <motion.div
                            key={selectedImageIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative z-[205] w-full max-w-5xl max-h-[100vh]"
                            drag={window.innerWidth < 1024 ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.8}
                            onDragEnd={(_e: any, info: any) => {
                                if (info.offset.x < -50 && selectedImageIndex < request.post_images.length - 1) {
                                    setSelectedImageIndex(selectedImageIndex + 1);
                                } else if (info.offset.x > 50 && selectedImageIndex > 0) {
                                    setSelectedImageIndex(selectedImageIndex - 1);
                                } else if (Math.abs(info.offset.y) > 100) {
                                    setSelectedImageIndex(null); // Optional: swipe down to close
                                }
                            }}
                        >
                            <img
                                src={request.post_images[selectedImageIndex]}
                                alt={`Fullscreen ${selectedImageIndex + 1}`}
                                className="w-full h-full max-h-[85vh] object-contain drop-shadow-2xl"
                                draggable={false}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
