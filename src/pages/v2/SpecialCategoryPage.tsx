import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, SpecialCategory, HostelsProductUpdates } from '../../lib/supabase';
import { ProductDetailSheetV2 } from '../../components/v2/ProductDetailSheetV2';
import { ProductCardV2 } from '../../components/v2/ProductCardV2';

const SpecialCategoryPage: React.FC = () => {
    const { categoryId } = useParams();
    const [category, setCategory] = useState<SpecialCategory | null>(null);
    const [products, setProducts] = useState<HostelsProductUpdates[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<HostelsProductUpdates | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    useEffect(() => {
        if (!categoryId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: catData } = await supabase
                    .from('hostel_special_categories')
                    .select('*')
                    .eq('id', categoryId)
                    .single();

                setCategory(catData || null);

                const { data: prodData } = await supabase
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
                            phone_number,
                            is_hostel_merchant,
                            school_id
                        ),
                        status,
                        post_type,
                        price,
                        discount_price,
                        special_category_ids
                    `)
                    .contains('special_category_ids', [categoryId])
                    .or('status.eq.open,status.is.null')
                    .order('created_at', { ascending: false });

                setProducts((prodData || []) as HostelsProductUpdates[]);
            } catch (err) {
                console.error('Failed to load special category page data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categoryId]);

    const handleOrder = (e: React.MouseEvent, product: any) => {
        e.stopPropagation();
        const phone = product.unique_visitors?.phone_number;
        const price = product.discount_price || product.price;
        const text = `Hi, I'm interested in ${product.post_description} priced at ₦${Number(price).toLocaleString()}.`;
        
        if (phone) {
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
        } else {
            console.log("No phone number available to route order.");
        }
    };

    if (!category && !loading) return (
        <div className="p-8 min-h-screen bg-[#f8f6f5] dark:bg-[#1a1a1a]">
            <Link to="/hostel" className="text-primary font-bold flex items-center gap-1 w-fit hover:opacity-80 transition-opacity">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Back
            </Link>
            <h2 className="mt-4 text-2xl font-bold dark:text-white">Category not found</h2>
        </div>
    );

    return (
        <div className="min-h-screen pb-12 bg-[#f8f6f5] dark:bg-[#1a1a1a]">
            <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
                
                {/* --- ABSTRACT HERO HEADER --- */}
                <section className="relative w-full h-[260px] sm:h-[340px] overflow-hidden sm:rounded-[2.5rem] sm:mt-6 mb-0 sm:mb-12 bg-white dark:bg-[#0a0a0a] sm:border border-black/5 dark:border-white/10 shadow-sm flex flex-col items-center justify-center">
                    
                    <motion.div
                        animate={{ 
                            scale: [1, 1.2, 1], 
                            rotate: [0, 90, 0],
                            opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[30%] -left-[10%] w-[60%] h-[80%] rounded-full bg-primary/20 dark:bg-primary/20 blur-[80px] z-0 pointer-events-none"
                    />
                    <motion.div
                        animate={{ 
                            scale: [1, 1.3, 1], 
                            rotate: [0, -90, 0],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[90%] rounded-full bg-[#ff8c42]/20 dark:bg-[#ff8c42]/20 blur-[100px] z-0 pointer-events-none"
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] z-0 pointer-events-none" />

                    <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20">
                        <Link to="/hostel" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md text-sm font-bold text-[#1a2a40] dark:text-white hover:bg-white dark:hover:bg-black border border-black/5 dark:border-white/10 transition-all shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Back
                        </Link>
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto mt-6 sm:mt-0">
                        {loading ? (
                            <div className="w-64 h-12 bg-black/5 dark:bg-white/5 rounded-full animate-pulse" />
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="flex flex-col items-center gap-3"
                            >
                                <motion.div 
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="px-4 py-1.5 rounded-full bg-white/60 dark:bg-black/40 backdrop-blur-md border border-primary/20 dark:border-primary/30 flex items-center gap-2 shadow-sm"
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.2em]">
                                        {category?.subtitle || "Exclusive Collection"}
                                    </span>
                                </motion.div>

                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight drop-shadow-sm">
                                    <span className="text-[#1a2a40] dark:text-white">
                                        {category?.title}
                                    </span>
                                </h1>
                                
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: "80px" }}
                                    transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                                    className="h-1.5 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent mt-2 opacity-70"
                                />
                            </motion.div>
                        )}
                    </div>
                </section>
                {/* --- END HERO HEADER --- */}

                {/* SINGLE COLUMN FEED SECTION */}
                <div className="">
                    <AnimatePresence>
                        {loading ? (
                            // Switched skeleton to single column feed style
                            <div className="flex flex-col max-w-xl mx-auto gap-6 sm:gap-8">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-96 w-full bg-black/5 dark:bg-white/5 rounded-[2rem] animate-pulse" />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="max-w-xl mx-auto p-12 rounded-3xl bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 text-center flex flex-col items-center justify-center gap-4 shadow-sm"
                            >
                                <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-zinc-400">inventory_2</span>
                                </div>
                                <p className="text-zinc-500 font-medium">No products available in this category yet.</p>
                            </motion.div>
                        ) : (
                            // Removed the grid entirely. Replaced with flex-col and max-w-xl for a perfect feed
                            <div className="flex flex-col max-w-xl mx-auto gap-y-2 sm:gap-y-4">
                                {products.map((p, idx) => (
                                    <ProductCardV2
                                        key={p.id}
                                        product={p}
                                        index={idx}
                                        onClick={() => {
                                            setSelectedProduct(p);
                                            setDetailOpen(true);
                                        }}
                                        onGetNowClick={handleOrder}
                                        fallbackImage="/images/placeholder.png"
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <ProductDetailSheetV2
                isOpen={detailOpen}
                onClose={() => setDetailOpen(false)}
                product={selectedProduct}
            />
        </div>
    );
};

export default SpecialCategoryPage;