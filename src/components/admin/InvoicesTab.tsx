import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { Check, Search } from 'lucide-react';

interface Invoice {
  id: number | string;
  merchant_name: string;
  merchant_Id: string;
  merchant_number?: string;
  customer_name: string;
  customer_Id: string;
  customer_number?: string;
  invoice_amount: number | string;
  invoice_status: string;
  payment_reference?: string;
  created_at?: string;
  payment_reference?: string;
}

export default function InvoicesTab() {
  const { currentTheme } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [totalPaidAmount, setTotalPaidAmount] = useState<number>(0);
  const [totalCollectedAmount, setTotalCollectedAmount] = useState<number>(0);
  const [period, setPeriod] = useState<'all' | 'week' | 'month' | 'date'>('all');
  const [periodValue, setPeriodValue] = useState<string>('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: resData, error: resError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (resError) {
        console.error('Error loading invoices', resError);
        setError('Failed to load invoices');
      } else if (resData) {
        const rows = resData as Invoice[];
        setInvoices(rows);

        const paidSum = rows
          .filter(r => (r.invoice_status || '').toLowerCase() === 'paid')
          .reduce((s, r) => s + (Number(r.invoice_amount) || 0), 0);

        const collectedSum = rows
          .filter(r => (r.invoice_status || '').toLowerCase() === 'collected')
          .reduce((s, r) => s + (Number(r.invoice_amount) || 0), 0);

        setTotalPaidAmount(paidSum);
        setTotalCollectedAmount(collectedSum);
      }
    } catch (err) {
      console.error(err);
      setError('Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setSelectedInvoice(null);
    setConfirmOpen(false);
  };

  const markCollected = async () => {
    if (!selectedInvoice) return;
    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ invoice_status: 'collected' })
        .eq('id', selectedInvoice.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice', error);
        setError('Failed to update invoice');
      } else {
        // Update local state
        setInvoices(prev => prev.map(i => i.id === selectedInvoice.id ? { ...i, invoice_status: 'collected' } : i));
        closeConfirm();
      }
    } catch (err) {
      console.error(err);
      setError('Unexpected error');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = invoices.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(i.id).toLowerCase().includes(q) ||
      (i.merchant_name || '').toLowerCase().includes(q) ||
      (i.customer_name || '').toLowerCase().includes(q) ||
      (i.invoice_status || '').toLowerCase().includes(q) ||
      (i.payment_reference || '').toLowerCase().includes(q)
    );
  });

  const filterByPeriod = (arr: Invoice[]) => {
    if (period === 'all') return arr;
    const pv = periodValue;
    return arr.filter(inv => {
      if (!inv.created_at) return false;
      const d = new Date(inv.created_at);

      if (period === 'date') {
        if (!pv) return true;
        const target = new Date(pv);
        return d.toDateString() === target.toDateString();
      }

      if (period === 'month') {
        if (!pv) {
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        // pv is format YYYY-MM
        const [y, m] = pv.split('-').map(Number);
        return d.getFullYear() === y && (d.getMonth() + 1) === m;
      }

      if (period === 'week') {
        // pv is a date within desired week or empty => use last 7 days
        if (!pv) {
          const now = new Date();
          const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 7;
        }
        const ref = new Date(pv);
        const refDay = ref.getDay();
        const weekStart = new Date(ref);
        weekStart.setDate(ref.getDate() - refDay);
        weekStart.setHours(0,0,0,0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return d >= weekStart && d < weekEnd;
      }

      return true;
    });
  };

  const finalFiltered = filterByPeriod(filtered);

  const formatAmount = (amt: number | string) => {
    const n = typeof amt === 'number' ? amt : Number(amt || 0);
    try {
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
    } catch { return `₦${n}`; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: currentTheme.text }}>Invoices</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by id, merchant, customer or status"
              className="pl-10 pr-3 py-2 border rounded-lg text-sm"
              style={{ backgroundColor: currentTheme.background, borderColor: currentTheme.primary + '20', color: currentTheme.text }}
            />
          </div>
        </div>
      </div>

      {/* Stats and period filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: currentTheme.background, border: `1px solid ${currentTheme.primary}20` }}>
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="text-lg font-bold" style={{ color: currentTheme.text }}>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalPaidAmount)}</p>
        </div>

        <div className="p-3 rounded-xl" style={{ backgroundColor: currentTheme.background, border: `1px solid ${currentTheme.primary}20` }}>
          <p className="text-xs text-gray-500">Total Collected</p>
          <p className="text-lg font-bold" style={{ color: currentTheme.text }}>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalCollectedAmount)}</p>
        </div>

        <div className="p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: currentTheme.background, border: `1px solid ${currentTheme.primary}20` }}>
          <select value={period} onChange={(e) => setPeriod(e.target.value as 'all'|'week'|'month'|'date')} className="px-3 py-2 rounded-lg text-sm" style={{ borderColor: currentTheme.primary + '20', backgroundColor: currentTheme.background, color: currentTheme.text }}>
            <option value="all">All time</option>
            <option value="week">Last 7 days</option>
            <option value="month">This month</option>
            <option value="date">Specific date</option>
          </select>
          {period === 'date' && (
            <input type="date" value={periodValue} onChange={(e) => setPeriodValue(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ borderColor: currentTheme.primary + '20', backgroundColor: currentTheme.background, color: currentTheme.text }} />
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {finalFiltered.map(inv => (
                <tr key={String(inv.id)} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-700">{inv.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{inv.merchant_name || inv.merchant_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{inv.customer_name || inv.customer_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{inv.payment_reference || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: currentTheme.text }}>{formatAmount(inv.invoice_amount)}</td>
                  <td className="px-4 py-3 text-sm">
                    {inv.invoice_status?.toLowerCase() === 'collected' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#E6FFFA', color: '#065F46' }}>Collected</span>
                    ) : inv.invoice_status?.toLowerCase() === 'paid' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#ECFEFF', color: '#075985' }}>Paid</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>{inv.invoice_status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{inv.created_at ? new Date(inv.created_at).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewInvoice(inv)} className="px-3 py-1 rounded-lg border text-sm" style={{ borderColor: currentTheme.primary + '20' }}>View</button>
                      {inv.invoice_status?.toLowerCase() === 'paid' && (
                        <button onClick={() => openConfirm(inv)} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-green-400 to-teal-500 text-white text-sm">
                          <Check className="w-4 h-4" />
                          Mark collected
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: currentTheme.textSecondary }}>
            {loading ? 'Loading...' : (invoices.length === 0 ? 'No invoices yet' : 'No invoices match your search')}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmOpen && selectedInvoice && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: currentTheme.surface }}>
            <h3 className="text-lg font-bold" style={{ color: currentTheme.text }}>Confirm status update</h3>
            <p className="text-sm mt-2" style={{ color: currentTheme.textSecondary }}>
              Mark invoice <strong>{selectedInvoice.id}</strong> of {selectedInvoice.merchant_name} for {selectedInvoice.customer_name} as collected? This action can be reverted from the database.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeConfirm} className="px-4 py-2 rounded-lg border" style={{ color: currentTheme.text, borderColor: currentTheme.primary + '20', backgroundColor: currentTheme.background }}>Cancel</button>
              <button onClick={markCollected} className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-400 to-teal-500 text-white" disabled={updating}>{updating ? 'Updating...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View invoice modal */}
      {viewInvoice && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ backgroundColor: currentTheme.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: currentTheme.text }}>Invoice {viewInvoice.id}</h3>
              <button onClick={() => setViewInvoice(null)} className="text-sm" style={{ color: currentTheme.textSecondary }}>Close</button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Merchant</p>
                <p className="font-semibold" style={{ color: currentTheme.text }}>{viewInvoice.merchant_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-semibold" style={{ color: currentTheme.text }}>{viewInvoice.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="font-semibold" style={{ color: currentTheme.text }}>{formatAmount(viewInvoice.invoice_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold" style={{ color: currentTheme.text }}>{viewInvoice.invoice_status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment reference</p>
                <p className="font-semibold" style={{ color: currentTheme.text }}>{viewInvoice.payment_reference || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="font-semibold" style={{ color: currentTheme.text }}>{viewInvoice.created_at ? new Date(viewInvoice.created_at).toLocaleString() : '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
