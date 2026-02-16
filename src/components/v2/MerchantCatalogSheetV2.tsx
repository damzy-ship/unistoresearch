import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, UniqueVisitor } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { toast } from 'sonner';

interface MerchantCatalogSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    merchant: UniqueVisitor | null;
    onProductClick?: (product: any) => void;
}

export const MerchantCatalogSheetV2: React.FC<MerchantCatalogSheetV2Props> = ({ isOpen, onClose, merchant, onProductClick }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && merchant) {
            const fetchProducts = async () => {
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('hostel_product_updates')
                        .select('*')
                        .eq('actual_user_id', merchant.auth_user_id)
                        .eq('post_type', 'product')
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
    }, [isOpen, merchant]);

    const handleWhatsApp = () => {
        if (!merchant?.phone_number) return;
        const msg = encodeURIComponent(`Hi ${merchant.brand_name || merchant.full_name}, I saw your items on UniStore!`);
        window.open(`https://wa.me/${merchant.phone_number.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    };

    const handleCall = () => {
        if (!merchant?.phone_number) return;
        window.location.href = `tel:${merchant.phone_number}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-4xl bg-[#0a0f1a] rounded-t-[3rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border-t md:border border-white/10 flex flex-col md:flex-row h-[94vh] md:h-auto md:max-h-[650px]"
                >
                    {/* Drawer Handle (Mobile Only) */}
                    <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2 md:hidden" />

                    {/* Close Button (Desktop Only) */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 hidden md:flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    {/* Left Panel: Merchant Info */}
                    <div className="w-full md:w-[320px] bg-[#1a2233] p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-white/10">
                        <div className="relative mb-6">
                            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl">
                                <div className="w-full h-full rounded-full bg-[#111827] p-1 overflow-hidden">
                                    {merchant?.profile_picture ? (
                                        <img src={merchant.profile_picture} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">
                                            {merchant?.full_name?.charAt(0) || 'M'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-[#1a2233] rounded-full"></div>
                        </div>

                        <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight line-clamp-1">
                            {merchant?.brand_name || merchant?.full_name?.split(' ')[0]}
                        </h2>
                        <p className="text-zinc-400 text-sm font-medium mb-8">
                            {merchant?.full_name}
                        </p>

                        <div className="w-full space-y-3 mb-8">
                            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                                <span className="material-symbols-outlined text-emerald-400 text-sm font-bold">location_on</span>
                                <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest truncate">
                                    {merchant?.hostels?.name || 'Main Campus'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                                <span className="material-symbols-outlined text-orange-400 text-sm font-bold">sell</span>
                                <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest">
                                    {products.length} Products
                                </span>
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-3 mt-auto">
                            <button
                                onClick={handleWhatsApp}
                                className="h-12 flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                            >
                                <span className="material-symbols-outlined text-lg">chat</span> WhatsApp
                            </button>
                            <button
                                onClick={handleCall}
                                className="h-12 flex items-center justify-center gap-2 bg-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-lg">smartphone</span> Call
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Catalog Grid */}
                    <div className="flex-1 p-8 flex flex-col min-h-0 bg-[#0f172a]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-6 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest">Store Catalog</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar pb-10">
                            {loading ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="aspect-square bg-white/5 rounded-3xl animate-pulse" />
                                    ))}
                                </div>
                            ) : products.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {products.map((p) => (
                                        <motion.div
                                            key={p.id}
                                            whileHover={{ y: -5 }}
                                            onClick={() => onProductClick && onProductClick(p)}
                                            className="group relative aspect-square rounded-[1.5rem] overflow-hidden bg-white/5 border border-white/5 cursor-pointer shadow-sm hover:shadow-2xl transition-all"
                                        >
                                            <img
                                                src={p.post_images?.[0] || '/v2/assets/niacinamide_serum_product_1771272568186.png'}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt="p"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 p-4 flex flex-col justify-end">
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest line-clamp-1 mb-0.5">{p.post_description}</p>
                                                <p className="text-emerald-400 font-black text-xs">₦{p.price?.toLocaleString()}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 italic py-10">
                                    <span className="material-symbols-outlined text-5xl mb-4 opacity-20">inventory_2</span>
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-40">No items available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
