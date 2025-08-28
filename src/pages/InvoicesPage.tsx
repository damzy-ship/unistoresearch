import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';

interface InvoiceData {
  merchant_name: string;
  merchant_number: string;
  merchant_Id: string;
  customer_email?: string;
  customer_name: string;
  customer_number?: string;
  customer_Id: string;
  invoice_amount: number | string;
  invoice_status: string;
  created_at?: string;
}

export default function InvoicesPage() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalCredit, setTotalCredit] = useState<number>(0);
  const [totalCollected, setTotalCollected] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        navigate('/');
        return;
      }

      try {
        // Fetch invoices where the user is either the merchant or the customer
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .or(`merchant_id.eq.${userId},customer_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching invoices:', error);
          setError('Failed to load invoices');
        } else if (data) {
          const rows = data as InvoiceData[];
          setInvoices(rows);

          // compute totals for the currently authenticated merchant
          const totalPaid = rows
            .filter(r => (r.merchant_Id === userId || r.merchant_Id === (r.merchant_Id)) && (r.invoice_status || '').toLowerCase() === 'paid')
            .reduce((s, r) => s + (Number(r.invoice_amount) || 0), 0);

          const totalCollected = rows
            .filter(r => (r.merchant_Id === userId || r.merchant_Id === (r.merchant_Id)) && (r.invoice_status || '').toLowerCase() === 'collected')
            .reduce((s, r) => s + (Number(r.invoice_amount) || 0), 0);

          setTotalCredit(totalPaid);
          setTotalCollected(totalCollected);
        }
      } catch (err) {
        console.error(err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const formatAmount = (amount: number | string) => {
    const num = typeof amount === 'number' ? amount : Number(amount || 0);
    try {
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(num);
    } catch {
      return `₦${num}`;
    }
  };
  

  return (
    <div className="min-h-screen py-12 px-4 transition-colors duration-300" style={{ backgroundColor: currentTheme.background }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-5xl md:text-6xl text-center font-bold mb-2">
            <span style={{ color: currentTheme.primary }}>uni</span>
            <span style={{ color: currentTheme.secondary }}>store.</span>
          </h1>
          <h3 className="text-lg font-bold mb-6 bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
            Your Invoices
          </h3>
        </div>

        <div className="rounded-xl shadow-lg p-6" style={{ backgroundColor: currentTheme.surface }}>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: currentTheme.background, border: `1px solid ${currentTheme.primary}20` }}>
              <p className="text-sm font-medium" style={{ color: currentTheme.textSecondary }}>Total credit</p>
              <p className="text-2xl font-bold mt-2" style={{ color: currentTheme.text }}>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalCredit)}</p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: currentTheme.background, border: `1px solid ${currentTheme.primary}20` }}>
              <p className="text-sm font-medium" style={{ color: currentTheme.textSecondary }}>Total collected</p>
              <p className="text-2xl font-bold mt-2" style={{ color: currentTheme.text }}>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalCollected)}</p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.primary }} />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p style={{ color: currentTheme.text }}>{error}</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: currentTheme.text }}>No invoices found.</p>
              <p className="text-sm mt-2" style={{ color: currentTheme.textSecondary }}>You can create or receive payments to see invoices here.</p>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="grid gap-4">
                {invoices.map((inv, idx) => (
                  <div key={idx} className="p-4 rounded-xl shadow-sm flex justify-between gap-4" style={{ backgroundColor: currentTheme.background, border: `1px solid ${currentTheme.primary}20` }}>
                    <div>
                      <p className="text-xs font-medium" style={{ color: currentTheme.textSecondary }}>Merchant</p>
                      <p className="font-semibold text-base" style={{ color: currentTheme.text }}>{inv.merchant_name || inv.merchant_number}</p>

                      <p className="text-xs font-medium mt-3" style={{ color: currentTheme.textSecondary }}>Customer</p>
                      <p className="font-semibold text-sm" style={{ color: currentTheme.text }}>{inv.customer_name || inv.customer_number}</p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end justify-center">
                      <p className="font-bold text-lg" style={{ color: currentTheme.text }}>{formatAmount(inv.invoice_amount)}</p>
                      <div className="mt-2">
                        {inv.invoice_status && (inv.invoice_status.toLowerCase() === 'collected' ? (
                          <span className="inline-block px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#E6FFFA', color: '#0F766E' }}>Collected</span>
                        ) : inv.invoice_status.toLowerCase() === 'paid' ? (
                          <span className="inline-block px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#ECFEFF', color: '#0369A1' }}>Paid</span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>{inv.invoice_status}</span>
                        ))}
                      </div>

                      {inv.created_at && (
                        <p className="text-xs mt-2" style={{ color: currentTheme.textSecondary }}>{new Date(inv.created_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
