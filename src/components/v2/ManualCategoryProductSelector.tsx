import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, HostelsProductUpdates, SpecialCategory } from '../../lib/supabase';
import { toast } from 'sonner';

interface ManualCategoryProductSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    category: SpecialCategory | null;
    schoolId: string;
}

export const ManualCategoryProductSelector: React.FC<ManualCategoryProductSelectorProps> = ({
    isOpen,
    onClose,
    category,
    schoolId
}) => {
    const [products, setProducts] = useState<HostelsProductUpdates[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && category && schoolId) {
            fetchProducts();
        }
    }, [isOpen, category, schoolId]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('hostel_product_updates')
                .select(`
                    id,
                    post_description,
                    post_images,
                    price,
                    discount_price,
                    special_category_ids,
                    actual_user_id,
                    unique_visitors!inner(school_id)
                `)
                .eq('unique_visitors.school_id', schoolId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const fetchedProducts = (data || []) as unknown as HostelsProductUpdates[];
            setProducts(fetchedProducts);

            const initialSelected = new Set(
                fetchedProducts
                    .filter(p => p.special_category_ids?.includes(category!.id))
                    .map(p => p.id)
            );
            setSelectedProductIds(initialSelected);
            setInitialSelectedIds(initialSelected);

        } catch (error: any) {
            console.error('Error fetching manual products:', error);
            toast.error('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const query = searchQuery.toLowerCase();
        return products.filter(p => p.post_description?.toLowerCase().includes(query));
    }, [products, searchQuery]);

    const toggleProductSelection = (productId: string) => {
        setSelectedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleSavePrimary = async () => {
        if (!category) return;
        setIsSaving(true);
        try {
            const addedIds = Array.from(selectedProductIds).filter(id => !initialSelectedIds.has(id));
            const removedIds = Array.from(initialSelectedIds).filter(id => !selectedProductIds.has(id));

            // Process additions
            if (addedIds.length > 0) {
                for (const productId of addedIds) {
                    const product = products.find(p => p.id === productId);
                    if (product) {
                        const currentCatIds = product.special_category_ids || [];
                        if (!currentCatIds.includes(category.id)) {
                            await supabase
                                .from('hostel_product_updates')
                                .update({ special_category_ids: [...currentCatIds, category.id] })
                                .eq('id', productId);
                        }
                    }
                }
            }

            // Process removals
            if (removedIds.length > 0) {
                for (const productId of removedIds) {
                    const product = products.find(p => p.id === productId);
                    if (product) {
                        const currentCatIds = product.special_category_ids || [];
                        const updatedCatIds = currentCatIds.filter(id => id !== category.id);
                        await supabase
                            .from('hostel_product_updates')
                            .update({ special_category_ids: updatedCatIds })
                            .eq('id', productId);
                    }
                }
            }

            toast.success('Product selection updated successfully');
            onClose();
        } catch (error: any) {
            console.error('Error saving manual product selection:', error);
            toast.error('Failed to save selection');
        } finally {
            setIsSaving(false);
        }
    };


    if (!isOpen || !category) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex flex-col bg-[#f8f6f5] dark:bg-[#110c0a]">
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full h-full flex flex-col"
                >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#1a110c] shadow-sm z-10 sticky top-0 gap-4 md:gap-0">
                        <div className="flex flex-col gap-1 w-full md:w-auto">
                            <h2 className="text-lg md:text-2xl font-bold text-[#1a2a40] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px] md:text-[24px]">touch_app</span>
                                Edit Manual Selection
                            </h2>
                            <p className="text-[10px] md:text-sm text-zinc-500 font-medium line-clamp-1">
                                Category: <span className="text-primary font-bold">{category.title}</span> ({selectedProductIds.size} selected)
                            </p>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end">
                            <button
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 flex-1 md:flex-none"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleSavePrimary}
                                disabled={isSaving || (selectedProductIds.size === initialSelectedIds.size && Array.from(selectedProductIds).every(id => initialSelectedIds.has(id)))}
                                className="px-4 md:px-6 py-2 bg-primary text-white rounded-xl text-xs md:text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-1 md:gap-2 flex-1 md:flex-none"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        SAVING...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">save</span>
                                        SAVE SELECTION
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="p-4 md:px-8 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                        <div className="relative max-w-2xl mx-auto">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                            <input
                                type="text"
                                placeholder="Search products by description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm font-bold text-zinc-500 animate-pulse uppercase tracking-widest">Loading Products...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                <span className="material-symbols-outlined text-6xl mb-4 text-zinc-300 dark:text-zinc-600">inventory_2</span>
                                <p className="text-lg font-bold text-[#1a2a40] dark:text-white">No products found</p>
                                <p className="text-sm text-zinc-500">Try adjusting your search or ensure there are products in this school.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 max-w-[1600px] mx-auto pb-20">
                                {filteredProducts.map(product => {
                                    const isSelected = selectedProductIds.has(product.id);
                                    const image = product.post_images?.[0] || '/images/placeholder.png';
                                    const displayPrice = product.discount_price || product.price || 0;

                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => toggleProductSelection(product.id)}
                                            className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 ${isSelected
                                                ? 'border-primary shadow-[0_0_20px_rgba(255,107,0,0.2)] transform -translate-y-1'
                                                : 'border-transparent bg-white dark:bg-white/5 hover:border-black/10 dark:hover:border-white/20 hover:shadow-lg'
                                                }`}
                                        >
                                            {/* Selection Checkmark */}
                                            <div className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white scale-100' : 'bg-black/20 text-white/50 scale-0 group-hover:scale-100 backdrop-blur-sm'
                                                }`}>
                                                <span className="material-symbols-outlined text-[16px] font-bold">
                                                    {isSelected ? 'check' : 'add'}
                                                </span>
                                            </div>

                                            {/* Product Image */}
                                            <div className="aspect-square relative overflow-hidden bg-zinc-100 dark:bg-black/50">
                                                <img
                                                    src={image}
                                                    alt="Product"
                                                    className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-105' : 'group-hover:scale-110'}`}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/images/placeholder.png';
                                                    }}
                                                />
                                                <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-primary/10' : 'group-hover:bg-black/10'}`}></div>
                                            </div>

                                            {/* Product Details */}
                                            <div className={`p-4 ${isSelected ? 'bg-primary/5' : ''}`}>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <p className="text-sm font-bold text-[#1a2a40] dark:text-white line-clamp-2 leading-snug">
                                                        {product.post_description || 'No Description'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-black text-primary">
                                                        ₦{displayPrice.toLocaleString()}
                                                    </span>
                                                    {product.discount_price && product.price && (
                                                        <span className="text-[10px] text-zinc-400 line-through font-medium">
                                                            ₦{product.price.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
