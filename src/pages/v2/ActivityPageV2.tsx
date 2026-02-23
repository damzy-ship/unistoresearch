import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { V2Layout } from '../../components/v2/V2Layout';
import { formatTimeAgo } from '../../lib/utils';
import { ProductDetailSheetV2 } from '../../components/v2/ProductDetailSheetV2';
import { LiveRequestResponseSheetV2 } from '../../components/v2/LiveRequestResponseSheetV2';

interface ActivityItem {
    id: string;
    created_at: string;
    post_description: string;
    post_type: 'request' | 'update';
    price: number | null;
    actual_user_id: string;
    unique_visitors: {
        id: string;
        full_name: string;
        profile_picture: string;
        brand_name: string | null;
    };
}

export const ActivityPageV2: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [currentVisitor, setCurrentVisitor] = useState<any>(null);

    useEffect(() => {
        const handleAuth = (e: any) => {
            setCurrentVisitor(e.detail?.visitor);
        };
        window.addEventListener('auth-state-changed', handleAuth);

        // Proactively request current state
        window.dispatchEvent(new CustomEvent('request-auth-state'));

        return () => window.removeEventListener('auth-state-changed', handleAuth);
    }, []);

    const fetchActivities = async () => {
        const { data } = await supabase
            .from('hostel_product_updates')
            .select(`
                id,
                created_at,
                post_description,
                post_type,
                price,
                actual_user_id,
                unique_visitors:actual_user_id (
                    id,
                    full_name,
                    profile_picture,
                    brand_name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(30);

        if (data) {
            setActivities(data as any);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchActivities();

        const channel = supabase
            .channel('activity_page_realtime')
            .on('postgres_changes' as any, {
                event: 'INSERT',
                table: 'hostel_product_updates'
            }, () => {
                fetchActivities();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleItemClick = (item: ActivityItem) => {
        setSelectedItem(item);
        if (item.post_type === 'request') {
            setIsRequestOpen(true);
        } else {
            setIsDetailOpen(true);
        }
    };

    return (
        <V2Layout activeTab="activity">
            <div className="max-w-2xl mx-auto px-4 py-6 mb-24">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-[#1a2a40] dark:text-white">Activity Feed</h2>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Live from your university</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="h-24 w-full bg-zinc-100 dark:bg-white/5 animate-pulse rounded-[2rem]" />
                            ))
                        ) : activities.length > 0 ? (
                            activities.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleItemClick(item)}
                                    className="flex items-start gap-4 p-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[2rem] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group shadow-sm"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden border border-black/5 dark:border-white/5">
                                        {item.unique_visitors?.profile_picture ? (
                                            <img src={item.unique_visitors.profile_picture} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary font-black uppercase text-lg">
                                                {item.unique_visitors?.full_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-[14px] leading-snug">
                                            <span className="font-black text-primary group-hover:underline">
                                                {item.unique_visitors?.brand_name || item.unique_visitors?.full_name?.split(' ')[0]}
                                            </span>
                                            <span className="text-zinc-500 font-medium mx-1">
                                                {item.post_type === 'request' ? 'is looking for' : 'just listed'}
                                            </span>
                                            <span className="font-bold text-[#1a2a40] dark:text-white">
                                                "{item.post_description}"
                                            </span>
                                        </p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                {formatTimeAgo(item.created_at)}
                                            </span>
                                            {item.post_type === 'request' && (
                                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Request</span>
                                            )}
                                            {item.price && (
                                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">₦{item.price.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="size-8 rounded-full flex items-center justify-center bg-zinc-50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-zinc-400">chevron_right</span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">notification_important</span>
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No activity yet</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals for when an activity is clicked */}
            {isDetailOpen && selectedItem && (
                <ProductDetailSheetV2
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    product={{
                        ...selectedItem,
                        id: selectedItem.id, // Ensure ID is mapped correctly for the sheet
                        merchant: selectedItem.unique_visitors
                    }}
                    isAdmin={currentVisitor?.is_admin}
                />
            )}

            {isRequestOpen && selectedItem && (
                <LiveRequestResponseSheetV2
                    isOpen={isRequestOpen}
                    onClose={() => setIsRequestOpen(false)}
                    request={{
                        ...selectedItem,
                        actual_user_id: selectedItem.actual_user_id,
                        unique_visitors: selectedItem.unique_visitors
                    }}
                    currentVisitorId={currentVisitor?.id}
                    isAdmin={currentVisitor?.is_admin}
                />
            )}
        </V2Layout>
    );
};
