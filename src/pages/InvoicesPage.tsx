import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// --- INTERFACES AND TYPES ---
interface InvoiceData {
  merchant_name: string;
  merchant_number: string;
  merchant_id: string;
  customer_email?: string;
  customer_name: string;
  customer_number?: string;
  customer_id: string;
  invoice_amount: number | string;
  invoice_status: string;
  created_at?: string;
}

type GroupedInvoices = {
  [key: string]: InvoiceData[];
};


// --- SVG ICONS ---
const ArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
  </svg>
);

const ClockIcon = () => (
  // replaced clock SVG with a check-circle SVG
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
  </svg>
);


// --- MAIN COMPONENT ---
export default function InvoicesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [groupedInvoices, setGroupedInvoices] = useState<GroupedInvoices>({});
  const [totalCollected, setTotalCollected] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);

  useEffect(() => {


    const loadInvoices = async () => {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        navigate('/');
        return;
      }
      setUserId(currentUserId);

      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .or(`merchant_id.eq.${currentUserId},customer_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching invoices:', error);
          setError('Failed to load your invoices.');
        } else if (data) {
          const rows = data as InvoiceData[];

          // Calculate user-centric totals
          const userTotalCollected = rows
            .filter(r => r.merchant_id === currentUserId && (r.invoice_status || '').toLowerCase() === 'collected')
            .reduce((sum, r) => sum + Number(r.invoice_amount || 0), 0);
          
          const userTotalPaid = rows
            .filter(r => r.merchant_id === currentUserId && (r.invoice_status || '').toLowerCase() === 'paid')
            .reduce((sum, r) => sum + Number(r.invoice_amount || 0), 0);

          setTotalCollected(userTotalCollected);
          setTotalPaid(userTotalPaid);

          // Group invoices by month
          const grouped = rows.reduce((acc: GroupedInvoices, inv) => {
            const date = new Date(inv.created_at || new Date());
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!acc[monthYear]) {
              acc[monthYear] = [];
            }
            acc[monthYear].push(inv);
            return acc;
          }, {});

          setGroupedInvoices(grouped);
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
        setError('An unexpected error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [navigate]);

  const formatAmount = (amount: number | string) => {
    const num = Number(amount || 0);
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(num);
  };

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold">
                <span className="text-orange-500">uni</span>
                <span className="text-blue-500">store.</span>
            </h1>
            <h3 className="text-lg font-semibold text-gray-500 mt-2">
                Your Invoices
            </h3>
        </header>

        <main className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="border-b border-gray-200 pb-4 mb-4">
                 <h2 className="text-xl font-bold text-gray-900">All Transactions</h2>
                 <div className="flex justify-between items-center mt-2 text-sm">
                    <p className="text-gray-600">Total Income: <span className="font-semibold text-yellow-600">{formatAmount(totalPaid)}</span></p>
                    <p className="text-gray-600">Total Collected: <span className="font-semibold text-green-600">{formatAmount(totalCollected)}</span></p>
                 </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : Object.keys(groupedInvoices).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-800 text-lg">No invoices found.</p>
                <p className="text-sm mt-2 text-gray-500">Create or receive payments to see invoices here.</p>
              </div>
            ) : (
                <div className="flow-root">
                    {Object.entries(groupedInvoices).map(([monthYear, invoices]) => (
                        <div key={monthYear}>
                            <h4 className="text-sm font-semibold text-gray-500 my-4 px-2">{monthYear}</h4>
                            <ul className="space-y-3">
                                {invoices.map((inv, idx) => {
                                    const isMerchant = inv.merchant_id === userId;
                                    const isCustomer = inv.customer_id === userId;
                                    const status = (inv.invoice_status || '').toLowerCase();

                                    let icon, title, amountPrefix = '', amountColor = 'text-gray-800', subtext;
                                    
                                    // Determine transaction type from the user's perspective
                                    if (isMerchant && status === 'collected') {
                                        icon = <ArrowDownIcon />;
                                        title = `Payment from ${inv.customer_name || inv.customer_number}`;
                                        subtext = 'Invoice Collected';
                                        amountPrefix = '+';
                                        amountColor = 'text-green-600';
                                    }
                                    else if (isCustomer && status === 'returned') {
                                        icon = <ArrowDownIcon />;
                                        title = `Payment to ${inv.merchant_name || inv.merchant_number}`;
                                        subtext = 'Invoice Returned';
                                        amountPrefix = '+';
                                        amountColor = 'text-green-600';
                                    }
                                     else if (isCustomer && status === 'paid') {
                                        icon = <ArrowUpIcon />;
                                        title = `Payment to ${inv.merchant_name || inv.merchant_number}`;
                                        subtext = 'Invoice Paid';
                                        amountPrefix = '-';
                                        amountColor = 'text-red-600';
                                    } else if (isCustomer && status === 'collected') {
                                        icon = <ArrowUpIcon />;
                                        title = `Payment to ${inv.merchant_name || inv.merchant_number}`;
                                        subtext = 'Invoice Collected';
                                        amountPrefix = '-';
                                        amountColor = 'text-red-600';
                                    } else {
                                        icon = <ClockIcon />;
                                        title = isMerchant 
                                            ? `Payment from ${inv.customer_name || inv.customer_number}` 
                                            : `Payment to ${inv.merchant_name || inv.merchant_number}`;
                                        subtext = `Status: ${inv.invoice_status}`;
                                        amountColor = 'text-yellow-600';
                                    }
                                    
                                    return (
                                        <li key={`${inv.customer_id}-${inv.created_at}-${idx}`} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center space-x-4">
                                            <div className="flex-shrink-0 bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center">
                                                {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                                                <p className="text-xs text-gray-500 truncate">{new Date(inv.created_at || '').toLocaleString()}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-sm font-bold ${amountColor}`}>{amountPrefix}{formatAmount(inv.invoice_amount)}</p>
                                                <p className="text-xs text-gray-500">{subtext}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </main>
      </div>
    </div>
  );
}

