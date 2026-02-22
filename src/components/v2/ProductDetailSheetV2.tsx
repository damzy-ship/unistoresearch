import React, { useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { supabase } from '../../lib/supabase';
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
    const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);

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

    useEffect(() => {
        if (isOpen && product?.id) {
            controls.start({ y: 0 });
            // Fetch real like info (commented out per request)
            // getProductLikeInfo(product.id).then(setLikeInfo);
        }
    }, [isOpen, controls, product?.id]);

    /*
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
    */

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
                    className="relative w-full lg:max-w-5xl h-[92vh] lg:h-[750px] bg-[#f8f6f5] dark:bg-[#1a110c] rounded-t-[3rem] lg:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row z-10"
                >
                    {/* Drag Handle - Mobile Only */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/40 dark:bg-white/20 rounded-full z-[30] lg:hidden" />

                    {/* Left: Product Images (Scrollable on mobile, Left side on desktop) */}
                    <div className="w-full lg:w-[60%] h-[45%] lg:h-full relative group p-2.5 lg:p-0">
                        <div className="w-full h-full relative [&_.swiper-pagination]:!bottom-0 lg:[&_.swiper-pagination]:!bottom-[2rem]">
                            <Swiper
                                modules={[Pagination, Navigation]}
                                pagination={{ clickable: true }}
                                navigation={{
                                    prevEl: '.swiper-button-prev-custom',
                                    nextEl: '.swiper-button-next-custom',
                                }}
                                className="w-full h-full product-swiper group/swiper"
                            >
                                {productImages.map((img: string, i: number) => (
                                    <SwiperSlide key={i} className="pb-8 lg:pb-0">
                                        <div className="w-full h-full rounded-[2.5rem] lg:rounded-none overflow-hidden shadow-lg lg:shadow-none bg-zinc-100 dark:bg-[#1a110c]">
                                            <img
                                                src={img}
                                                className="w-full h-full object-cover lg:object-center cursor-pointer active:scale-[0.98] transition-transform"
                                                onClick={() => setSelectedImageIndex(i)}
                                                alt={`Product ${i + 1}`}
                                            />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>

                        <div className="absolute top-6 left-6 z-20 flex gap-2">
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-lg flex items-center justify-center text-white ring-1 ring-white/20 transition-all hover:bg-white hover:text-primary active:scale-95"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm('Are you sure you want to delete this product?')) return;

                                        const { error } = await supabase
                                            .from('merchant_products')
                                            .delete()
                                            .eq('id', product.id);

                                        if (error) {
                                            toast.error('Failed to delete product');
                                        } else {
                                            toast.success('Product deleted successfully');
                                            onClose();
                                            window.dispatchEvent(new CustomEvent('hostel-feed-refresh'));
                                        }
                                    }}
                                    className="w-10 h-10 rounded-full bg-red-500/80 backdrop-blur-xl shadow-lg flex items-center justify-center text-white ring-1 ring-red-500/20 transition-all hover:bg-red-600 active:scale-95"
                                    title="Delete product (Admin)"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            )}
                        </div>

                        {/* Navigation Arrows - Desktop Only */}
                        <div className="absolute inset-y-0 left-0 right-0 z-20 hidden lg:flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <button className="swiper-button-prev-custom w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-all pointer-events-auto active:scale-90">
                                <span className="material-symbols-outlined !text-3xl">chevron_left</span>
                            </button>
                            <button className="swiper-button-next-custom w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-all pointer-events-auto active:scale-90">
                                <span className="material-symbols-outlined !text-3xl">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Product Details (Scrollable content) */}
                    <div className="w-full lg:w-[40%] h-[55%] lg:h-full flex flex-col bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl lg:border-l border-black/5 dark:border-white/5 relative">
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
                                {/* Likes hidden per user request
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${likeInfo.isLiked ? 'bg-red-500/10 text-red-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                    <span className={`material-symbols-outlined text-sm ${likeInfo.isLiked ? 'fill-1' : ''}`}>favorite</span>
                                    <span className="text-xs font-black">{likeInfo.likeCount}</span>
                                </div>
                                */}
                            </div>

                            {/* Product Title & Category */}
                            <div className="mb-8">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Premium Update</span>
                                <h2 className="text-2xl lg:text-4xl font-black text-[#1a2a40] dark:text-white leading-tight tracking-tight mb-2 underline decoration-primary/20 decoration-8 underline-offset-[-2px]">{product.post_description}</h2>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-bold text-[#1a2a40]/60 dark:text-white/40 uppercase tracking-widest">{product.post_type}</span>
                                    <span className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-bold text-[#1a2a40]/60 dark:text-white/40 uppercase tracking-widest">Available</span>
                                </div>
                            </div>

                            {/* Price Section */}
                            <div className="mb-8 p-6 bg-primary/5 dark:bg-primary/20 rounded-[2rem] border border-primary/10">
                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1.5">Best Price</p>
                                <div className="flex items-end gap-3 flex-wrap">
                                    {product.discount_price ? (
                                        <>
                                            <span className="text-4xl lg:text-5xl font-black text-primary tracking-tighter leading-none">₦{Number(product.discount_price).toLocaleString()}</span>
                                            <span className="text-base lg:text-lg font-bold text-zinc-400 line-through mb-1">₦{Number(product.price).toLocaleString()}</span>
                                        </>
                                    ) : (
                                        <span className="text-4xl lg:text-5xl font-black text-primary tracking-tighter leading-none">₦{Number(product.price).toLocaleString()}</span>
                                    )}
                                </div>
                            </div>

                            {/* Features/Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-black/[0.03] dark:border-white/5">
                                    <span className="material-symbols-outlined text-primary mb-2">schedule</span>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Posted</p>
                                    <p className="text-xs font-black dark:text-white tracking-tight">{product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Today'}</p>
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
                                {/* Likes hidden per user request
                                <button
                                    onClick={handleToggleLike}
                                    className={`h-14 w-14 rounded-full border-2 flex items-center justify-center transition-all active:scale-95 ${likeInfo.isLiked ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500'}`}
                                >
                                    <span className={`material-symbols-outlined text-[28px] ${likeInfo.isLiked ? 'fill-1' : ''}`}>favorite</span>
                                </button>
                                */}
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

            {/* Fullscreen Image Viewer Modal */}
            {selectedImageIndex !== null && productImages && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-0">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        onClick={() => setSelectedImageIndex(null)}
                    />

                    {productImages.length > 1 && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[210] bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold tracking-widest border border-white/10">
                            {selectedImageIndex + 1} / {productImages.length}
                        </div>
                    )}

                    <button
                        onClick={() => setSelectedImageIndex(null)}
                        className="absolute top-6 right-6 z-[210] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md transition-colors border border-white/10"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>

                    {productImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex((prev) =>
                                        prev !== null ? (prev > 0 ? prev - 1 : productImages.length - 1) : null
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
                                        prev !== null ? (prev < productImages.length - 1 ? prev + 1 : 0) : null
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
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative z-[205] w-full max-w-5xl max-h-[100vh]"
                        drag={window.innerWidth < 1024 ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.8}
                        onDragEnd={(_e: any, info: any) => {
                            if (info.offset.x < -50 && selectedImageIndex < productImages.length - 1) {
                                setSelectedImageIndex(selectedImageIndex + 1);
                            } else if (info.offset.x > 50 && selectedImageIndex > 0) {
                                setSelectedImageIndex(selectedImageIndex - 1);
                            } else if (Math.abs(info.offset.y) > 100) {
                                setSelectedImageIndex(null); // Optional: swipe down to close
                            }
                        }}
                    >
                        <img
                            src={productImages[selectedImageIndex]}
                            alt={`Fullscreen ${selectedImageIndex + 1}`}
                            className="w-full h-full max-h-[85vh] object-contain drop-shadow-2xl"
                            draggable={false}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
