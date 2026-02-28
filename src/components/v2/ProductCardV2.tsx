import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { supabase } from '../../lib/supabase';

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
    const images = product.post_images?.length > 0 ? product.post_images : [fallbackImage];

    const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset }: PanInfo) => {
        const swipeDistance = offset.x;
        const minSwipeDistance = 40; 

        if (swipeDistance <= -minSwipeDistance && activeImageIndex < images.length - 1) {
            setActiveImageIndex(prev => prev + 1);
        } else if (swipeDistance >= minSwipeDistance && activeImageIndex > 0) {
            setActiveImageIndex(prev => prev - 1);
        }
    };

    const handleGetNow = async (e: React.MouseEvent) => {
        e.stopPropagation(); 
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            return;
        }

        const sellerName = product?.unique_visitors?.brand_name || product?.unique_visitors?.full_name || 'Verified Merchant';
        const phoneNumber = product?.unique_visitors?.phone_number;
        
        if (!phoneNumber) {
            onClick();
            return;
        }
        
        const msg = encodeURIComponent(`Hi ${sellerName}, I'm interested in your ${product.post_description} on UniStore!`);
        window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    };

    // Helper functions for desktop clicks
    const goNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeImageIndex < images.length - 1) setActiveImageIndex(prev => prev + 1);
    };

    const goPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeImageIndex > 0) setActiveImageIndex(prev => prev - 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.01 }}
            className="bg-white dark:bg-white/5 sm:rounded-2xl overflow-hidden sm:shadow-sm border-b sm:border border-black/5 dark:border-white/10 flex flex-col group transition-all duration-300 sm:hover:shadow-xl w-full pb-4 sm:pb-0"
        >
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

            {/* Slider Section - Added group/slider for specific hover targeting */}
            <div className="relative w-full aspect-[4/5] sm:aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800 touch-pan-y group/slider">
                <motion.div 
                    className="flex w-full h-full cursor-grab active:cursor-grabbing"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    animate={{ translateX: `-${activeImageIndex * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {images.map((img: string, idx: number) => (
                        <div key={idx} className="w-full h-full flex-shrink-0 relative">
                            <img
                                className="w-full h-full object-cover pointer-events-none"
                                src={img}
                                onError={(e: any) => {
                                    (e.target as HTMLImageElement).src = fallbackImage;
                                }}
                                alt={`${product.post_description} - ${idx + 1}`}
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                        </div>
                    ))}
                </motion.div>

                {/* Desktop Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        {/* Previous Button */}
                        <button
                            onClick={goPrev}
                            className={`hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white items-center justify-center z-20 transition-all duration-300 opacity-0 group-hover/slider:opacity-100 ${
                                activeImageIndex === 0 ? 'pointer-events-none !hidden' : ''
                            }`}
                            aria-label="Previous image"
                        >
                            <span className="material-symbols-outlined text-[20px] ml-[-2px]">chevron_left</span>
                        </button>

                        {/* Next Button */}
                        <button
                            onClick={goNext}
                            className={`hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white items-center justify-center z-20 transition-all duration-300 opacity-0 group-hover/slider:opacity-100 ${
                                activeImageIndex === images.length - 1 ? 'pointer-events-none !hidden' : ''
                            }`}
                            aria-label="Next image"
                        >
                            <span className="material-symbols-outlined text-[20px] mr-[-2px]">chevron_right</span>
                        </button>
                    </>
                )}

                {/* Indicators */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndex(idx);
                                }}
                                className={`transition-all duration-300 rounded-full shadow-sm cursor-pointer ${
                                    activeImageIndex === idx
                                        ? 'w-4 h-1.5 bg-white'
                                        : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                                }`}
                                aria-label={`Go to image ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 py-3 flex flex-col gap-1.5 flex-1">
                <div className="cursor-pointer active:opacity-70" onClick={onClick}>
                    <h4 className="text-sm font-medium line-clamp-2 text-[#1a2a40] dark:text-zinc-100 leading-snug">
                        <span className="font-bold mr-2 text-xs">{product.unique_visitors?.full_name?.split(' ')[0] || 'Merchant'}</span>
                        <span className="italic">{product.post_description}</span>
                    </h4>
                    
                    <div className="flex flex-col mt-1 text-md">
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