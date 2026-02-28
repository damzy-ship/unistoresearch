import React, { useEffect, useState } from 'react';
import { supabase, HostelsProductUpdates, SpecialCategory } from '../../lib/supabase';
import { ProductCardV2 } from '../v2/ProductCardV2';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
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
        <section className="py-10 border-primary/20 dark:border-white/5 bg-gradient-to-r from-orange-50/80 via-white to-orange-50/80 dark:from-[#1a110c] dark:via-black dark:to-[#1a110c] overflow-hidden relative shadow-sm">
            {/* High-visibility animated shimmer to make it pop */}
            <motion.div
                animate={{ x: ["-150%", "300%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 w-full md:w-1/2 bg-gradient-to-r from-transparent via-primary/10 dark:via-primary/20 to-transparent -skew-x-12 pointer-events-none z-0"
            />
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-20 -top-20 w-96 h-96 bg-primary/20 rounded-full blur-[60px] pointer-events-none z-0"
            />

            <div className="relative z-10">
                <div className="px-6 mb-8 flex items-center justify-between">
                    <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ height: [24, 32, 24], opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="w-2 bg-primary rounded-full shadow-[0_0_20px_rgba(255,107,0,0.8)]"
                            />
                            <motion.h3
                                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                className="text-xl md:text-3xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#1a2a40] via-primary to-[#1a2a40] dark:from-white dark:via-primary dark:to-white bg-[length:200%_auto] drop-shadow-sm"
                            >
                                {category.title}
                            </motion.h3>
                        </div>
                        {category.subtitle && (
                            <motion.p
                                initial={{ opacity: 0.8 }}
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="text-xs md:text-sm text-[#1a2a40]/70 dark:text-zinc-300 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] ml-5 mt-1 relative"
                            >
                                {category.subtitle}
                            </motion.p>
                        )}
                    </div>
                    {/* <button className="flex items-center gap-2 group cursor-pointer">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:mr-1 transition-all">View All</span>
                        <span className="material-symbols-outlined text-primary text-sm group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                    </button>  */}
                    <div className="flex items-center gap-3" onClick={()=>window.scrollTo(0,0)}>
                        <Link to={`/special-category/${category.id}`} className="flex items-center gap-2 group cursor-pointer">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:mr-1 transition-all">View All</span>
                            <span className="material-symbols-outlined text-primary text-sm group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                        </Link>
                    </div>
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
