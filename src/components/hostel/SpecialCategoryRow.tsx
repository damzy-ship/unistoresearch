import React, { useEffect, useState } from 'react';
import { supabase, HostelsProductUpdates, SpecialCategory } from '../../lib/supabase';
import { ProductCardV2 } from '../v2/ProductCardV2';
import { motion, AnimatePresence } from 'framer-motion';
import { SpecialCatProductCardV2 } from '../v2/SpecialCatProductCardV2';

interface SpecialCategoryRowProps {
    category: SpecialCategory;
    onProductClick: (product: HostelsProductUpdates) => void;
}

export const SpecialCategoryRow: React.FC<SpecialCategoryRowProps> = ({
    category,
    onProductClick
}) => {
    const [products, setProducts] = useState<HostelsProductUpdates[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('hostel_product_updates')
                    .select(`
                        id,
                        post_description,
                        post_images,
                        created_at,
                        actual_user_id,
                        unique_visitors:actual_user_id (
                            id,
                            full_name,
                            profile_picture,
                            is_hostel_merchant,
                            school_id
                        ),
                        status,
                        post_type,
                        price,
                        discount_price,
                        special_category_ids
                    `)
                    .contains('special_category_ids', [category.id])
                    .or('status.eq.open,status.is.null')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;
                setProducts((data || []) as unknown as HostelsProductUpdates[]);
            } catch (err) {
                console.error(`Failed to fetch products for special category ${category.title}:`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [category.id]);

    if (!loading && products.length === 0) return null;

    return (
        <section className="py-10 border-b border-black/5 dark:border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-3xl overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />

            <div className="relative z-10">
                <div className="px-6 mb-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(255,107,0,0.5)]" />
                            <h3 className="text-lg md:text-2xl font-black text-[#1a2a40] dark:text-white tracking-tight uppercase">
                                {category.title}
                            </h3>
                        </div>
                        {category.subtitle && (
                            <p className="text-[11px] text-[#1a2a40]/60 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] ml-4.5 mt-1">
                                {category.subtitle}
                            </p>
                        )}
                    </div>

                    <button className="flex items-center gap-2 group cursor-pointer">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:mr-1 transition-all">View All</span>
                        <span className="material-symbols-outlined text-primary text-sm group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                    </button>
                </div>

                <div className="flex items-center gap-5 overflow-x-auto pb-8 px-6 no-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <motion.div
                                    key={`skeleton-${i}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="min-w-[280px] w-[280px] h-[360px] bg-white dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/10 animate-pulse flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-black/5 dark:text-white/5 text-4xl">inventory_2</span>
                                </motion.div>
                            ))
                        ) : (
                            products.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="min-w-[200px] w-[200px] relative"
                                >
                                    <SpecialCatProductCardV2
                                        product={product}
                                        onClick={() => onProductClick(product)}
                                        fallbackImage="/images/placeholder.png"
                                        index={index}
                                    />
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};
