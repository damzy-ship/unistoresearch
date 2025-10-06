import { useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useTheme } from '../hooks/useTheme';
import { useState, useEffect } from 'react';
import { isAuthenticated } from '../hooks/useTracking';
import ConfirmContactModal from '../components/ConfirmContactModal';
// no local state needed; ContactSellerButton manages auth flow
import ContactSellerButton from '../components/ContactSellerButton';
import ContactSellerLink from '../components/ContactSellerLink';
import { Product } from '../lib/supabase';
import { useHostelMode } from '../hooks/useHostelMode';

function SearchResultsPage() {
  const location = useLocation();
  const { currentTheme } = useTheme();
  const { hostelMode } = useHostelMode();
  const { products, searchQuery } = location.state as { products: Product[], searchQuery: string };
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    const check = async () => {
      const auth = await isAuthenticated();
      setUserIsAuthenticated(auth);
      if (auth) {
        const raw = localStorage.getItem('pending_contact_product');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setPendingProduct(parsed);
            setShowConfirmModal(true);
          } catch {
            localStorage.removeItem('pending_contact_product');
          }
        }
      }
    };
    check();
    const onPending = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      setPendingProduct(detail);
      setShowConfirmModal(true);
    };
    window.addEventListener('pending-contact-available', onPending as EventListener);
    return () => window.removeEventListener('pending-contact-available', onPending as EventListener);
  }, []);

  return (
    <div className="min-h-screen p-6 sm:p-8 font-sans"
      style={{ background: currentTheme.surface }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-extrabold mb-2 tracking-tight animate-fade-in"
            style={{ color: currentTheme.primary }}>Search Results</h1>
          <p className="text-lg font-medium animate-slide-up"
            style={{ color: currentTheme.text }}>for <span style={{ color: currentTheme.text }} className="text-gray-900 font-semibold">"{searchQuery}"</span></p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.length > 0 ? (
            products.map((product, index) => (
              <div key={index}
                style={{ backgroundColor: currentTheme.background }}
                className="rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col border border-gray-200">
                <Swiper
                  modules={[Pagination, Navigation]}
                  spaceBetween={10}
                  slidesPerView={1}
                  pagination={{ clickable: true }}
                  navigation
                  className="w-full h-64"
                >
                  {product.image_urls.map((url, imgIndex) => (
                    <SwiperSlide key={imgIndex}>
                      <div className="relative w-full h-full">
                        <img src={url} alt={product.product_description} className="w-full h-full object-cover" />
                        {product.school_short_name && (
                          <div className="absolute top-2 right-2 bg-white bg-opacity-80 text-xs font-semibold px-2 py-1 rounded-md shadow">
                            {product.school_short_name}
                          </div>
                        )}
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold mb-2 truncate"
                    style={{ color: currentTheme.text }}
                  >{product.product_description}</h3>
                  {product.discount_price ? (
                    <div className="mb-2">
                      <div className="text-sm line-through"
                        style={{ color: currentTheme.text }}
                      >₦{product.product_price}</div>
                      <div
                        style={{ color: currentTheme.primary }}
                        className="text-3xl font-black">₦{product.discount_price}</div>
                    </div>
                  ) : (
                    <p
                      style={{ color: currentTheme.primary }}
                      className="text-3xl font-black mb-2">₦{product.product_price}</p>
                  )}
                  {product.full_name && (
                    <p className="text-sm mb-1"
                      style={{ color: currentTheme.text }}
                    >
                      <span className="font-semibold">by {product.full_name}</span>
                    </p>
                  )}
                  {hostelMode && (product.is_hostel_product || product.unique_visitors?.is_hostel_merchant) && (
                    <p className="text-xs mb-2"
                      style={{ color: currentTheme.text }}
                    >
                      Hostel: <span className="font-medium">{product.unique_visitors?.hostels?.name || 'Unknown Hostel'}</span>
                      {product.unique_visitors?.room ? ` • Room ${product.unique_visitors.room}` : ''}
                    </p>
                  )}
                  <p className={`text-sm font-bold mb-4 ${product.is_available ? 'text-green-500' : 'text-red-500'}`}>
                    {product.is_available ? 'In Stock' : 'Out of Stock'}
                  </p>
                  {product.phone_number && (
                    userIsAuthenticated ? (
                      <ContactSellerLink product={product} className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}>
                        Get Now
                      </ContactSellerLink>
                    ) : (
                      <ContactSellerButton product={product} className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}>
                        Get Now
                      </ContactSellerButton>
                    )
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full mt-8 text-xl">No results found. Try a different query.</p>
          )}
        </div>
      </div>

      {/* Phone Authentication now handled inside ContactSellerButton */}
      <ConfirmContactModal
        isOpen={showConfirmModal}
        product={pendingProduct || undefined}
        onClose={() => { setShowConfirmModal(false); setPendingProduct(null); localStorage.removeItem('pending_contact_product'); }}
        onConfirm={() => { setShowConfirmModal(false); setPendingProduct(null); localStorage.removeItem('pending_contact_product'); }}
      />
    </div>
  );
}

export default SearchResultsPage;