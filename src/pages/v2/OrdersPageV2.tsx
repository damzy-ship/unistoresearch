import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { V2Layout } from '../../components/v2/V2Layout';
import { supabase, RequestLog } from '../../lib/supabase';
import { getUserId } from '../../hooks/useTracking';
import { motion } from 'framer-motion';

export const OrdersPageV2: React.FC = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<RequestLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUserRequests = async () => {
            setLoading(true);
            try {
                const userId = await getUserId();
                if (!userId) {
                    setLoading(false);
                    return;
                }
                const { data, error } = await supabase
                    .from('request_logs')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching user requests:', error);
                } else {
                    setRequests(data || []);
                }
            } catch (error) {
                console.error('Error fetching user requests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRequests();
    }, []);

    const filteredRequests = requests.filter(request =>
        request.request_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.university.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <V2Layout activeTab="orders">
            <div className="p-6 pt-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight dark:text-white leading-none">Your Orders</h1>
                        <p className="text-sm font-medium text-zinc-400 tracking-wide mt-2">Activity History</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                        <span className="material-symbols-outlined text-3xl">receipt_long</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-zinc-400">search</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="mt-4 text-zinc-400 font-bold uppercase tracking-widest text-xs">Loading Activities...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-zinc-100 dark:bg-white/5 p-8 rounded-full mb-6 text-zinc-300 dark:text-zinc-600">
                            <span className="material-symbols-outlined text-6xl">shopping_basket</span>
                        </div>
                        <h3 className="text-xl font-black dark:text-white mb-2">No orders found</h3>
                        <p className="text-sm text-zinc-400 font-medium max-w-[240px]">You haven't made any requests or orders yet.</p>
                        <button
                            onClick={() => navigate('/v2/hostel')}
                            className="mt-8 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest"
                        >
                            Explore Hostel
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 pb-20">
                        {filteredRequests.map((req, i) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                key={req.id}
                                className="bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[2.5rem] p-7 shadow-sm hover:shadow-2xl transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                                            <span className="material-symbols-outlined text-xl">package_2</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: {req.id.slice(0, 8)}</p>
                                            <p className="text-xs font-medium text-zinc-500">{formatDate(req.created_at)}</p>
                                        </div>
                                    </div>
                                    <span className="bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Completed</span>
                                </div>

                                <div className="mb-8 px-1">
                                    <p className="text-xl font-bold dark:text-white leading-tight">"{req.request_text}"</p>
                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="material-symbols-outlined text-zinc-400 text-sm">location_on</span>
                                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-[0.1em]">{req.university}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button className="flex-1 h-14 border border-zinc-100 dark:border-white/10 rounded-2xl text-xs font-bold tracking-wide dark:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                        Details
                                    </button>
                                    <button className="flex-1 h-14 bg-primary text-white rounded-2xl text-xs font-bold tracking-wide shadow-xl shadow-primary/10 active:scale-95 transition-all">
                                        Contact Seller
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </V2Layout>
    );
};
