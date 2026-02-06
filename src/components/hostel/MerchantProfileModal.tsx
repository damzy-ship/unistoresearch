import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Tag, Smartphone, MessageCircle } from 'lucide-react';
import { supabase, HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';

interface MerchantProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    merchant: UniqueVisitor | null;
    currentVisitor?: UniqueVisitor | null;
    onProductClick: (product: HostelsProductUpdates) => void;
}

export default function MerchantProfileModal({ isOpen, onClose, merchant, onProductClick }: MerchantProfileModalProps) {
    const [products, setProducts] = useState<HostelsProductUpdates[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && merchant) {
            fetchMerchantProducts();
        }
    }, [isOpen, merchant]);

    const fetchMerchantProducts = async () => {
        if (!merchant) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('hostel_product_updates')
            .select('*')
            .eq('actual_user_id', merchant.id)
            .neq('post_type', 'request') // Filtering only products (not requests)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProducts(data as HostelsProductUpdates[]);
        }
        setLoading(false);
    };

    if (!isOpen || !merchant) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>

                        {/* Left Sidebar: Profile Info */}
                        <div className="w-full md:w-80 bg-gray-800/50 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-gray-700/50">
                            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-xl shadow-purple-900/20">
                                <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                                    {merchant.profile_picture ? (
                                        <img src={merchant.profile_picture} alt={merchant.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                            {merchant.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">{merchant.brand_name || merchant.full_name}</h2>
                            {merchant.brand_name && <p className="text-sm text-gray-400 mb-4 font-medium">{merchant.full_name}</p>}

                            <div className="w-full flex flex-col gap-3 mt-4">
                                {merchant.hostels?.name && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-300 bg-gray-900/50 py-2 rounded-xl">
                                        <MapPin size={16} className="text-emerald-400" />
                                        <span>{merchant.hostels.name}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-300 bg-gray-900/50 py-2 rounded-xl">
                                    <Tag size={16} className="text-amber-400" />
                                    <span>{products.length} Products</span>
                                </div>
                            </div>

                            {/* Contact Actions */}
                            <div className="w-full mt-6 grid grid-cols-2 gap-3">
                                <a
                                    href={`https://wa.me/${merchant.phone_number?.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
                                >
                                    <MessageCircle size={16} />
                                    WhatsApp
                                </a>
                                <a
                                    href={`tel:${merchant.phone_number}`}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-all border border-gray-600"
                                >
                                    <Smartphone size={16} />
                                    Call
                                </a>
                            </div>

                        </div>

                        {/* Main Content: Products Grid */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-950/50">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                                Store Catalog
                            </h3>

                            {loading ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="aspect-[4/5] bg-gray-800/50 rounded-2xl animate-pulse"></div>
                                    ))}
                                </div>
                            ) : products.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {products.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => onProductClick(product)}
                                            className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-gray-800 hover:border-purple-500/50 transition-all shadow-lg hover:shadow-purple-900/10"
                                        >
                                            {product.post_images && product.post_images.length > 0 ? (
                                                <img
                                                    src={product.post_images[0]}
                                                    alt={product.post_description}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-800 flex items-center justify-center p-4 text-center">
                                                    <span className="text-gray-600 text-xs">No Image</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />

                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="text-white font-bold text-sm truncate">{product.post_description}</p>
                                                <p className="text-emerald-400 font-mono text-xs font-bold mt-1">
                                                    ₦{product.price?.toLocaleString() || '0'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <Tag size={48} className="mb-4 opacity-50" />
                                    <p>No products found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
