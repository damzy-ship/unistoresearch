import { useEffect, useState } from 'react';
import { supabase, UniqueVisitor } from '../../lib/supabase';
import { motion } from 'framer-motion';

interface LiveActivityHubProps {
    onUserClick?: (user: UniqueVisitor) => void;
}

export default function LiveActivityHub({ onUserClick }: LiveActivityHubProps) {
    const [activeUsers, setActiveUsers] = useState<UniqueVisitor[]>([]);

    useEffect(() => {
        const fetchActiveUsers = async () => {
            // In a real scenario, this would check 'last_seen' or similar.
            // For now, we'll fetch distinct users from recent posts/updates to simulate "activity"
            // or just recent unique visitors if that column existed.
            // Using `unique_visitors` table directly might be heavy if not optimized,
            // but let's just grab a few recent ones for the "Visual Life" effect.

            // We'll mimic this by grabbing users who posted recently.
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
                setActiveUsers(Array.from(unique.values()).slice(0, 10)); // Top 10 recent
            }
        };

        fetchActiveUsers();
    }, []);

    if (activeUsers.length === 0) return null;

    return (
        <div className="py-2 px-4 border-b border-gray-800/50">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                <div className="flex flex-col items-center flex-shrink-0 mr-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-300 flex items-center justify-center mb-1 ring-2 ring-gray-900 border-2 border-transparent">
                        <span className="text-gray-900 font-bold text-xs text-center leading-tight">WHAT'S<br />NEW</span>
                    </div>
                </div>

                {activeUsers.map((user, idx) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onUserClick && onUserClick(user)}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-pink-500">
                                <div className="w-full h-full rounded-full bg-gray-900 p-[2px] overflow-hidden">
                                    {user.profile_picture ? (
                                        <img src={user.profile_picture} alt="u" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
                                            {user.full_name?.substring(0, 1) || 'U'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 max-w-[60px] truncate">{user.full_name?.split(' ')[0]}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
