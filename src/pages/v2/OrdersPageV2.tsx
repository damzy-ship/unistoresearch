import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { V2Layout } from '../../components/v2/V2Layout';
import { supabase, RequestLog } from '../../lib/supabase';
import { getUserId } from '../../hooks/useTracking';
import { motion } from 'framer-motion';
import { RequestDetailsSheetV2 } from '../../components/v2/RequestDetailsSheetV2';

export const OrdersPageV2: React.FC = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<RequestLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

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
        return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    };

    const stats = {
        total: requests.length,
        bingham: requests.filter(r => r.university === 'Bingham').length,
        veritas: requests.filter(r => r.university === 'Veritas').length,
        matches: requests.filter(r => r.matched_seller_ids && r.matched_seller_ids.length > 0).length
    };

    return (
        <V2Layout activeTab="orders">
            <div className="p-6 pt-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[#1a2a40] dark:text-white leading-none">Your Requests</h1>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500 tracking-wide mt-2">Activity History</p>
                    </div>
                </div>

                {/* Request Summary Slider/Grid */}
                <div className="mb-10 px-1">
                    <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">Your Request Summary</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        <div className="min-w-[140px] bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 p-5 rounded-[2rem] shadow-sm">
                            <p className="text-2xl font-black dark:text-white leading-none">{stats.total}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Total Requests</p>
                        </div>
                        <div className="min-w-[140px] bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 p-5 rounded-[2rem] shadow-sm">
                            <p className="text-2xl font-black dark:text-white leading-none">{stats.bingham}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Bingham Requests</p>
                        </div>
                        <div className="min-w-[140px] bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 p-5 rounded-[2rem] shadow-sm">
                            <p className="text-2xl font-black dark:text-white leading-none">{stats.veritas}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Veritas Requests</p>
                        </div>
                        <div className="min-w-[140px] bg-primary/10 border border-primary/20 p-5 rounded-[2rem] shadow-sm">
                            <p className="text-2xl font-black text-primary leading-none">{stats.matches}</p>
                            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-2">With Matches</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-zinc-400">search</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Search your requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[1.5rem] py-4 pl-12 pr-4 text-sm font-medium dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
                        <h3 className="text-xl font-black dark:text-white mb-2">No items found</h3>
                        <p className="text-sm text-zinc-400 font-medium max-w-[240px]">You haven't made any requests or orders yet.</p>
                        <button
                            onClick={() => navigate('/v2/hostel')}
                            className="mt-8 bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest"
                        >
                            Request Something
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 pb-40">
                        {filteredRequests.map((req, i) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                key={req.id}
                                className="bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[2.5rem] p-7 shadow-sm hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 dark:text-white transition-opacity">
                                    <span className="material-symbols-outlined text-8xl rotate-12">inventory_2</span>
                                </div>

                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{req.university} University</p>
                                        <p className="text-xs font-bold text-zinc-300">{formatDate(req.created_at)}</p>
                                    </div>
                                    <span className="bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/5 dark:border-white/5">COMPLETED</span>
                                </div>

                                <div className="mb-10 px-1 relative z-10">
                                    <p className="text-2xl font-black dark:text-white leading-tight mb-4 group-hover:text-primary transition-colors duration-300">"{req.request_text}"</p>
                                    <div className="flex items-center gap-2 mt-4 text-zinc-400">
                                        <span className="material-symbols-outlined text-sm">group</span>
                                        <span className="text-xs font-bold uppercase tracking-widest">{req.matched_seller_ids?.length || 0} sellers matched</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setSelectedRequest(req)}
                                        className="h-14 px-8 border border-zinc-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest dark:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition-all active:scale-95"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequest(req)}
                                        className="flex-1 h-14 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">chat</span>
                                        Contact Seller
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <RequestDetailsSheetV2
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                request={selectedRequest}
            />
        </V2Layout>
    );
};
