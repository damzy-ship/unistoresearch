import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InvoiceModal from '../components/InvoiceModal';
import { supabase } from '../lib/supabase';
import { InvoiceData } from './InvoicesPage';

export default function ViewInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    const load = async () => {
      const { data, error } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
      if (error) {
        console.error('Failed to load invoice', error);
        navigate('/invoices');
        return;
      }
      setInvoice(data as InvoiceData);
    };
    load();
  }, [invoiceId, navigate]);

  return (
    <div>
      <InvoiceModal invoice={invoice} onClose={() => navigate('/invoices')} />
    </div>
  );
}
