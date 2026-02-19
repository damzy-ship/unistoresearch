import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, UniqueVisitor } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { ProductCardV2 } from './ProductCardV2';
import { toast } from 'sonner';
import { MessageCircle, Phone, MapPin, Package, X, ArrowRight } from 'lucide-react';

interface MerchantCatalogSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    merchant: UniqueVisitor | null;
    onProductClick?: (product: any) => void;
}

export const MerchantCatalogSheetV2: React.FC<MerchantCatalogSheetV2Props> = ({ isOpen, onClose, merchant, onProductClick }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentTheme } = useTheme();

    useEffect(() => {
        if (isOpen && merchant?.id) {
            const fetchProducts = async () => {
                setLoading(true);
                try {
                    console.log('[MerchantCatalog] Fetching products for visitor (post_type=update):', merchant.id);
                    const { data, error } = await supabase
                        .from('hostel_product_updates')
                        .select(`
                            id,
                            post_description,
                            post_images,
                            price,
                            discount_price,
                            created_at,
                            actual_user_id,
                            post_type
                        `)
                        .eq('actual_user_id', merchant.id)
                        .eq('post_type', 'update')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setProducts(data || []);
                } catch (err: any) {
                    console.error('Error fetching merchant products:', err);
                    toast.error('Failed to load catalog');
                } finally {
                    setLoading(false);
                }
            };
            fetchProducts();
        }
    }, [isOpen, merchant?.id]);

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!merchant?.phone_number) return;
        const msg = encodeURIComponent(`Hi ${merchant.brand_name || merchant.full_name}, I saw your items on UniStore!`);
        window.open(`https://wa.me/${merchant.phone_number.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    };

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!merchant?.phone_number) return;
        window.location.href = `tel:${merchant.phone_number}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-end">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
                />

                <motion.div
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                        if (info.offset.y > 100) onClose();
                    }}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative flex w-full flex-col rounded-t-[2.5rem] bg-white dark:bg-[#221610] shadow-2xl overflow-hidden border-t border-white/10 z-10 h-[85vh]"
                >
                    {/* Handle */}
                    <div className="flex justify-center py-4 flex-shrink-0">
                        <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                    </div>

                    {/* Scrollable Content Wrapper */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2 pb-12">
                        <div className="flex flex-col md:flex-row gap-8">

                            {/* Left: Merchant Profile (Now part of scroll) */}
                            <div className="w-full md:w-[280px] flex flex-col items-center">
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-primary hover:text-white transition-all"
                                >
                                    <X size={18} />
                                </button>

                                <div className="w-24 h-24 rounded-full p-1 border-2 border-primary mb-6 shadow-xl shadow-primary/10">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-[#1a110c] overflow-hidden flex items-center justify-center">
                                        {merchant?.profile_picture ? (
                                            <img src={merchant.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-black text-primary uppercase">
                                                {merchant?.full_name?.charAt(0) || 'M'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h2 className="text-xl font-black text-[#1a2a40] dark:text-white mb-1 uppercase tracking-tight">
                                    {merchant?.brand_name || merchant?.full_name?.split(' ')[0]}
                                </h2>
                                <p className="text-xs font-bold text-[#1a2a40]/50 dark:text-white/40 uppercase tracking-widest mb-8">
                                    {merchant?.full_name}
                                </p>

                                <div className="w-full space-y-2 mb-8">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10 shadow-sm">
                                        <MapPin size={14} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1a2a40]/70 dark:text-white/70 truncate">
                                            {merchant?.hostels?.name || 'Main Campus'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10 shadow-sm">
                                        <Package size={14} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1a2a40]/70 dark:text-white/70">
                                            {products.length} Items Listed
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-3 mt-auto">
                                    <button
                                        onClick={handleWhatsApp}
                                        className="h-11 flex items-center justify-center gap-2 bg-[#25D366]/10 dark:bg-[#25D366]/20 text-[#25D366] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all active:scale-95"
                                    >
                                        <MessageCircle size={14} /> WhatsApp
                                    </button>
                                    <button
                                        onClick={handleCall}
                                        className="h-11 flex items-center justify-center gap-2 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95"
                                    >
                                        <Phone size={14} /> Call
                                    </button>
                                </div>
                            </div>

                            {/* Right: Product Catalog */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1 h-5 bg-primary rounded-full shadow-lg shadow-primary/20" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#1a2a40]/40 dark:text-white/40">Store Catalog</h3>
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className="aspect-[4/5] bg-black/[0.03] dark:bg-white/[0.03] rounded-3xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : products.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                                        {products.map((p, idx) => (
                                            <ProductCardV2
                                                key={`p-${p.id}`}
                                                index={idx}
                                                product={{
                                                    ...p,
                                                    unique_visitors: merchant // Inject merchant info for the card
                                                }}
                                                fallbackImage="/v2/assets/niacinamide_serum_product_1771272568186.png"
                                                onClick={() => onProductClick && onProductClick(p)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center p-12 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-[2rem] border border-dashed border-black/5 dark:border-white/5">
                                        <Package size={40} className="text-primary/20 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1a2a40]/30 dark:text-white/20">No items available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
