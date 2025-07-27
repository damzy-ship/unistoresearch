import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Navigation, Pagination } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Eye, Clock, MapPin, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { getActiveRealTimeProducts, trackRealTimeProductView, formatRelativeTime, getTimeRemaining } from '../../lib/realTimeService';
import { RealTimeProduct } from '../../lib/realTimeService';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/virtual';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface RealTimeSwiperProps {
  className?: string;
  onProductClick?: (product: RealTimeProduct) => void;
}

export default function RealTimeSwiper({ className = '', onProductClick }: RealTimeSwiperProps) {
  const [products, setProducts] = useState<RealTimeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result = await getActiveRealTimeProducts();
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (result.data) {
        // Only show first 4 products for the "Just In" section
        setProducts(result.data.slice(0, 4));
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError('Failed to load real-time products');
      console.error('Error fetching real-time products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product: RealTimeProduct) => {
    try {
      // Track the view
      await trackRealTimeProductView(product.id);
      
      // Call the parent handler if provided
      if (onProductClick) {
        onProductClick(product);
      }
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  const handleSlideChange = (swiper: any) => {
    // If we're approaching the end, we could fetch more products
    // For now, we'll just loop through the existing products
    if (swiper.isEnd && products.length > 0) {
      // Reset to beginning for infinite loop effect
      setTimeout(() => {
        swiper.slideTo(0, 0, false);
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="text-center">
          <p className="text-gray-500 mb-2">{error}</p>
          <button 
            onClick={fetchProducts}
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
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="text-center">
          <p className="text-gray-500 mb-2">No real-time products available</p>
          <p className="text-sm text-gray-400">Check back later for new items!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {/* Navigation Buttons */}
      <button
        onClick={() => swiperRef.current?.slidePrev()}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
      >
        <ChevronLeft className="w-4 h-4 text-gray-700" />
      </button>
      
      <button
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
      >
        <ChevronRight className="w-4 h-4 text-gray-700" />
      </button>

      <Swiper
        ref={swiperRef}
        modules={[Virtual, Navigation, Pagination]}
        spaceBetween={16}
        slidesPerView={1}
        centeredSlides={true}
        loop={true}
        loopedSlides={products.length}
        virtual={true}
        onSlideChange={handleSlideChange}
        className="h-80"
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 24,
          },
        }}
      >
        {products.map((product, index) => (
          <SwiperSlide key={product.id} virtualIndex={index}>
            <div 
              className="relative h-full bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => handleProductClick(product)}
            >
              {/* Media */}
              <div className="relative h-48 overflow-hidden">
                {product.media_type === 'video' ? (
                  <video
                    src={product.media_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                ) : (
                  <img
                    src={product.media_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                {/* Stats */}
                <div className="absolute top-3 right-3 flex items-center gap-2 text-white text-xs">
                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Eye className="w-3 h-3" />
                    <span>{product.views_count}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(product.expires_at)}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                  {product.title}
                </h3>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-orange-600">
                    ₦{product.price?.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{product.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Tag className="w-3 h-3" />
                    <span>{product.category}</span>
                  </div>
                  <div className="text-xs text-red-500 font-medium">
                    {getTimeRemaining(product.expires_at)}
                  </div>
                </div>

                {/* Reaction Counts */}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>❤️ {product.reactions_count || 0}</span>
                  <span>💬 {product.comments_count || 0}</span>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Pagination Dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => swiperRef.current?.slideTo(index)}
            className="w-2 h-2 rounded-full bg-gray-300 hover:bg-orange-500 transition-colors duration-200"
          />
        ))}
      </div>
    </div>
  );
} 