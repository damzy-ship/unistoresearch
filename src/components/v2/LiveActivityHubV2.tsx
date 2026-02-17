import { useEffect, useState } from 'react';
import { supabase, UniqueVisitor } from '../../lib/supabase';
import { motion } from 'framer-motion';

interface LiveActivityHubV2Props {
    onUserClick?: (user: UniqueVisitor) => void;
}

export const LiveActivityHubV2: React.FC<LiveActivityHubV2Props> = ({ onUserClick }) => {
    const [activeUsers, setActiveUsers] = useState<UniqueVisitor[]>([]);

    useEffect(() => {
        const fetchActiveUsers = async () => {
            const { data } = await supabase
                .from('hostel_product_updates')
                .select('actual_user_id, unique_visitors(id, full_name, profile_picture, brand_name, phone_number, hostels(name))')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                const unique = new Map();
                data.forEach((item: any) => {
                    if (item.unique_visitors && !unique.has(item.unique_visitors.id)) {
                        unique.set(item.unique_visitors.id, item.unique_visitors);
                    }
                });
                setActiveUsers(Array.from(unique.values()).slice(0, 10) as unknown as UniqueVisitor[]);
            }
        };

        fetchActiveUsers();
    }, []);

    // Stabilize rendering: Always return the container to prevent React hydration/removeChild crashes
    const hasUsers = activeUsers.length > 0;

    return (
        <div className={`py-4 border-b border-black/5 dark:border-white/5 bg-transparent transition-opacity duration-500 ${hasUsers ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex items-center gap-5 overflow-x-auto no-scrollbar py-2 px-6">
                {/* What's New Circle */}
                <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2 group-hover:scale-110 transition-all duration-500 ring-2 ring-primary/20 ring-offset-2 ring-offset-white dark:ring-offset-[#221610]">
                            <p className="text-[7.5px] font-black text-white uppercase leading-[8px] text-center tracking-tighter">WHAT'S<br />NEW</p>
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1">Live</span>
                </div>

                {/* Merchant Story Avatars */}
                {activeUsers.map((user, idx) => (
                    <motion.div
                        key={`story-${user.id}-${idx}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                        onClick={() => onUserClick && onUserClick(user)}
                    >
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full p-[1.5px] bg-primary group-hover:scale-105 transition-all duration-300 shadow-md">
                                <div className="w-full h-full rounded-full bg-white dark:bg-[#1a110c] p-[1.5px] overflow-hidden">
                                    {user.profile_picture ? (
                                        <img src={user.profile_picture} alt="story" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-xs font-black text-primary uppercase">
                                            {user.full_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-primary border-2 border-white dark:border-[#221610] rounded-full shadow-sm z-10 transition-transform group-hover:scale-110"></div>
                        </div>
                        <span className="text-[9px] font-black text-[#1a2a40]/60 dark:text-zinc-400 uppercase tracking-tighter mt-1.5 max-w-[56px] truncate transition-colors group-hover:text-primary">
                            {user.brand_name || user.full_name?.split(' ')[0]}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
