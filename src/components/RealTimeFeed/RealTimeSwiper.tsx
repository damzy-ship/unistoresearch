import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Clock, MapPin, MessageCircle, Phone, X } from 'lucide-react';
import { toast } from 'sonner'; // Keep toast for now, might be used elsewhere
import { getActiveRealTimeProducts, trackRealTimeProductView, formatRelativeTime, getTimeRemaining, trackRealTimeProductContact } from '../../lib/realTimeService';
import { RealTimeProduct } from '../../lib/realTimeService';
import ProductGallery from './ProductGallery';
// import ReactionsBar from './ReactionsBar';
// import CommentsSection from './CommentsSection';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/virtual';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

interface RealTimeSwiperProps {
  className?: string;
}

export default function RealTimeSwiper({ className = '' }: RealTimeSwiperProps) {
  const [products, setProducts] = useState<RealTimeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<RealTimeProduct | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<RealTimeProduct | null>(null);

  useEffect(() => {
    fetchProducts();
    
    // Set up realtime polling every 10 seconds
    const interval = setInterval(() => {
      fetchProducts(true); // Pass true for background updates
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async (isBackgroundUpdate = false) => {
    try {
      // Only show loading on initial load, not on background updates
      if (!isBackgroundUpdate) {
        setLoading(true);
      }
      const result = await getActiveRealTimeProducts(50); // Get all products
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (result.data) {
        // If this is a background update and we have existing products,
        // only add new products without disrupting current view
        if (isBackgroundUpdate && products.length > 0) {
          const existingIds = new Set(products.map(p => p.id));
          const newProducts = result.data.filter(p => !existingIds.has(p.id));
          
          if (newProducts.length > 0) {
            // Add new products to the beginning without changing current view
            setProducts(prev => [...newProducts, ...prev]);
          }
        } else {
          // Initial load or no existing products
          setProducts(result.data);
        }
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError('Failed to load real-time products');
      console.error('Error fetching real-time products:', err);
    } finally {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    }
  };

  const handleProductClick = async (product: RealTimeProduct) => {
    try {
      await trackRealTimeProductView(product.id);
      setDetailsProduct(product);
      setShowDetails(true);
    } catch (error) {
      console.error('Error tracking product view:', error);
      setDetailsProduct(product);
      setShowDetails(true);
    }
  };

  const handleContact = async (product: RealTimeProduct, method: 'whatsapp' | 'call' | 'message') => {
    try {
      await trackRealTimeProductContact(product.id, method);
      
      if (method === 'whatsapp') {
        const message = `Hi! I'm interested in your product: ${product.title}`;
        const phoneNumber = product.contact_phone?.replace('+', '') || product.merchant?.phone_number?.replace('+', '') || '2349060859789';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } else if (method === 'call') {
        const phoneNumber = product.contact_phone || product.merchant?.phone_number || '+2349060859789';
        window.open(`tel:${phoneNumber}`, '_blank');
      }
      
      toast.success(`Contacted seller via ${method}`);
    } catch (error) {
      console.error('Error contacting seller:', error);
      toast.error('Failed to contact seller');
    }
  };

  const handleSlideChange = (swiper: { realIndex: number }) => {
    const activeIndex = swiper.realIndex;
    const activeProduct = products[activeIndex];
    
    if (activeProduct) {
      // Auto-play video if it's a video product
      if (activeProduct.media_type === 'video') {
        setTimeout(() => {
          const videoElement = document.querySelector(`[data-video-id="${activeProduct.id}"]`) as HTMLVideoElement;
          if (videoElement) {
            videoElement.play().catch(() => {
              // Ignore autoplay errors
            });
          }
        }, 500); // Small delay to ensure video is loaded
      }
    }
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center h-80`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center h-80`}>
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={() => fetchProducts()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center h-80`}>
        <div className="text-center">
          <p className="text-gray-500 mb-2">No real-time products available</p>
          <p className="text-sm text-gray-400">Check back later for new products</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${className} relative`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-orange-500 mb-1">Just In</h3>
            <p className="text-sm text-gray-500">Latest real-time products from your campus</p>
          </div>
          <button
            onClick={() => window.location.href = '/real-time'}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-sm font-medium shadow-lg"
          >
            View All
          </button>
        </div>

        <Swiper
          modules={[Virtual, Navigation, Pagination, Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          centeredSlides={true}
          loop={true}
          virtual={true}
          autoplay={{
            delay: 8000, // 8 seconds to read
            disableOnInteraction: false,
          }}
          onSlideChange={handleSlideChange}
          className="h-[500px]"
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
            el: '.swiper-pagination-outside',
          }}
          breakpoints={{
            640: {
              slidesPerView: 1,
              spaceBetween: 20,
              centeredSlides: true,
            },
            768: {
              slidesPerView: 1,
              spaceBetween: 24,
              centeredSlides: true,
            },
            1024: {
              slidesPerView: 1,
              spaceBetween: 24,
              centeredSlides: true,
            },
          }}
        >
          {products.map((product, index) => (
            <SwiperSlide key={product.id} virtualIndex={index}>
              <div 
                className={`relative ${product.is_text_post ? '' : 'bord bg'} rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 w-full max-w-sm mx-auto group h-full`}
                onClick={() => handleProductClick(product)}
              >
                {/* Media Container */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                  {product.is_text_post ? (
                    // Text Post - Full colored background
                    <div 
                      className="w-full h-full flex items-center justify-center p-4"
                      style={{ backgroundColor: product.text_color || '#FF6B35' }}
                    >
                      <div className="text-center text-white w-full h-full flex items-center justify-center">
                        <h3 className={`font-bold text-lg ${
                          product.title.length > 50 ? 'text-left' : 'text-center'
                        }`}>
                          {product.title}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    // Image/Video Post with Text Overlay
                    <>
                      {product.media_type === 'video' ? (
                        <video
                          src={product.media_url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                          data-video-id={product.id}
                        />
                      ) : (
                        <img
                          src={product.media_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Text Overlay with White Background */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 rounded-b-2xl">
                        {/* Dark overlay for better text visibility */}
                        <div className="absolute inset-0 bg rounded-b-2xl"></div>
                        
                        {/* Text content */}
                        <div className="relative z-10">
                          <h3 className="font-bold text-white text-lg mb-3">
                            {product.title}
                          </h3>
                          
                          {product.price && product.price > 0 && (
                            <p className="text-orange-500 font-bold text-xl mb-3">
                              ₦{product.price.toLocaleString()}
                            </p>
                          )}
                          
                          {product.description && product.description.trim() && (
                            <p className="text-gray-200 text-sm mb-3">
                              {product.description}
                            </p>
                          )}
                          
                          {/* Location and Category */}
                          <div className="flex items-center gap-3 text-sm text-gray-200">
                            {product.location && product.location.trim() && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{product.location}</span>
                              </div>
                            )}
                            
                            {product.category && product.category.trim() && (
                              <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                                {product.category}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Time Remaining Badge */}
                      {!getTimeRemaining(product.expires_at).isExpired && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeRemaining(product.expires_at).hours}h {getTimeRemaining(product.expires_at).minutes}m</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      {product.category && product.category.trim() && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">``
                          {product.category}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Time Posted for Text Posts */}
                {product.is_text_post && (
                  <div className="p-4">
                    <div className="text-xs text-gray-400 text-right">
                      {formatRelativeTime(product.created_at)}
                    </div>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Pagination Indicators - Completely Outside */}
        <div className="swiper-pagination-outside flex justify-center mt-6 space-x-2"></div>
      </div>

      {/* Product Gallery Modal */}
      {selectedProduct && (
        <ProductGallery
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Full Screen Details Modal */}
      {showDetails && detailsProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 z-20 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="relative">
              {/* Media Container */}
              <div className="relative aspect-[4/5] overflow-hidden">
                {detailsProduct.is_text_post ? (
                  // Text Post - Full colored background
                  <div 
                    className="w-full h-full flex items-center justify-center p-8"
                    style={{ backgroundColor: detailsProduct.text_color || '#FF6B35' }}
                  >
                    <div className="text-center text-white w-full h-full flex items-center justify-center">
                      <h1 className={`text-4xl font-bold ${
                        detailsProduct.title.length > 50 ? 'text-left' : 'text-center'
                      }`}>
                        {detailsProduct.title}
                      </h1>
                    </div>
                  </div>
                ) : (
                  // Image/Video Post with Text Overlay
                  <>
                    {detailsProduct.media_type === 'video' ? (
                      <video
                        src={detailsProduct.media_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                      />
                    ) : (
                      <img
                        src={detailsProduct.media_url}
                        alt={detailsProduct.title}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Text Overlay with White Background */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 rounded-b-3xl">
                      {/* Dark overlay for better text visibility */}
                      {/* <div className="absolute inset-0 bg-black bg-opacity-20 rounded-b-3xl"></div> */}
                      
                      {/* Text content */}
                      <div className="relative z-10">
                        <h1 className="font-bold text-white text-2xl mb-3">
                          {detailsProduct.title}
                        </h1>
                        
                        {detailsProduct.price && detailsProduct.price > 0 && (
                          <p className="text-orange-400 font-bold text-3xl mb-3">
                            ₦{detailsProduct.price.toLocaleString()}
                          </p>
                        )}
                        
                        {detailsProduct.description && detailsProduct.description.trim() && (
                          <p className="text-white text-lg mb-4">
                            {detailsProduct.description}
                          </p>
                        )}
                        
                        {/* Location and Category */}
                        <div className="flex items-center gap-4 text-base text-white mb-4">
                          {detailsProduct.location && detailsProduct.location.trim() && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5" />
                              <span>{detailsProduct.location}</span>
                            </div>
                          )}
                          
                          {detailsProduct.category && detailsProduct.category.trim() && (
                            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              {detailsProduct.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time Remaining Badge */}
                    {!getTimeRemaining(detailsProduct.expires_at).isExpired && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeRemaining(detailsProduct.expires_at).hours}h {getTimeRemaining(detailsProduct.expires_at).minutes}m</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Contact Buttons */}
              <div className="p-6 bg-white">
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => handleContact(detailsProduct, 'whatsapp')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleContact(detailsProduct, 'call')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </button>
                </div>

                {/* Time Posted */}
                <div className="text-sm text-gray-500 text-center">
                  Posted {formatRelativeTime(detailsProduct.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 