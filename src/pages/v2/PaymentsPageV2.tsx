import React, { useState, useEffect } from 'react';
import { V2Layout } from '../../components/v2/V2Layout';
import { supabase } from '../../lib/supabase';
import { getUserId } from '../../hooks/useTracking';
import { motion } from 'framer-motion';

export const PaymentsPageV2: React.FC = () => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const userId = await getUserId();
                if (!userId) {
                    setLoading(false);
                    return;
                }
                const { data, error } = await supabase
                    .from('invoices')
                    .select('*, merchants(merchant_name, logo_url)')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching invoices:', error);
                } else {
                    setInvoices(data || []);
                }
            } catch (error) {
                console.error('Error fetching invoices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, []);

    return (
        <V2Layout activeTab="orders"> {/* Part of orders/payments section */}
            <div className="p-6 pt-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight dark:text-white leading-none">Payments</h1>
                        <p className="text-sm font-medium text-zinc-400 tracking-wide mt-2">Billing History</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                        <span className="material-symbols-outlined text-3xl">payments</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="mt-4 text-zinc-400 font-bold uppercase tracking-widest text-xs">Fetching Invoices...</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-zinc-100 dark:bg-white/5 p-8 rounded-[2.5rem] mb-6 text-zinc-300 dark:text-zinc-600">
                            <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
                        </div>
                        <h3 className="text-xl font-black dark:text-white mb-2">No invoices yet</h3>
                        <p className="text-sm text-zinc-400 font-medium max-w-[240px]">Your payment history and invoices will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-20">
                        {invoices.map((inv, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={inv.id}
                                className="bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-300 flex items-center gap-5"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-100 dark:border-white/5">
                                    {inv.merchants?.logo_url ? (
                                        <img src={inv.merchants.logo_url} alt="Merchant" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-zinc-400">store</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold dark:text-white text-base truncate">{inv.merchants?.merchant_name || 'Merchant'}</h4>
                                        <span className="text-primary font-bold">₦{inv.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-zinc-400 tracking-wide">{new Date(inv.created_at).toLocaleDateString()}</p>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </V2Layout>
    );
};
