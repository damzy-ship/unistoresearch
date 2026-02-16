import React, { useState, useEffect } from 'react';
import { V2Layout } from '../../components/v2/V2Layout';
import { supabase } from '../../lib/supabase';
import { getUserId } from '../../hooks/useTracking';
import { motion } from 'framer-motion';
import InvoiceModal from '../../components/InvoiceModal';

export const PaymentsPageV2: React.FC = () => {
    const [groupedInvoices, setGroupedInvoices] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [stats, setStats] = useState({ collected: 0, paid: 0 });

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const currentUserId = await getUserId();
                if (!currentUserId) {
                    setLoading(false);
                    return;
                }
                setUserId(currentUserId);

                const { data, error } = await supabase
                    .from('invoices')
                    .select('*')
                    .or(`merchant_id.eq.${currentUserId},customer_id.eq.${currentUserId}`)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching invoices:', error);
                } else if (data) {
                    // Group invoices by month
                    const grouped = data.reduce((acc: Record<string, any[]>, inv) => {
                        const date = new Date(inv.created_at || new Date());
                        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                        if (!acc[monthYear]) acc[monthYear] = [];
                        acc[monthYear].push(inv);
                        return acc;
                    }, {});

                    setGroupedInvoices(grouped);

                    // Calculate totals
                    const collected = data
                        .filter(inv => inv.merchant_id === currentUserId && (inv.invoice_status || inv.status || '').toLowerCase() === 'collected')
                        .reduce((sum, inv) => sum + Number(inv.invoice_amount || inv.amount || 0), 0);

                    const paid = data
                        .filter(inv => inv.customer_id === currentUserId && (inv.invoice_status || inv.status || '').toLowerCase() === 'paid')
                        .reduce((sum, inv) => sum + Number(inv.invoice_amount || inv.amount || 0), 0);

                    setStats({ collected, paid });
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

                {/* Summary Stats Card */}
                <div className="mb-10 bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[2.5rem] p-7 shadow-sm">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total Collected</p>
                            <p className="text-2xl font-black text-emerald-500">₦{stats.collected.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 border-l border-zinc-50 dark:border-white/5 pl-6">
                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total Paid</p>
                            <p className="text-2xl font-black dark:text-white">₦{stats.paid.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="mt-4 text-zinc-400 font-bold uppercase tracking-widest text-xs">Fetching Invoices...</p>
                    </div>
                ) : Object.keys(groupedInvoices).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-zinc-100 dark:bg-white/5 p-8 rounded-[2.5rem] mb-6 text-zinc-300 dark:text-zinc-600">
                            <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
                        </div>
                        <h3 className="text-xl font-black dark:text-white mb-2">No invoices yet</h3>
                        <p className="text-sm text-zinc-400 font-medium max-w-[240px]">Your payment history and invoices will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-10 pb-40">
                        {Object.entries(groupedInvoices).map(([monthYear, monthInvoices]) => (
                            <div key={monthYear} className="space-y-4">
                                <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] px-2">{monthYear}</h3>
                                {monthInvoices.map((inv, i) => {
                                    const isMerchant = inv.merchant_id === userId;
                                    const status = (inv.invoice_status || inv.status || '').toLowerCase();
                                    const title = isMerchant
                                        ? `Payment from ${inv.customer_name || inv.customer_number || 'Customer'}`
                                        : `Payment to ${inv.merchant_name || 'Merchant'}`;

                                    const isPositive = isMerchant && status === 'collected';
                                    const isPaid = status === 'paid';

                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={inv.id}
                                            onClick={() => {
                                                // Map V2 invoice to V1 InvoiceData interface expected by InvoiceModal
                                                setSelectedInvoice({
                                                    ...inv,
                                                    invoice_amount: inv.invoice_amount || inv.amount,
                                                    invoice_status: inv.invoice_status || inv.status
                                                });
                                            }}
                                            className="bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[2rem] p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center gap-4 group cursor-pointer"
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                isPaid ? 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-400' :
                                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                }`}>
                                                <span className="material-symbols-outlined text-2xl">
                                                    {isPositive ? 'south_west' : isPaid ? 'check_circle' : 'north_east'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold dark:text-white text-sm truncate group-hover:text-primary transition-colors">{title}</h4>
                                                <p className="text-[10px] font-medium text-zinc-400 tracking-wide mt-0.5">
                                                    {new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`font-black text-sm ${isPositive ? 'text-emerald-500' : 'dark:text-white'}`}>
                                                    {isPositive ? '+' : '-'}₦{(inv.invoice_amount || inv.amount || 0).toLocaleString()}
                                                </p>
                                                <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${status === 'paid' ? 'bg-zinc-100 dark:bg-white/10 text-zinc-500' :
                                                    status === 'collected' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                    {status}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <InvoiceModal
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
            />
        </V2Layout>
    );
};
