import { useEffect, useState } from 'react';
import { Search, Eye, Link, Share2, Clipboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, UniqueVisitor } from '../lib/supabase';
import MerchantProductModal from '../components/MerchantProductModal';

export default function PublicMerchantsPage() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<UniqueVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<UniqueVisitor | null>(null);

  useEffect(() => {
    const fetchMerchants = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('unique_visitors')
          .select('*')
          .eq('user_type', 'merchant')
          .order('full_name', { ascending: true });

        if (error) {
          console.error('Error fetching merchants:', error);
          setMerchants([]);
        } else {
          setMerchants((data || []) as UniqueVisitor[]);
        }
      } catch (err) {
        console.error('Unexpected error fetching merchants:', err);
        setMerchants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  const filtered = merchants.filter(m => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (m.full_name || '').toLowerCase().includes(q) ||
      (m.user_id || '').toLowerCase().includes(q) ||
      (m.phone_number || '').toLowerCase().includes(q)
    );
  });

  const handleViewProducts = (merchant: UniqueVisitor) => {
    navigate(`/merchant/${merchant.user_id}/${encodeURIComponent(merchant.full_name || 'Merchant')}`);
  };

  const handleCopyLink = (merchant: UniqueVisitor) => {
    const baseUrl = window.location.origin;
    const merchantLink = `${baseUrl}/merchant/${merchant.user_id}/${encodeURIComponent(merchant.full_name || 'Merchant')}`;
    navigator.clipboard.writeText(merchantLink).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please try again.');
    });
  };

  const handleShareOnWhatsApp = (merchant: UniqueVisitor) => {
    const baseUrl = window.location.origin;
    const merchantLink = `${baseUrl}/merchant/${merchant.user_id}/${encodeURIComponent(merchant.full_name || 'Merchant')}`;
    const message = `Manage your products at: ${merchantLink}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${merchant.phone_number}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMerchant(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold"
              >
                <span className="text-orange-500">uni</span>
                <span className="text-blue-800">store.</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Merchants</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search merchants by name, phone number, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="text-sm text-gray-600 mt-2">Showing {filtered.length} of {merchants.length} merchants</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{m.full_name || <span className="text-gray-400">Not provided</span>}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">{m.phone_number || <span className="text-gray-400">Not provided</span>}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900">{m.user_id}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewProducts(m)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                            title="View Products"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <button
                            onClick={() => handleCopyLink(m)}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Copy Link"
                          >
                            <Clipboard className="w-4 h-4" /> Copy
                          </button>
                          <button
                            onClick={() => handleShareOnWhatsApp(m)}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-4 h-4" /> Share
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">{merchants.length === 0 ? 'No merchants yet' : 'No merchants match your current search'}</div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedMerchant && (
        <MerchantProductModal
          merchantId={selectedMerchant.user_id}
          merchantName={selectedMerchant.full_name || 'Merchant'}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}