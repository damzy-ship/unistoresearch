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
        const uniqueImgs = imgs.slice(0, 6);
        return [...uniqueImgs, ...uniqueImgs]; 
    }, [products]);

    if (!loading && products.length === 0) return null;

    if (loading) {
        return (
            <div className="w-full h-[220px] sm:h-[280px] bg-zinc-900 animate-pulse rounded-none sm:rounded-3xl my-6 flex flex-col items-center justify-center gap-4">
                <div className="w-48 h-6 bg-zinc-800 rounded-full"></div>
                <div className="w-32 h-10 bg-zinc-800 rounded-xl mt-4"></div>
            </div>
        );
    }

    return (
        <section className="relative w-full h-[220px] sm:h-[280px] overflow-hidden rounded-none sm:rounded-3xl my-0 sm:my-8 bg-[#0a0a0a] border-y sm:border border-white/10 shadow-sm flex items-center justify-center group">
            
            {/* 1. Background Layer: Much higher opacity so images are visible */}
            <div className="absolute inset-0 z-0 flex items-center opacity-60 pointer-events-none transition-opacity duration-500 group-hover:opacity-80">
                <motion.div 
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ 
                        duration: 35, 
                        ease: "linear",
                        repeat: Infinity 
                    }}
                    className="flex gap-4 px-2"
                    style={{ width: "max-content" }}
                >
                    {backgroundImages.map((img, idx) => (
                        <div key={idx} className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shrink-0 shadow-2xl">
                            {/* Removed grayscale, added a brightness hover effect */}
                            <img 
                                src={img} 
                                alt="" 
                                className="w-full h-full object-cover brightness-75 transition-all duration-700 group-hover:brightness-100" 
                            />
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* 2. Vignette Overlays: Cleared the center so images pop, kept edges dark */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a] pointer-events-none" />
            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#0a0a0a] via-transparent to-[#0a0a0a] pointer-events-none" />

            {/* 3. Centralized Content Layer */}
            <div className="relative z-10 flex flex-col items-center text-center px-8 py-6 max-w-xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center gap-2 mb-4 sm:mb-5"
                >
                    <div className="px-3 py-1 rounded-full bg-black/40 border border-primary/30 flex items-center gap-2 mb-1 backdrop-blur-md">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest">
                            {category.subtitle || "Curated Collection"}
                        </span>
                    </div>

                    {/* Added a stronger drop shadow to the text so it separates from the brighter images */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                        {category.title}
                    </h2>
                </motion.div>

                <Link to={`/special-category/${category.id}`} onClick={() => window.scrollTo(0, 0)}>
                    <motion.button
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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