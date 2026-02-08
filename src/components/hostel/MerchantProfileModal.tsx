import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { supabase, HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';
import { AppDrawer } from '../ui/Drawer';
import { Button } from '../ui/Button';

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

    if (!merchant) return null;

    return (
        <AppDrawer
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            className="h-[90vh]"
        >
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
                {/* Header / Profile Info */}
                <div className="bg-white dark:bg-gray-800 p-6 flex flex-col items-center text-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-orange-500 to-amber-500 mb-3 shadow-lg">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            {merchant.profile_picture ? (
                                <img src={merchant.profile_picture} alt={merchant.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                                    {merchant.full_name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{merchant.brand_name || merchant.full_name}</h2>
                    {merchant.brand_name && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">{merchant.full_name}</p>}

                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2 w-full">
                        {merchant.hostels?.name && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                                <Icon icon="mdi:map-marker" width={14} className="text-orange-500" />
                                <span>{merchant.hostels.name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                            <Icon icon="mdi:tag" width={14} className="text-orange-500" />
                            <span>{products.length} Products</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-4">
                        <Button
                            onClick={() => window.open(`https://wa.me/${merchant.phone_number?.replace(/[^0-9]/g, '')}`, '_blank')}
                            className="bg-[#25D366] hover:bg-[#128C7E] text-white border-transparent"
                            size="sm"
                        >
                            <Icon icon="mdi:whatsapp" width={18} className="mr-2" />
                            WhatsApp
                        </Button>
                        <Button
                            onClick={() => window.location.href = `tel:${merchant.phone_number}`}
                            variant="secondary"
                            size="sm"
                        >
                            <Icon icon="mdi:cellphone" width={16} className="mr-2" />
                            Call
                        </Button>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                        Store Catalog
                    </h3>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-[4/5] bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {products.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => onProductClick(product)}
                                    className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
                                >
                                    {product.post_images && product.post_images.length > 0 ? (
                                        <img
                                            src={product.post_images[0]}
                                            alt={product.post_description}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-4 text-center bg-gray-100 dark:bg-gray-800">
                                            <span className="text-gray-400 text-xs">No Image</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <p className="text-white font-bold text-xs line-clamp-2">{product.post_description}</p>
                                        <p className="text-orange-400 font-mono text-xs font-bold mt-1">
                                            ₦{product.price?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                            <Icon icon="mdi:tag-outline" width={32} className="mb-2 opacity-50" />
                            <p className="text-sm">No products found</p>
                        </div>
                    )}
                </div>
            </div>
        </AppDrawer>
    );
}

