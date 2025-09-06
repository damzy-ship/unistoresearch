import { useEffect, useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, UniqueVisitor } from '../lib/supabase';
import MerchantProductModal from '../components/MerchantProductModal';
// import { generateProductEmbeddings } from '../lib/generateEmbedding';
// import ProductSearchComponent from '../components/ProductSearchComponent';


export default function PublicMerchantsPage() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<UniqueVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // 👈 State for the modal
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

  // 👈 New function to handle row clicks
  const handleViewProducts = (merchant: UniqueVisitor) => {
    setSelectedMerchant(merchant);
    setIsModalOpen(true);
  };

  // 👈 New function to close the modal
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

      {/* <button onClick={generateProductEmbeddings}>
        <h1>Populate</h1>
      </button>

      <ProductSearchComponent /> */}

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
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((m) => (
                    // 👈 Add onClick handler to the entire row
                    <tr 
                      key={m.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewProducts(m)}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{m.full_name || <span className="text-gray-400">Not provided</span>}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">{m.phone_number || <span className="text-gray-400">Not provided</span>}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                        {/* The button below is now redundant since the entire row is clickable. 
                          You can remove this block if you only want to use the row click. 
                          If you want both, remove the onClick from the <tr> and keep the button.
                        */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                                // 👈 Stop event propagation to prevent the row's onClick from firing
                                e.stopPropagation(); 
                                navigate(`/seller/${m.user_id}`);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900">{m.user_id}</td>
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

      {/* 👈 Conditionally render the modal */}
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