import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase'; // Ensure supabase is imported

interface ProductCardV2Props {
    product: any;
    onClick: () => void;
    fallbackImage: string;
    index: number;
}

export const ProductCardV2: React.FC<ProductCardV2Props> = ({
    product,
    onClick,
    fallbackImage,
    index
}) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const images = product.post_images?.length > 0 ? product.post_images : [fallbackImage];

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const width = scrollContainerRef.current.clientWidth;
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex !== activeImageIndex) {
            setActiveImageIndex(newIndex);
        }
    };

    const handleGetNow = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents the card click from opening the detail sheet
        
        // 1. Check Authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }

        // 2. Proceed to WhatsApp if authenticated
        const sellerName = product?.unique_visitors?.brand_name || product?.unique_visitors?.full_name || 'Verified Merchant';
        const phoneNumber = product?.unique_visitors?.phone_number;
        
        if (!phoneNumber) {
            // Fallback: If no phone number is found, open the detail sheet
            onClick();
            return;
        }
        
        const msg = encodeURIComponent(`Hi ${sellerName}, I'm interested in your ${product.post_description} on UniStore!`);
        window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.01 }}
            className="bg-white dark:bg-white/5 sm:rounded-2xl overflow-hidden sm:shadow-sm border-b sm:border border-black/5 dark:border-white/10 flex flex-col group transition-all duration-300 sm:hover:shadow-xl w-full pb-4 sm:pb-0"
        >
            {/* Header: Merchant Info */}
            <div 
                className="flex items-center justify-between p-3 sm:p-4 cursor-pointer active:opacity-70"
                onClick={onClick}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {product.unique_visitors?.profile_picture ? (
                            <img src={product.unique_visitors.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-sm text-primary">person</span>
                        )}
                    </div>
                    <span className="text-sm font-bold text-[#1a2a40] dark:text-zinc-100 truncate">
                        {product.unique_visitors?.full_name || 'Merchant'}
                    </span>
                </div>
                <span className="material-symbols-outlined text-zinc-400">more_horiz</span>
            </div>

            {/* Image Slider */}
            <div className="relative w-full aspect-[4/5] sm:aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {images.map((img: string, idx: number) => (
                        <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                            <img
                                className="w-full h-full object-cover"
                                src={img}
                                onError={(e: any) => {
                                    (e.target as HTMLImageElement).src = fallbackImage;
                                }}
                                alt={`${product.post_description} - ${idx + 1}`}
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                        </div>
                    ))}
                </div>

                {images.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                className={`transition-all duration-300 rounded-full shadow-sm ${
                                    activeImageIndex === idx
                                        ? 'w-4 h-1.5 bg-white'
                                        : 'w-1.5 h-1.5 bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 flex flex-col gap-1.5 flex-1">
                <div className="cursor-pointer active:opacity-70" onClick={onClick}>
                    <h4 className="text-sm font-medium line-clamp-2 text-[#1a2a40] dark:text-zinc-100 leading-snug">
                        <span className="font-bold mr-2">{product.unique_visitors?.full_name?.split(' ')[0] || 'Merchant'}</span>
                        {product.post_description}
                    </h4>
                    
                    <div className="flex flex-col mt-1">
                        {Number(product.price) > 0 ? (
                            <div className="flex items-baseline gap-2">
                                {product.discount_price ? (
                                    <>
                                        <span className="text-[#1a2a40] dark:text-white font-bold text-base leading-none">₦{Number(product.discount_price).toLocaleString()}</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 line-through font-medium">₦{Number(product.price).toLocaleString()}</span>
                                    </>
                                ) : (
                                    <span className="text-[#1a2a40] dark:text-white font-bold text-base leading-none">₦{Number(product.price).toLocaleString()}</span>
                                )}
                            </div>
                        ) : (
                            <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest h-5 flex items-center">Contact for Price</span>
                        )}
                    </div>
                </div>

                {/* Secure Get Now Button */}
                <button
                    onClick={handleGetNow}
                    className="w-full mt-3 bg-primary text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    Get Now
                </button>
            </div>
        </motion.div>
    );
};