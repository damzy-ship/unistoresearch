import React, { useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { supabase } from '../../lib/supabase';
import { getUserId } from '../../hooks/useTracking';

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

    useEffect(() => {
        if (isOpen) {
            controls.start({ y: 0 });
        }
    }, [isOpen, controls]);

    if (!isOpen) return null;

    const FALLBACK_IMAGE = '/v2/assets/portable_speaker_product_1771272581168.png';

    // Map real data from hostel_product_updates schema
    const productTitle = product?.post_description || 'Product Details';
    const productPrice = product?.price?.toLocaleString() || '0';
    const productDiscount = product?.discount_price?.toLocaleString();
    const productCategory = product?.post_category || 'General';
    const sellerName = product?.unique_visitors?.brand_name || product?.unique_visitors?.full_name || 'Verified Merchant';
    const sellerLocation = product?.unique_visitors?.hostels?.name || product?.unique_visitors?.schools?.short_name || 'Campus';
    const sellerPhoto = product?.unique_visitors?.profile_picture;
    const productRating = '4.8'; // Placeholder for now

    // Handle multiple images correctly
    const productImages = product?.post_images && product.post_images.length > 0
        ? product.post_images
        : [FALLBACK_IMAGE];

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        } else {
            controls.start({ y: 0 });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end">
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
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        initial={{ y: '100%' }}
                        animate={controls}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative flex h-[85vh] w-full flex-col rounded-t-[3rem] bg-[#f8f6f5] dark:bg-[#221610] shadow-2xl overflow-hidden border-t border-white/20 z-10"
                    >
                        {/* Handle Bar Area - Explicitly for dragging */}
                        <div className="flex h-12 w-full items-center justify-center pt-2 cursor-grab active:cursor-grabbing shrink-0">
                            <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                            {/* Image Carousel Section */}
                            <div className="px-4">
                                <Swiper
                                    modules={[Autoplay, Pagination]}
                                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                                    pagination={{ clickable: true }}
                                    spaceBetween={12}
                                    loop={productImages.length > 1}
                                    className="w-full aspect-[4/5] rounded-[2.5rem] !pb-10"
                                >
                                    {productImages.map((img: string, i: number) => (
                                        <SwiperSlide key={i}>
                                            <div
                                                className="w-full h-full bg-cover bg-center rounded-[2.5rem] shadow-inner border border-black/5 dark:border-white/10"
                                                style={{ backgroundImage: `url('${img}')` }}
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>

                            {/* Product Info */}
                            <div className="px-6 pt-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-[#1a2a40] dark:text-white leading-tight">{productTitle}</h1>
                                        <p className="text-sm text-zinc-500 font-bold mt-1 tracking-wider uppercase">{productCategory}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-primary">₦{productPrice}</p>
                                        {productDiscount && <p className="text-sm text-zinc-400 line-through font-bold">₦{productDiscount}</p>}
                                    </div>
                                </div>

                                {/* Seller Card */}
                                <div className="mt-8 flex items-center justify-between p-4 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {sellerPhoto ? (
                                            <img src={sellerPhoto} alt="Seller" className="h-12 w-12 rounded-full border-2 border-primary/20 object-cover" />
                                        ) : (
                                            <div className="h-12 w-12 rounded-full border-2 border-[#f8f6f5] dark:border-zinc-800 shadow-sm bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold uppercase">
                                                {sellerName.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-bold text-[#1a2a40] dark:text-zinc-100">{sellerName}</p>
                                            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                <span>{sellerLocation}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                                        <span className="material-symbols-outlined text-primary text-sm fill-1">star</span>
                                        <span className="text-xs font-bold text-primary">{productRating}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mt-8">
                                    <h3 className="text-sm font-black text-[#1a2a40] dark:text-white uppercase tracking-widest mb-3">About this product</h3>
                                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm font-medium">
                                        {productTitle}
                                    </p>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        <span className="px-5 py-2 rounded-full bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider border border-black/5 dark:border-white/10 shadow-sm">Verified</span>
                                        <span className="px-5 py-2 rounded-full bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider border border-black/5 dark:border-white/10 shadow-sm">Campus Delivery</span>
                                        {isAdmin && (
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Hide this post as Admin?')) return;
                                                    const { error } = await supabase
                                                        .from('hostel_product_updates')
                                                        .update({ status: 'hide' })
                                                        .eq('id', product.id);
                                                    if (!error) {
                                                        alert('Post hidden');
                                                        onClose();
                                                        window.dispatchEvent(new CustomEvent('hostel-feed-refresh'));
                                                    }
                                                }}
                                                className="px-5 py-2 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 shadow-sm hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                Hide (Admin)
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Campus Map Snippet */}
                                <div className="mt-8">
                                    <h3 className="text-lg font-bold text-[#1a2a40] dark:text-white mb-3">Pickup Location</h3>
                                    <div className="h-44 w-full rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                                        <img className="w-full h-full object-cover opacity-60 dark:opacity-40" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7-GaqwsyUCErSKiAV_I5Lukji5va4cNJ1JBu4D2Sa_6jXMtHElAPLX9eMQxKWDeN48PDZ8b3feacGUd7rxyHz1jl-Ioj9SAreYctYUrcGu90oQlU60AQqrs1NZaMBlaRe5Z48sxNJ-5sOHVSTX137QUg-QKzIuLJJOvIlROzsrHDS_FX2Wn477tNbgebn-ssisbIdGBZlAlT2FhGJxGjN00Z-AzVx36kWTS1dLyLVf8vY8V013_BanRlZGOSv1tlsIIuMTZW1C4I" alt="Map" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center border-4 border-white dark:border-[#221610] shadow-2xl">
                                                <span className="material-symbols-outlined text-white text-xl">location_on</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Bottom Action Bar */}
                        <div className="px-6 py-8 bg-[#f8f6f5]/90 dark:bg-[#221610]/95 backdrop-blur-3xl border-t border-black/5 dark:border-white/5 flex items-center gap-4 shrink-0">
                            <button className="h-14 w-14 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-primary transition-all active:scale-95">
                                <span className="material-symbols-outlined text-[28px]">favorite</span>
                            </button>
                            <button
                                onClick={async () => {
                                    const phone = product?.unique_visitors?.phone_number;
                                    if (!phone) {
                                        alert('Contact not available');
                                        return;
                                    }
                                    const msg = `hi there, i'm interested in your ${product.post_description || ''} for ₦${product.price?.toLocaleString() || '0'}`;
                                    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
                                    window.open(whatsappUrl, '_blank');

                                    // Log Analytics (V1 Parity)
                                    try {
                                        const userId = await getUserId();
                                        // Log research/contact action
                                        try {
                                            await supabase
                                                .from('merchant_analytics')
                                                .insert([{
                                                    merchant_id: product.actual_user_id || null,
                                                    product_id: product.id || null,
                                                    event_type: 'profile_contacted',
                                                    user_id: userId
                                                }]);
                                        } catch (e: any) {
                                            // Ignore 409 Conflict errors (duplicate entry)
                                            if (e.code !== '23505') { // '23505' is the PostgreSQL error code for unique_violation
                                                console.warn('Analytics log failed (likely conflict):', e);
                                            }
                                        }
                                    } catch (err) {
                                        console.warn('Failed to log contact analytics:', err);
                                    }
                                }}
                                className="flex-1 h-14 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined">chat</span>
                                Contact Seller
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
