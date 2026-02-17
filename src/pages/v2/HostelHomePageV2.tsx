import React, { useState, useEffect } from 'react';
import { V2Layout } from '../../components/v2/V2Layout';
import { ProductDetailSheetV2 } from '../../components/v2/ProductDetailSheetV2';
import { RequestDetailsSheetV2 } from '../../components/v2/RequestDetailsSheetV2';
import { supabase, UniqueVisitor, Hostel } from '../../lib/supabase';
import { useHostelFeed } from '../../hooks/hostel/useHostelFeed';
import { motion } from 'framer-motion';
import { LiveActivityHubV2 } from '../../components/v2/LiveActivityHubV2';
import { MerchantCatalogSheetV2 } from '../../components/v2/MerchantCatalogSheetV2';
import { LiveRequestResponseSheetV2 } from '../../components/v2/LiveRequestResponseSheetV2';
import { SchoolSelectionModalV2 } from '../../components/v2/SchoolSelectionModalV2';

export const HostelHomePageV2: React.FC = () => {
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [isResponseOpen, setIsResponseOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(localStorage.getItem('selectedSchoolId'));
    const [selectedSchoolName, setSelectedSchoolName] = useState<string>('Select University');
    const [selectedHostel, setSelectedHostel] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState<UniqueVisitor | null>(null);
    const [realLiveRequests, setRealLiveRequests] = useState<any[]>([]);
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [currentVisitor, setCurrentVisitor] = useState<UniqueVisitor | null>(null);

    const {
        loadingFeed,
        loadingMore,
        hasMore,
        loadFeed,
        loadMore,
        orderedDisplayedFeed
    } = useHostelFeed(selectedSchoolId, selectedHostel, selectedCategory, false, currentVisitor);

    const observer = React.useRef<IntersectionObserver | null>(null);
    const lastElementRef = React.useCallback((node: HTMLDivElement | null) => {
        if (loadingFeed || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                console.log('[HostelHomePageV2] Bottom reached, loading more...');
                loadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingFeed, loadingMore, hasMore, loadMore]);

    useEffect(() => {
        const handleAuthChange = (e: any) => {
            console.log('[HostelHomePageV2] auth-state-changed:', e.detail);
            const visitor = e.detail?.visitor;
            setCurrentVisitor(visitor || null);

            // AUTO-SYNC SCHOOL ID: If current user has a school and we don't have one selected,
            // or if the current one is just a placeholder, sync it.
            if (visitor?.school_id && (!selectedSchoolId || selectedSchoolName === 'Select University')) {
                console.log('[HostelHomePageV2] Auto-syncing school from profile:', visitor.school_id);
                setSelectedSchoolId(visitor.school_id);
                localStorage.setItem('selectedSchoolId', visitor.school_id);
                // The fetchHostelsAndSchool useEffect will handle the name update
            }

            loadFeed();
        };
        window.addEventListener('auth-state-changed', handleAuthChange);
        return () => window.removeEventListener('auth-state-changed', handleAuthChange);
    }, [selectedSchoolId, selectedSchoolName, loadFeed]);

    useEffect(() => {
        const fetchHostelsAndSchool = async () => {
            if (!selectedSchoolId) {
                // Auto-open modal if no school selected
                setIsSchoolModalOpen(true);
                return;
            };

            // Fetch school name for display
            const { data: schoolData } = await supabase.from('schools').select('short_name').eq('id', selectedSchoolId).maybeSingle();
            if (schoolData) setSelectedSchoolName(schoolData.short_name);

            // Fetch hostels
            const { data: hostelData } = await supabase
                .from('hostels')
                .select('*')
                .eq('school_id', selectedSchoolId)
                .order('name', { ascending: true });
            setHostels(hostelData || []);
        };
        fetchHostelsAndSchool();
    }, [selectedSchoolId]);

    // Unified feed loader that only triggers on filter/school changes
    useEffect(() => {
        console.log('[HostelHomePageV2] Filters changed, resetting feed...');
        loadFeed();
    }, [selectedSchoolId, selectedHostel, selectedCategory]);

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


    const openProductDetail = (product: any) => {
        setSelectedProduct(product);
        setIsDetailOpen(true);
    };

    const openRequestResponse = (request: any) => {
        setSelectedRequest(request);
        if (request.actual_user_id === currentVisitor?.id) {
            setIsRequestOpen(true);
        } else {
            setIsResponseOpen(true);
        }
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

            {/* University Selection Tag */}
            <div className="px-5 pt-2 flex items-center justify-between">
                <button
                    onClick={() => setIsSchoolModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm active:scale-95 transition-all group"
                >
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1a2a40] dark:text-white/70 group-hover:text-primary transition-colors">
                        {selectedSchoolName}
                    </span>
                    <span className="material-symbols-outlined text-sm text-zinc-400">expand_more</span>
                </button>
            </div>
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

                <div className="flex gap-4 overflow-x-auto px-6 lg:px-8 no-scrollbar pb-6 min-h-[140px] items-center">
                    {realLiveRequests.length > 0 ? (
                        realLiveRequests.map((item, idx) => (
                            <motion.div
                                key={`request-${item.id}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => openRequestResponse(item)}
                                className="flex-shrink-0 w-[280px] bg-white dark:bg-white/5 rounded-[2.5rem] p-5 shadow-sm border border-black/5 dark:border-white/10 relative overflow-hidden group active:scale-95 transition-all cursor-pointer"
                            >
                                {/* Background Decorative Element */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center p-0.5 border border-black/5">
                                                {item.unique_visitors?.profile_picture ? (
                                                    <img src={item.unique_visitors.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 text-lg">person</span>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black dark:text-white uppercase tracking-tight">{item.unique_visitors?.full_name?.split(' ')[0] || 'Anonymous'}</h4>
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none mt-0.5">{item.unique_visitors?.hostels?.name || 'UniStore User'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                                            Live
                                        </div>
                                    </div>

                                    <p className="text-sm font-bold text-[#1a2a40] dark:text-white/90 line-clamp-2 leading-tight mb-4 min-h-[40px]">
                                        {item.post_description || "I'm looking for something..."}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-primary text-base font-bold">chat_bubble</span>
                                            <span className="text-[11px] font-black text-primary uppercase tracking-widest">
                                                {item.actual_user_id === currentVisitor?.id ? 'My Request' : 'I have this'}
                                            </span>
                                        </div>
                                        <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600">arrow_forward_ios</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex-1 text-center py-10 text-zinc-400 text-xs font-bold uppercase tracking-widest bg-white dark:bg-white/5 rounded-[2rem] border border-dashed border-zinc-200 dark:border-white/10 w-full">No live requests</div>
                    )}
                </div>
            </section>

            {/* Delicious Deals Hero */}
            <section className="px-4 lg:px-8 py-6">
                <div className="relative w-full h-[320px] lg:h-[400px] rounded-[3rem] overflow-hidden group shadow-2xl">
                    <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src={HERO_IMAGE} alt="Deals" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center p-8 lg:p-16">
                        <div className="max-w-md">
                            <span className="inline-block px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-6 shadow-lg shadow-primary/20">Hostel Special</span>
                            <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-[0.9] tracking-tighter">Delicious Deals <br />delivered to <br />your door.</h2>
                            <p className="text-white/80 mb-8 text-sm lg:text-base font-bold leading-relaxed max-w-sm">Get 50% off on all hostel deliveries tonight. Limited time offer for the final exam week.</p>
                            <div className="flex gap-4">
                                <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl transition-all text-sm shadow-xl shadow-primary/20 active:scale-95">Order Now</button>
                                <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black rounded-2xl transition-all text-sm border border-white/20 active:scale-95">View Menu</button>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                        <div className="w-8 h-1.5 bg-primary rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
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
                        { icon: 'hiking', label: 'Shoes', id: 'shoes' },
                        { icon: 'sports_baseball', label: 'Caps', id: 'caps' },
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
            <div className="p-4 lg:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 lg:gap-10 mb-20 relative">
                {(loadingFeed && orderedDisplayedFeed.length === 0) ? (
                    Array(3).fill(0).map((_, k) => (
                        <div key={k} className="bg-zinc-100 dark:bg-white/5 rounded-[2.5rem] aspect-[4/5] animate-pulse" />
                    ))
                ) : orderedDisplayedFeed.length > 0 ? (
                    <>
                        {orderedDisplayedFeed.map((product, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.01 }}
                                key={`product-${product.id}`}
                                onClick={() => openProductDetail(product)}
                                className="bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 flex flex-col group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer relative"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden m-2.5 rounded-[2rem]">
                                    <img
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        src={product.post_images?.[0] || FALLBACK_SPEAKER}
                                        onError={(e: any) => {
                                            (e.target as HTMLImageElement).src = FALLBACK_SPEAKER;
                                        }}
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
                                            {product.price > 0 ? (
                                                <>
                                                    <span className="text-primary font-black text-2xl leading-none">₦{product.price?.toLocaleString()}</span>
                                                    {product.discount_price && <span className="text-xs text-zinc-500 dark:text-zinc-400 line-through font-medium mt-1">₦{product.discount_price.toLocaleString()}</span>}
                                                </>
                                            ) : (
                                                <span className="text-zinc-400 font-bold text-sm h-6">Contact for price</span>
                                            )}
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
                        ))}

                        {/* Improved Infinite Scroll Trigger & loadingMore Indicator */}
                        {hasMore && (
                            <div
                                ref={lastElementRef as any}
                                className="col-span-full flex justify-center py-10 min-h-[100px]"
                            >
                                {loadingMore && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="col-span-2 text-center py-20 text-zinc-400 font-bold uppercase tracking-widest text-xs">No products in this category</div>
                )}
            </div>

            {/* Product Detail Sheet */}
            <ProductDetailSheetV2
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                product={selectedProduct}
                isAdmin={currentVisitor?.is_admin}
            />

            {/* Live Request Details Sheet (Management) */}
            <RequestDetailsSheetV2
                isOpen={isRequestOpen}
                onClose={() => setIsRequestOpen(false)}
                request={selectedRequest}
                currentVisitorId={currentVisitor?.id}
                isAdmin={currentVisitor?.is_admin}
            />

            {/* Live Request Response Sheet (Other users) */}
            <LiveRequestResponseSheetV2
                isOpen={isResponseOpen}
                onClose={() => setIsResponseOpen(false)}
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

            {/* School Selection Modal */}
            <SchoolSelectionModalV2
                isOpen={isSchoolModalOpen}
                onClose={() => setIsSchoolModalOpen(false)}
                currentSchoolId={selectedSchoolId}
                onSelect={(schoolId) => {
                    localStorage.setItem('selectedSchoolId', schoolId);
                    setSelectedSchoolId(schoolId);
                    setIsSchoolModalOpen(false);
                    // toast.success('University updated');
                }}
            />
        </V2Layout>
    );
};
