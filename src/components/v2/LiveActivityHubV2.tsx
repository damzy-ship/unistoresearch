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

    if (activeUsers.length === 0) return null;

    return (
        <div className="py-4 px-4 bg-white dark:bg-[#1a110c] border-b border-primary/5">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                <div className="flex flex-col items-center flex-shrink-0 mr-1">
                    <div className="w-14 h-14 rounded-full bg-emerald-400 p-[2px] shadow-lg shadow-emerald-500/20 group cursor-pointer hover:scale-105 transition-all">
                        <div className="w-full h-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border-2 border-transparent">
                            <p className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase leading-[8px] text-center">What's<br />New</p>
                        </div>
                    </div>
                </div>

                {activeUsers.map((user, idx) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                        onClick={() => onUserClick && onUserClick(user)}
                    >
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 group-hover:scale-105 transition-all duration-300">
                                <div className="w-full h-full rounded-full bg-white dark:bg-[#111827] p-[1.5px] overflow-hidden shadow-2xl">
                                    {user.profile_picture ? (
                                        <img src={user.profile_picture} alt="u" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                                            {user.full_name?.substring(0, 1) || 'U'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#111827] rounded-full shadow-lg"></div>
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mt-1.5 max-w-[64px] truncate transition-colors group-hover:text-primary">
                            {user.full_name?.split(' ')[0]}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
