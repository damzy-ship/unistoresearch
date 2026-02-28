import React, { useEffect, useState, useMemo } from 'react';
import { supabase, HostelsProductUpdates, SpecialCategory } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface SpecialCategoryBannerProps {
    category: SpecialCategory;
}

export const SpecialCategoryRow: React.FC<SpecialCategoryBannerProps> = ({ category }) => {
    const [products, setProducts] = useState<HostelsProductUpdates[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('hostel_product_updates')
                    .select('id, post_images')
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

    const backgroundImages = useMemo(() => {
        if (!products.length) return [];
        const imgs = products.map(p => p.post_images?.[0]).filter(Boolean);
        return imgs.sort(() => 0.5 - Math.random()).slice(0, 5);
    }, [products]);

    // Configs for the floating images
    const spatialConfigs = [
        { top: '-5%', left: '2%', size: 'w-28 h-28 sm:w-36 sm:h-36', duration: 6, delay: 0 },
        { bottom: '-10%', right: '5%', size: 'w-36 h-36 sm:w-52 sm:h-52', duration: 8, delay: 2 },
        { top: '10%', right: '10%', size: 'w-20 h-20 sm:w-28 sm:h-28', duration: 5, delay: 1 },
        { bottom: '5%', left: '15%', size: 'w-32 h-32 sm:w-44 sm:h-44', duration: 7, delay: 3 },
        { top: '25%', left: '65%', size: 'w-24 h-24 sm:w-32 sm:h-32', duration: 9, delay: 0.5 },
    ];

    if (!loading && products.length === 0) return null;

    if (loading) {
        return (
            <div className="w-full h-[220px] sm:h-[280px] bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-none sm:rounded-3xl my-6 flex flex-col items-center justify-center gap-4">
                <div className="w-48 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                <div className="w-32 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4"></div>
            </div>
        );
    }

    return (
        <section className="relative w-full h-[220px] sm:h-[280px] overflow-hidden rounded-none sm:rounded-3xl my-0 sm:my-8 bg-zinc-50 dark:bg-[#0a0a0a] border-y sm:border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center group">
            
            {/* 1. Background Images Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {backgroundImages.map((img, idx) => {
                    const config = spatialConfigs[idx % spatialConfigs.length];
                    return (
                        <motion.div
                            key={idx}
                            // Increased opacity to peak at 1 (100% visible)
                            animate={{ 
                                opacity: [0, 1, 1, 0], 
                                scale: [0.85, 1.1, 1.1, 0.85],
                            }}
                            transition={{ 
                                duration: config.duration, 
                                delay: config.delay, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                // Adjusts the keyframe timing so it stays visible longer
                                times: [0, 0.4, 0.6, 1] 
                            }}
                            className={`absolute rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ${config.size}`}
                            style={{ top: config.top, bottom: config.bottom, left: config.left, right: config.right }}
                        >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </motion.div>
                    );
                })}
            </div>

            {/* 2. Dramatically reduced the full-width overlay so the images pop */}
            <div className="absolute inset-0 z-[1] bg-white/20 dark:bg-black/40 pointer-events-none" />

            {/* 3. Centralized Content Layer - Added a localized blurred 'glass' effect behind the text for readability */}
            <div className="relative z-10 flex flex-col items-center text-center px-8 py-6 max-w-xl mx-auto ">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center gap-2 mb-4 sm:mb-5"
                >
                    <div className="px-3 py-1 rounded-full bg-primary/20 dark:bg-primary/30 border border-primary/30 flex items-center gap-2 mb-1">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest">
                            {category.subtitle || "Curated Collection"}
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-[#1a2a40] dark:text-white drop-shadow-md">
                        {category.title}
                    </h2>
                </motion.div>

                <Link to={`/special-category/${category.id}`} onClick={() => window.scrollTo(0, 0)}>
                    <motion.button
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group flex items-center gap-2 bg-primary text-white px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base shadow-[0_0_20px_-5px_rgba(255,107,0,0.6)] overflow-hidden"
                    >
                        <motion.div
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-0"
                        />
                        <span className="relative z-10">Explore Collection</span>
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px] relative z-10 group-hover:translate-x-1 transition-transform">
                            arrow_forward
                        </span>
                    </motion.button>
                </Link>
            </div>
        </section>
    );
};