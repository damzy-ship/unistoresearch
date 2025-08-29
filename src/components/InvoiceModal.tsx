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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-45">
      <div className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300">
        <div ref={ref} className="p-8 bg-white font-sans">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="text-3xl font-extrabold tracking-tight">
              <span className="text-orange-600">uni</span>
              <span className="text-blue-600">store.</span>
            </h3>
            <div className="text-sm font-medium mt-4">
              <span className="inline-block rounded-full text-blue-600 font-semibold uppercase text-xs tracking-wider">
                Invoice
              </span>
            </div>
          </div>

          <div className="flex justify-end text-sm text-gray-500 font-medium">
            <p>August 29, 2025</p>
          </div>

          {/* Details Section */}
          <div className="mb-8">
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>Merchant Details
              </p>
              <p className="font-bold text-gray-800 text-lg">{invoice.merchant_name}</p>
              <p className="text-sm text-gray-600 mt-1">{invoice.merchant_number}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Customer Details
              </p>
              <p className="font-bold text-gray-800 text-lg">{invoice.customer_name}</p>
              <p className="text-sm text-gray-600 mt-1">{invoice.customer_number}</p>
            </div>
          </div>

          {/* Amount and Status Section */}
          <div className="mt-6 p-6 bg-white rounded-xl shadow-md">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Total Amount
                </p>
                <p className="text-4xl font-extrabold mt-2 text-gray-900">₦{Number(invoice.invoice_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-end">
                  Status<span className="w-2 h-2 rounded-full bg-blue-500 ml-2"></span>
                </p>
                <p className="mt-4 font-bold text-lg inline-block text-orange-600">
                  {invoice.invoice_status}
                </p>
              </div>
            </div>
          </div>

          {/* Reference ID Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
            <p className="text-sm text-gray-400 uppercase font-semibold mr-2">Reference ID</p>
            <p className="font-mono text-sm text-gray-600 break-all">{invoice.id}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 p-4 bg-white">
          <button
            onClick={downloadPNG}
            className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download PNG
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}