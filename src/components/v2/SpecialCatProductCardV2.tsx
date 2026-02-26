import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toggleProductLike, getProductLikeInfo } from '../../lib/merchantAnalytics';
import { toast } from 'sonner';

interface SpecialCatProductCardV2Props {
    product: any;
    onClick: () => void;
    fallbackImage: string;
    index: number;
}

export const SpecialCatProductCardV2: React.FC<SpecialCatProductCardV2Props> = ({
    product,
    onClick,
    fallbackImage,
    index
}) => {
    const [likeInfo, setLikeInfo] = useState({ likeCount: 0, isLiked: false });

    useEffect(() => {
        if (product?.id) {
            getProductLikeInfo(product.id).then(setLikeInfo);
        }
    }, [product?.id]);

    const handleToggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!product?.id) return;

        /* Likes commented out for now
        const wasLiked = likeInfo.isLiked;
        const newIsLiked = !wasLiked;
        setLikeInfo(prev => ({
            isLiked: newIsLiked,
            likeCount: newIsLiked ? prev.likeCount + 1 : prev.likeCount - 1
        }));

        const result = await toggleProductLike(product.id, product.actual_user_id || null);

        if (!result.success) {
            setLikeInfo(prev => ({
                isLiked: wasLiked,
                likeCount: wasLiked ? prev.likeCount + 1 : prev.likeCount - 1
            }));
            toast.error('Failed to update like');
        }
        */
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.01 }}
            onClick={onClick}
            className="bg-white dark:bg-white/5 rounded-lg overflow-hidden shadow-sm border border-black/5 dark:border-white/10 flex flex-col group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer relative"
        >
            <div className="relative aspect-[1/1] overflow-hidden rounded-t-lg">
                <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={product.post_images?.[0] || fallbackImage}
                    onError={(e: any) => {
                        (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                    alt={product.post_description}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Commenting out like button per user request
                <button
                    onClick={handleToggleLike}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl shadow-lg ring-1 ring-white/20 transition-all z-20 hover:scale-110 active:scale-90 ${likeInfo.isLiked ? 'bg-red-500 text-white' : 'bg-white/40 dark:bg-black/40 text-white hover:bg-red-500'}`}
                >
                    <span className={`material-symbols-outlined text-lg ${likeInfo.isLiked ? 'fill-1' : ''}`}>favorite</span>
                </button>
                */}
            </div>
            <div className="p-6 pt-4 flex flex-col gap-3 flex-1">
                {/* <h4 className="text-lg font-bold line-clamp-1 text-[#1a2a40] dark:text-zinc-100 tracking-tight group-hover:text-primary transition-colors">{product.post_description}</h4> */}
                <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                        {Number(product.price) > 0 ? (
                            <>
                                {product.discount_price ? (
                                    <>
                                        <span className="text-primary font-black text-2xl leading-none">₦{Number(product.discount_price).toLocaleString()}</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 line-through font-medium mt-1">₦{Number(product.price).toLocaleString()}</span>
                                    </>
                                ) : (
                                    <span className="text-primary font-black text-2xl leading-none">₦{Number(product.price).toLocaleString()}</span>
                                )}
                            </>
                        ) : (
                            <span className="text-zinc-400 font-black text-[10px] uppercase tracking-widest h-6">Contact for Price</span>
                        )}
                    </div>
                    {/* Redundant shopping bag removed per user request
                    <div className="bg-primary text-white p-3.5 rounded-2xl shadow-lg shadow-primary/20 scale-100 group-hover:scale-110 transition-all duration-300">
                        <span className="material-symbols-outlined text-2xl font-bold">shopping_bag</span>
                    </div>
                    */}
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-sm text-primary">person</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 truncate">{product.unique_visitors?.full_name?.split(' ')[0] || 'Merchant'}</span>
                    </div>
                    {/* Commenting out like counter per user request
                    <div className={`flex items-center gap-1 font-bold ${likeInfo.isLiked ? 'text-red-500' : 'text-zinc-400'}`}>
                        <span className={`material-symbols-outlined text-xs ${likeInfo.isLiked ? 'fill-1' : ''}`}>favorite</span>
                        <span className="text-xs">{likeInfo.likeCount}</span>
                    </div>
                    */}
                </div>
            </div>
        </motion.div>
    );
};
