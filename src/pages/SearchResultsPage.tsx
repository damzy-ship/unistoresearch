import { useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Product {
  product_description: string;
  product_price: string;
  is_available: boolean;
  image_urls: string[];
  full_name: string;
  phone_number: string;
}

function SearchResultsPage() {
  const location = useLocation();
  const { products, searchQuery } = location.state as { products: Product[], searchQuery: string };

  const getWhatsappLink = (phoneNumber: string | undefined): string => {
    if (!phoneNumber) return '#';
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight animate-fade-in">Search Results</h1>
          <p className="text-lg text-gray-600 font-medium animate-slide-up">for <span className="text-gray-900 font-semibold">"{searchQuery}"</span></p>
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
                  <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{product.product_description}</h3>
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
                    <a
                      href={getWhatsappLink(product.phone_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center justify-center bg-green-500 text-white font-bold py-3 px-4 rounded-full hover:bg-green-600 transition-colors duration-300 shadow-md hover:shadow-lg"
                    >
                      Get Now
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full mt-8 text-xl">No results found. Try a different query.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchResultsPage;