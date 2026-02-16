import React, { useState, useEffect } from 'react';
import { V2Layout } from '../../components/v2/V2Layout';
import { ProductDetailSheetV2 } from '../../components/v2/ProductDetailSheetV2';
import { RequestDetailsSheetV2 } from '../../components/v2/RequestDetailsSheetV2';
import { supabase, UniqueVisitor, Hostel } from '../../lib/supabase';
import { useHostelFeed } from '../../hooks/hostel/useHostelFeed';
import { motion } from 'framer-motion';
import { LiveActivityHubV2 } from '../../components/v2/LiveActivityHubV2';
import { MerchantCatalogSheetV2 } from '../../components/v2/MerchantCatalogSheetV2';

export const HostelHomePageV2: React.FC = () => {
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [selectedSchoolId] = useState<string | null>(localStorage.getItem('selectedSchoolId'));
    const [selectedHostel, setSelectedHostel] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState<UniqueVisitor | null>(null);
    const [realLiveRequests, setRealLiveRequests] = useState<any[]>([]);
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [currentVisitor, setCurrentVisitor] = useState<UniqueVisitor | null>(null);

    const { feed, loadingFeed, loadFeed } = useHostelFeed(selectedSchoolId, selectedHostel, selectedCategory, false, currentVisitor);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                const { data: visitor } = await supabase
                    .from('unique_visitors')
                    .select('*, hostels(*), schools(*)')
                    .eq('auth_user_id', session.user.id)
                    .single();
                setCurrentVisitor(visitor as unknown as UniqueVisitor);
            }
        };
        init();
    }, []);

    useEffect(() => {
        const fetchHostels = async () => {
            if (!selectedSchoolId) return;
            const { data } = await supabase
                .from('hostels')
                .select('*')
                .eq('school_id', selectedSchoolId)
                .order('name', { ascending: true });
            setHostels(data || []);
        };
        fetchHostels();
    }, [selectedSchoolId]);

    // Added useEffect to trigger feed load
    useEffect(() => {
        loadFeed();
    }, [loadFeed, selectedSchoolId, selectedHostel, selectedCategory]);

    useEffect(() => {
        const handleRefresh = () => {
            console.log('Refreshing hostel feed from event...');
            loadFeed();
        };
        window.addEventListener('hostel-feed-refresh', handleRefresh);
        return () => window.removeEventListener('hostel-feed-refresh', handleRefresh);
    }, [loadFeed]);

    useEffect(() => {
        const fetchRealLiveRequests = async () => {
            const { data } = await supabase
                .from('hostel_product_updates')
                .select(`
                    id,
                    post_description,
                    post_images,
                    created_at,
                    post_category,
                    actual_user_id,
                    unique_visitors:actual_user_id (
                        id,
                        full_name,
                        profile_picture,
                        phone_number,
                        room,
                        is_hostel_merchant,
                        hostel_id,
                        hostels (id, name, school_id),
                        schools (id, short_name),
                        brand_name
                    ),
                    status,
                    post_type,
                    fulfilled,
                    price,
                    discount_price
                `)
                .eq('post_type', 'request')
                .or('fulfilled.is.null,fulfilled.eq.false')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                console.log('Fetched realLiveRequests:', data.length, data);
                setRealLiveRequests(data);
            }
        };
        fetchRealLiveRequests();

        // Realtime subscription for requests
        const channel = supabase
            .channel('realtime_requests')
            .on('postgres_changes' as any, {
                event: '*',
                table: 'hostel_product_updates',
                filter: "post_type=eq.request"
            }, (payload: any) => {
                console.log('Realtime request change:', payload);
                fetchRealLiveRequests();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const productItems = feed.filter(item => item.post_type !== 'request');

    const openProductDetail = (product: any) => {
        setSelectedProduct(product);
        setIsDetailOpen(true);
    };

    const openRequestResponse = (request: any) => {
        setSelectedRequest(request);
        setIsRequestOpen(true);
    };

    // Updated asset paths to use public directory
    const HERO_IMAGE = '/v2/assets/hostel_deals_hero_1771272553009.png';
    const FALLBACK_SPEAKER = '/v2/assets/portable_speaker_product_1771272581168.png';

    return (
        <V2Layout activeTab="home">
            <LiveActivityHubV2 onUserClick={(user) => {
                setSelectedMerchant(user);
                setIsCatalogOpen(true);
            }} />
            {/* Safety Banner */}
            <section className="p-4 pt-6">
                <div className="relative overflow-hidden bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-[2rem] p-5 flex gap-5 items-center shadow-sm backdrop-blur-3xl group">
                    <div className="absolute -right-8 -top-8 text-primary/5 transform rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <span className="material-symbols-outlined text-8xl">verified_user</span>
                    </div>
                    <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 z-10">
                        <span className="material-symbols-outlined text-2xl">shield_lock</span>
                    </div>
                    <div className="flex-1 z-10">
                        <h4 className="text-sm font-bold dark:text-white mb-0.5 tracking-wide">Safe Payment Priority</h4>
                        <p className="text-[11px] text-[#1a2a40]/60 dark:text-zinc-400 font-medium leading-relaxed">
                            Always pay through <span className="text-primary font-bold">Unistore Escrow</span> to ensure your money is safe until you receive your item.
                        </p>
                    </div>
                </div>
            </section>

            {/* Live Requests */}
            <section className="py-2">
                <div className="px-6 flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-[#1a2a40] dark:text-white tracking-tight leading-none">Live Requests</h3>
                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{realLiveRequests.length} Active</p>
                        <div className="relative flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping absolute opacity-50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-primary relative border-2 border-[#f8f6f5] dark:border-[#221610]"></div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar pb-4">
                    {realLiveRequests.length > 0 ? (
                        realLiveRequests.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => openRequestResponse(item)}
                                className="min-w-[170px] w-[170px] bg-white dark:bg-white/5 p-3 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-white/10 flex flex-col gap-3 cursor-pointer active:scale-95 transition-all group relative overflow-hidden h-[240px]"
                            >
                                <div className="absolute top-0 right-0 p-2 z-10">
                                    <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter backdrop-blur-md">New</div>
                                </div>
                                <div className="w-full aspect-square rounded-[1.8rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden ring-4 ring-zinc-50 dark:ring-white/5 shrink-0">
                                    <img
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        src={item.post_images?.[0] || FALLBACK_SPEAKER}
                                        onError={(e: any) => e.target.src = FALLBACK_SPEAKER}
                                        alt="Request"
                                    />
                                </div>
                                <div className="px-1 py-1 flex flex-col gap-1.5 flex-1">
                                    <p className="text-[12px] font-bold leading-snug text-[#1a2a40] dark:text-zinc-100 line-clamp-2">"{item.post_description}"</p>
                                    <div className="flex items-center gap-2 mt-auto">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-[10px] text-primary">schedule</span>
                                        </div>
                                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex-1 text-center py-10 text-zinc-400 text-xs font-bold uppercase tracking-widest bg-white dark:bg-white/5 rounded-[2rem] border border-dashed border-zinc-200 dark:border-white/10 mx-6">No live requests</div>
                    )}
                </div>
            </section>

            {/* Delicious Deals Hero */}
            <section className="px-4 py-6">
                <div className="relative w-full h-60 rounded-[2.5rem] overflow-hidden group shadow-2xl">
                    <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={HERO_IMAGE} alt="Deals" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary/30 tracking-widest uppercase">Hot Deal</span>
                        </div>
                        <h4 className="text-white text-3xl font-bold tracking-tight leading-none mb-1">Fresh Bread <span className="text-primary">₦350</span></h4>
                        <p className="text-white/80 text-sm font-medium tracking-wide">Zully's Bakery • Limited Stock!</p>

                        <div className="mt-4 flex gap-1.5">
                            <div className="w-10 h-1.5 bg-primary rounded-full shadow-lg shadow-primary/40"></div>
                            <div className="w-3 h-1.5 bg-white/20 rounded-full"></div>
                            <div className="w-3 h-1.5 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-4">
                <div className="flex gap-8 overflow-x-auto px-8 no-scrollbar">
                    {[
                        { icon: 'grid_view', label: 'All', id: 'all' },
                        { icon: 'restaurant', label: 'Food', id: 'food & snacks' },
                        { icon: 'apparel', label: 'Clothing', id: 'clothing' },
                        { icon: 'ice_skating', label: 'Shoes', id: 'shoes' },
                        { icon: 'hat_off', label: 'Caps', id: 'caps' },
                        { icon: 'devices', label: 'Gadgets', id: 'gadgets' },
                        { icon: 'smartphone', label: 'Phones', id: 'phones' },
                        { icon: 'diamond', label: 'Jewelry', id: 'jeweleries' }
                    ].map((cat) => (
                        <div
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
                            className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer transition-all duration-300 active:scale-95"
                        >
                            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-sm ${selectedCategory === cat.id ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' : 'bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-400 group-hover:bg-zinc-50 dark:group-hover:bg-white/10 group-hover:text-primary'}`}>
                                <span className={`material-symbols-outlined text-2xl ${selectedCategory === cat.id ? 'fill-1 font-bold' : ''}`}>{cat.icon}</span>
                            </div>
                            <span className={`text-[10px] font-bold tracking-wider ${selectedCategory === cat.id ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>{cat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Hostel Filter */}
            <section className="px-4 py-4 sticky top-14 z-40 bg-[#f8f6f5]/80 dark:bg-[#221610]/80 backdrop-blur-3xl border-b border-primary/5 transition-colors duration-500">
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    <button
                        onClick={() => setSelectedHostel('all')}
                        className={`px-6 h-10 rounded-2xl text-xs font-bold tracking-wide shrink-0 transition-all ${selectedHostel === 'all' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-500 dark:text-zinc-400'}`}
                    >
                        All Hostels
                    </button>
                    {hostels.map((hostel) => (
                        <button
                            key={hostel.id}
                            onClick={() => setSelectedHostel(hostel.id)}
                            className={`px-6 h-10 rounded-2xl text-xs font-bold tracking-wide shrink-0 transition-all ${selectedHostel === hostel.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:border-primary/30 hover:text-primary'}`}
                        >
                            {hostel.name}
                        </button>
                    ))}
                </div>
            </section>

            {/* Product Feed */}
            <main className="p-4 grid grid-cols-1 gap-8 mb-20">
                {loadingFeed ? (
                    Array(3).fill(0).map((_, k) => (
                        <div key={k} className="bg-zinc-100 dark:bg-white/5 rounded-[2.5rem] aspect-[4/5] animate-pulse" />
                    ))
                ) : productItems.length > 0 ? (
                    productItems.map((product, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={product.id}
                            onClick={() => openProductDetail(product)}
                            className="bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 flex flex-col group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer relative"
                        >
                            <div className="relative aspect-[4/5] overflow-hidden m-2.5 rounded-[2rem]">
                                <img
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    src={product.post_images?.[0] || FALLBACK_SPEAKER}
                                    onError={(e: any) => e.target.src = FALLBACK_SPEAKER}
                                    alt={product.post_description}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <button className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/40 dark:bg-black/40 flex items-center justify-center text-white backdrop-blur-xl shadow-lg ring-1 ring-white/20 transition-all hover:bg-primary hover:scale-110 active:scale-90 z-20">
                                    <span className="material-symbols-outlined text-lg">favorite</span>
                                </button>
                            </div>
                            <div className="p-6 pt-2 flex flex-col gap-3 flex-1">
                                <h4 className="text-lg font-bold line-clamp-1 text-[#1a2a40] dark:text-zinc-100 tracking-tight group-hover:text-primary transition-colors">{product.post_description}</h4>
                                <div className="flex items-end justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-primary font-black text-2xl leading-none">₦{product.price?.toLocaleString() || '0'}</span>
                                        {product.discount_price && <span className="text-xs text-zinc-500 dark:text-zinc-400 line-through font-medium mt-1">₦{product.discount_price.toLocaleString()}</span>}
                                    </div>
                                    <div className="bg-primary text-white p-3.5 rounded-2xl shadow-lg shadow-primary/20 scale-100 group-hover:scale-110 transition-all duration-300">
                                        <span className="material-symbols-outlined text-2xl font-bold">shopping_bag</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-sm text-primary">person</span>
                                        </div>
                                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 truncate">{product.unique_visitors?.full_name?.split(' ')[0] || 'Merchant'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-zinc-300 font-bold">
                                        <span className="material-symbols-outlined text-xs fill-1 text-yellow-500">star</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">4.8</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-20 text-zinc-400 font-bold uppercase tracking-widest text-xs">No products in this category</div>
                )}
            </main>

            {/* Product Detail Sheet */}
            <ProductDetailSheetV2
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                product={selectedProduct}
            />

            {/* Live Request Details Sheet */}
            <RequestDetailsSheetV2
                isOpen={isRequestOpen}
                onClose={() => setIsRequestOpen(false)}
                request={selectedRequest}
                currentVisitorId={currentVisitor?.id}
            />

            {/* Merchant Catalog Sheet */}
            <MerchantCatalogSheetV2
                isOpen={isCatalogOpen}
                onClose={() => setIsCatalogOpen(false)}
                merchant={selectedMerchant}
                onProductClick={(product) => {
                    setIsCatalogOpen(false);
                    setSelectedProduct(product);
                    setIsDetailOpen(true);
                }}
            />
        </V2Layout>
    );
};
