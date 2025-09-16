import { useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useTheme } from '../hooks/useTheme';
import AuthModal from '../components/AuthModal';
import { useState } from 'react';
import { isAuthenticated } from '../hooks/useTracking';

interface Product {
  product_description: string;
  product_price: string;
  is_available: boolean;
  image_urls: string[];
  merchant_id: string;
  full_name: string;
  phone_number: string;
  school_id: string;
  school_name: string;
  school_short_name: string;
  similarity: number;
}

function SearchResultsPage() {
  const location = useLocation();
  const { currentTheme } = useTheme();
  const { products, searchQuery } = location.state as { products: Product[], searchQuery: string };
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingContactProduct, setPendingContactProduct] = useState<Product | null>(null);

  // const getWhatsappLink = (phoneNumber: string | undefined): string => {
  //   if (!phoneNumber) return '#';
  //   const cleanNumber = phoneNumber.replace(/\s/g, '');
  //   return `https://wa.me/${cleanNumber}`;
  // };

  const handleContactSeller = async (product: Product) => {
    // Check if user is already authenticated
    const userAuthenticated = await isAuthenticated();
    if (!userAuthenticated) {
      setPendingContactProduct(product);
      setShowAuthModal(true);
      return;
    }

    // Proceed with contact
    contactSeller(product);
  };

  const contactSeller = async (product: Product) => {
    // Track the contact interaction for rating prompts
    // await trackContactInteraction(product.merchant_id, requestId);

    const message = `Hi! I'm looking for the following from ${product.school_short_name} University: ${searchQuery}`;
    const whatsappUrl = `https://wa.me/${product.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleAuthSuccess = () => {

    if (pendingContactProduct) {
      contactSeller(pendingContactProduct);
      setPendingContactProduct(null);
    }
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    setPendingContactProduct(null);
  };

  return (
    <div className="min-h-screen p-6 sm:p-8 font-sans"
      style={{ background: currentTheme.background }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-extrabold mb-2 tracking-tight animate-fade-in"
            style={{ color: currentTheme.text }}>Search Results</h1>
          <p className="text-lg font-medium animate-slide-up"
            style={{ color: currentTheme.text }}>for <span style={{ color: currentTheme.text }} className="text-gray-900 font-semibold">"{searchQuery}"</span></p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.length > 0 ? (
            products.map((product, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col border border-gray-200">
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
                      <img src={url} alt={product.product_description} className="w-full h-full object-cover" />
                    </SwiperSlide>
                  ))}
                </Swiper>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className={`text-xl font-bold mb-2 truncate text-${currentTheme.primaryTsFormat}`}>{product.product_description}</h3>
                  <p className="text-3xl text-green-600 font-black mb-2">₦{product.product_price}</p>
                  {product.full_name && (
                    <p className="text-sm text-gray-500 mb-2">
                      <span className="font-semibold text-gray-700">{product.full_name}</span>
                    </p>
                  )}
                  <p className={`text-sm font-bold mb-4 ${product.is_available ? 'text-green-500' : 'text-red-500'}`}>
                    {product.is_available ? 'In Stock' : 'Out of Stock'}
                  </p>
                  {product.phone_number && (
                    <button
                      onClick={() => handleContactSeller(product)}
                      className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}
                    >
                      Get Now
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full mt-8 text-xl">No results found. Try a different query.</p>
          )}
        </div>
      </div>

      {/* Phone Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default SearchResultsPage;