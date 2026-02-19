import React, { useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { supabase } from '../../lib/supabase';
import { getUserId } from '../../hooks/useTracking';
import { toggleProductLike, getProductLikeInfo } from '../../lib/merchantAnalytics';
import { toast } from 'sonner';

interface ProductDetailSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    product?: any;
    isAdmin?: boolean;
}

export const ProductDetailSheetV2: React.FC<ProductDetailSheetV2Props> = ({
    isOpen,
    onClose,
    product,
    isAdmin
}) => {
    const controls = useAnimation();
    const [likeInfo, setLikeInfo] = React.useState({ likeCount: 0, isLiked: false });

    useEffect(() => {
        if (isOpen && product?.id) {
            controls.start({ y: 0 });
            // Fetch real like info
            getProductLikeInfo(product.id).then(setLikeInfo);
        }
    }, [isOpen, controls, product?.id]);

    const handleToggleLike = async () => {
        if (!product?.id) return;

        // Optimistic update
        const wasLiked = likeInfo.isLiked;
        const newIsLiked = !wasLiked;
        setLikeInfo(prev => ({
            isLiked: newIsLiked,
            likeCount: newIsLiked ? prev.likeCount + 1 : prev.likeCount - 1
        }));

        const result = await toggleProductLike(product.id, product.actual_user_id || null);

        // If failed, revert
        if (!result.success) {
            setLikeInfo(prev => ({
                isLiked: wasLiked,
                likeCount: wasLiked ? prev.likeCount + 1 : prev.likeCount - 1
            }));
            toast.error('Failed to update like');
        }
    };

    if (!isOpen) return null;

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        } else {
            controls.start({ y: 0 });
        }
    };

    const sellerName = product?.unique_visitors?.brand_name || product?.unique_visitors?.full_name || 'Verified Merchant';
    const sellerLocation = product?.unique_visitors?.hostels?.name || product?.unique_visitors?.schools?.short_name || 'Campus';
    const sellerPhoto = product?.unique_visitors?.profile_picture;

    // Handle multiple images correctly
    const productImages = product?.post_images && product.post_images.length > 0
        ? product.post_images
        : ['/v2/assets/niacinamide_serum_product_1771272568186.png'];

    const handleWhatsApp = () => {
        if (!product?.unique_visitors?.phone_number) return;
        const msg = encodeURIComponent(`Hi ${sellerName}, I'm interested in your ${product.post_description} on UniStore!`);
        window.open(`https://wa.me/${product.unique_visitors.phone_number.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    };

    const handleCall = () => {
        if (!product?.unique_visitors?.phone_number) return;
        window.location.href = `tel:${product.unique_visitors.phone_number}`;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end lg:items-center lg:justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md cursor-pointer"
                />

                {/* Sheet/Modal */}
                <motion.div
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    initial={{ y: "100%" }}
                    animate={controls}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full lg:max-w-5xl h-[85vh] lg:h-[750px] bg-[#f8f6f5] dark:bg-[#1a110c] rounded-t-[3rem] lg:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row z-10"
                >
                    {/* Left: Product Images (Scrollable on mobile, Left side on desktop) */}
                    <div className="w-full lg:w-[60%] h-[40%] lg:h-full relative group">
                        <Swiper
                            modules={[Pagination]}
                            pagination={{ clickable: true }}
                            className="w-full h-full product-swiper"
                        >
                            {productImages.map((img: string, i: number) => (
                                <SwiperSlide key={i}>
                                    <img
                                        src={img}
                                        className="w-full h-full object-cover lg:object-center"
                                        alt={`Product ${i + 1}`}
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        <div className="absolute top-6 left-6 z-20 flex gap-2">
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-lg flex items-center justify-center text-white ring-1 ring-white/20 transition-all hover:bg-white hover:text-primary active:scale-95"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Product Details (Scrollable content) */}
                    <div className="w-full lg:w-[40%] h-[60%] lg:h-full flex flex-col bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl lg:border-l border-black/5 dark:border-white/5 relative">
                        {/* Scrollable Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 pb-32 lg:pb-40">
                            {/* Seller & Rating Header */}
                            <div className="flex items-start justify-between mb-8 gap-4">
                                <div className="flex items-center gap-3 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-full ring-2 ring-primary ring-offset-4 ring-offset-[#f8f6f5] dark:ring-offset-[#1a110c] overflow-hidden bg-zinc-100 transition-transform group-hover:scale-105">
                                        {sellerPhoto ? (
                                            <img src={sellerPhoto} className="w-full h-full object-cover" alt={sellerName} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary font-black uppercase">{sellerName.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-black text-[#1a2a40] dark:text-zinc-100 tracking-tight group-hover:text-primary transition-colors">{sellerName}</span>
                                            <span className="material-symbols-outlined text-primary text-[14px] fill-1">verified</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-emerald-500 text-[10px]">location_on</span>
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{sellerLocation}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${likeInfo.isLiked ? 'bg-red-500/10 text-red-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                    <span className={`material-symbols-outlined text-sm ${likeInfo.isLiked ? 'fill-1' : ''}`}>favorite</span>
                                    <span className="text-xs font-black">{likeInfo.likeCount}</span>
                                </div>
                            </div>

                            {/* Product Title & Category */}
                            <div className="mb-8">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Premium Update</span>
                                <h2 className="text-3xl lg:text-4xl font-black text-[#1a2a40] dark:text-white leading-tight tracking-tight mb-2 underline decoration-primary/20 decoration-8 underline-offset-[-2px]">{product.post_description}</h2>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-bold text-[#1a2a40]/60 dark:text-white/40 uppercase tracking-widest">{product.post_type}</span>
                                    <span className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-bold text-[#1a2a40]/60 dark:text-white/40 uppercase tracking-widest">Available</span>
                                </div>
                            </div>

                            {/* Price Section */}
                            <div className="mb-8 p-6 bg-primary/5 dark:bg-primary/20 rounded-[2rem] border border-primary/10">
                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1.5">Best Price</p>
                                <div className="flex items-end gap-3 flex-wrap">
                                    <span className="text-4xl lg:text-5xl font-black text-primary tracking-tighter leading-none">₦{Number(product.price)?.toLocaleString() || '0'}</span>
                                    {product.discount_price && (
                                        <span className="text-base lg:text-lg font-bold text-zinc-400 line-through mb-1">₦{Number(product.discount_price)?.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>

                            {/* Features/Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-black/[0.03] dark:border-white/5">
                                    <span className="material-symbols-outlined text-primary mb-2">schedule</span>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Posted</p>
                                    <p className="text-xs font-black dark:text-white tracking-tight">{new Date(product.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-black/[0.03] dark:border-white/5">
                                    <span className="material-symbols-outlined text-primary mb-2">inventory_2</span>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Condition</p>
                                    <p className="text-xs font-black dark:text-white tracking-tight">Like New</p>
                                </div>
                            </div>

                            {/* Description placeholder if needed */}
                            {product.post_description_detailed && (
                                <div className="mb-10">
                                    <h4 className="text-xs font-black text-[#1a2a40]/40 dark:text-white/40 uppercase tracking-[0.2em] mb-4">About the item</h4>
                                    <p className="text-base text-[#1a2a40]/70 dark:text-white/70 leading-relaxed font-medium">
                                        {product.post_description_detailed}
                                    </p>
                                </div>
                            )}

                            {/* Sticky Bottom Action Bar within scroll container or absolute */}
                            <div className="px-6 py-6 lg:py-8 bg-[#f8f6f5]/90 dark:bg-[#221610]/95 backdrop-blur-3xl border-t border-black/5 dark:border-white/5 flex items-center gap-4 shrink-0 mt-auto">
                                <button
                                    onClick={handleToggleLike}
                                    className={`h-14 w-14 rounded-full border-2 flex items-center justify-center transition-all active:scale-95 ${likeInfo.isLiked ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500'}`}
                                >
                                    <span className={`material-symbols-outlined text-[28px] ${likeInfo.isLiked ? 'fill-1' : ''}`}>favorite</span>
                                </button>
                                <button
                                    onClick={handleWhatsApp}
                                    className="h-14 flex-1 bg-primary text-white font-black rounded-3xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:bg-primary/90 transition-all active:scale-95 uppercase tracking-widest text-xs"
                                >
                                    <span className="material-symbols-outlined fill-1">chat</span>
                                    Order Now
                                </button>
                                <button
                                    onClick={handleCall}
                                    className="h-14 w-14 rounded-full border-2 border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-2xl fill-1">call</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
