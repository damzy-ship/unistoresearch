import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityItem {
    id: string;
    created_at: string;
    post_description: string;
    post_type: 'request' | 'update';
    price: number;
    unique_visitors: {
        full_name: string;
        profile_picture: string;
    };
}

export const V2ActivitySidebar: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);

    useEffect(() => {
        const fetchActivities = async () => {
            const { data } = await supabase
                .from('hostel_product_updates')
                .select(`
                    id,
                    created_at,
                    post_description,
                    post_type,
                    price,
                    unique_visitors:actual_user_id (
                        full_name,
                        profile_picture
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                setActivities(data as any);
            }
        };

        fetchActivities();

        const channel = supabase
            .channel('v2_realtime_activity')
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

    const getTimeAgo = (dateString: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <aside className="w-80 hidden xl:flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#221610]/30 fixed right-0 h-full overflow-y-auto custom-scrollbar">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Hostel Activity</h3>
                    <div className="flex items-center gap-1.5">
                        <div className="size-1.5 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live</span>
                    </div>
                </div>

                <div className="space-y-5">
                    <AnimatePresence mode="popLayout">
                        {activities.length > 0 ? (
                            activities.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-start gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-2 -mx-2 rounded-2xl transition-all"
                                >
                                    <div className="size-10 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-white/10 flex-shrink-0 flex items-center justify-center p-0.5 group-hover:scale-110 transition-transform shadow-sm relative overflow-hidden">
                                        {item.unique_visitors?.profile_picture ? (
                                            <img src={item.unique_visitors.profile_picture} className="w-full h-full rounded-xl object-cover" alt="" />
                                        ) : (
                                            <span className="material-symbols-outlined text-primary text-xl">person</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-[13px] font-bold text-slate-700 dark:text-zinc-200 leading-snug line-clamp-2">
                                            <span className="text-primary font-black">{item.unique_visitors?.full_name?.split(' ')[0] || 'Member'}</span>
                                            <span className="text-slate-500 dark:text-zinc-400 font-medium">
                                                {item.post_type === 'request' ? ' is looking for ' : ' just listed '}
                                            </span>
                                            <span className="text-slate-800 dark:text-white">{item.post_description}</span>
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{getTimeAgo(item.created_at)}</span>
                                            {item.post_type === 'request' && (
                                                <div className="size-1 rounded-full bg-primary/40"></div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No recent activity</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>


                <div className="mt-8 bg-primary rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-primary/20 group">
                    <div className="relative z-10">
                        <h3 className="font-black text-lg mb-2">Merchant Perks</h3>
                        <p className="text-[11px] text-orange-50/80 mb-5 leading-relaxed font-bold">Join over 1,000 sellers on uni.store and reach fellow students effortlessly.</p>
                        <button className="bg-white text-primary text-[10px] font-black px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors uppercase tracking-widest active:scale-95">
                            Learn More
                        </button>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-20 group-hover:scale-110 transition-transform duration-700">
                        <span className="material-symbols-outlined text-[100px] font-black">trending_up</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
