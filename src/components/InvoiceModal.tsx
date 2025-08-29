import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { InvoiceData } from '../pages/InvoicesPage';

interface Props {
  invoice: InvoiceData | null;
  onClose: () => void;
}

export default function InvoiceModal({ invoice, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  if (!invoice) return null;

  const downloadPNG = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `invoice-${invoice.id || invoice.created_at || 'invoice'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
        <div ref={ref} className="p-8 bg-white font-sans">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
            <h3 className="text-3xl font-extrabold tracking-wide">
              <span className="text-orange-500">uni</span>
              <span className="text-blue-500">store.</span>
            </h3>
            <div className="text-sm text-gray-500 font-medium">
              <p className="text-right">Invoice</p>
              <p className="text-right">{new Date(invoice.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Merchant</p>
              <p className="font-bold text-gray-800">{invoice.merchant_name}</p>
              <p className="text-sm text-gray-600">{invoice.merchant_number}</p>
            </div>
            <div className="md:text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
              <p className="font-bold text-gray-800">{invoice.customer_name}</p>
              <p className="text-sm text-gray-600">{invoice.customer_number}</p>
            </div>
          </div>

          {/* Amount and Status Section */}
          <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Amount</p>
                <p className="text-4xl font-extrabold mt-1 text-gray-900">₦{Number(invoice.invoice_amount).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                <p className={`mt-1 font-bold text-lg ${invoice.invoice_status === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>
                  {invoice.invoice_status}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500 text-center">Ref: <span className="font-mono text-gray-600">{invoice.id}</span></p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={downloadPNG}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-colors"
          >
            Download PNG
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}