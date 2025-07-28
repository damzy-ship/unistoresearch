import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Navigation, Pagination } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Eye, Clock, MapPin, Tag, Play, MessageCircle, Phone, Share2, X, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { getActiveRealTimeProducts, trackRealTimeProductView, formatRelativeTime, getTimeRemaining, trackRealTimeProductContact } from '../../lib/realTimeService';
import { RealTimeProduct } from '../../lib/realTimeService';
import ProductGallery from './ProductGallery';
import ReactionsBar from './ReactionsBar';
import CommentsSection from './CommentsSection';

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
  const [selectedProduct, setSelectedProduct] = useState<RealTimeProduct | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<RealTimeProduct | null>(null);
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

  const handleShare = async (product: RealTimeProduct) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: product.description || `Check out this product: ${product.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const handleSlideChange = (swiper: any) => {
    // Optional: Track slide changes
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Just In</h3>
            <p className="text-sm text-gray-600">Latest real-time products from your campus</p>
          </div>
          <button
            onClick={() => window.location.href = '/real-time'}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-sm font-medium shadow-lg"
          >
            View All
          </button>
        </div>

        <Swiper
          ref={swiperRef}
          modules={[Virtual, Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={1}
          centeredSlides={true}
          loop={true}
          virtual={true}
          onSlideChange={handleSlideChange}
          className="h-80"
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
              centeredSlides: false,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 24,
              centeredSlides: false,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 24,
              centeredSlides: false,
            },
          }}
        >
          {products.map((product, index) => (
            <SwiperSlide key={product.id} virtualIndex={index}>
              <div 
                className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 w-full max-w-sm mx-auto group"
                onClick={() => handleProductClick(product)}
              >
                {/* Media Container */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {product.media_type === 'video' ? (
                    <div className="relative w-full h-full">
                      <img
                        src={product.media_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-2">
                          <Play className="w-6 h-6 text-gray-800 fill-current" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={product.media_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Dark Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Product Title and Price Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 leading-tight">
                      {product.title}
                    </h3>
                    {product.price && (
                      <div className="text-2xl font-bold text-orange-400 mb-2">
                        ₦{product.price.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Time Remaining Badge */}
                  {(() => {
                    const timeRemaining = getTimeRemaining(product.expires_at);
                    if (timeRemaining.isExpired) {
                      return (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Expired</span>
                        </div>
                      );
                    }
                    return (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {timeRemaining.hours}h {timeRemaining.minutes}m
                        </span>
                      </div>
                    );
                  })()}

                  {/* Featured Badge */}
                  {product.is_featured && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      ⭐ Featured
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Location */}
                  {product.location && (
                    <div className="flex items-center space-x-1 text-gray-500 text-sm mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{product.location}</span>
                    </div>
                  )}

                  {/* Category */}
                  {product.category && (
                    <div className="inline-block bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full mb-3 font-medium">
                      {product.category}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{product.views_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{product.contact_clicks}</span>
                      </div>
                    </div>
                    
                    {/* Time Posted */}
                    <div className="text-xs text-gray-400">
                      {formatRelativeTime(product.created_at)}
                    </div>
                  </div>

                  {/* Merchant Info */}
                  {product.merchant && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {product.merchant.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {product.merchant.full_name}
                          </p>
                          {product.merchant.average_rating && (
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-500 text-xs">★</span>
                              <span className="text-xs text-gray-500">
                                {product.merchant.average_rating.toFixed(1)} ({product.merchant.total_ratings})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reaction Counts */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="text-red-500">❤️</span>
                      <span>{product.reactions_count || 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-blue-500">💬</span>
                      <span>{product.comments_count || 0}</span>
                    </span>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white bg-opacity-90 rounded-full p-3">
                    <Play className="w-6 h-6 text-gray-800" />
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons - REMOVED */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div 
            className="fixed inset-0 z-0"
            style={{
              backgroundImage: `url(${detailsProduct.media_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px) brightness(0.3)',
            }}
          />
          
          {/* Full Screen Content */}
          <div className="relative w-full h-full bg-black/40 backdrop-blur-sm z-10 overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors border border-white/30"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="min-h-full flex flex-col justify-end p-2">
              <div className="w-full max-w-2xl mx-auto">
                {/* Product Card with Image and Details Together */}
                <div className="bg-white/15 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/30 shadow-2xl">
                  {/* Product Image */}
                  <div className="relative h-80">
                    {detailsProduct.media_type === 'video' ? (
                      <video
                        src={detailsProduct.media_url}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        muted
                      />
                    ) : (
                      <img
                        src={detailsProduct.media_url}
                        alt={detailsProduct.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>

                  {/* Product Details - Enhanced Glassmorphism */}
                  <div className="p-2 bg-white/10 backdrop-blur-xl">
                    <h1 className="text-white text-2xl font-bold mb-3">{detailsProduct.title}</h1>
                    
                    {detailsProduct.description && (
                      <p className="text-white/90 mb-4 leading-relaxed">{detailsProduct.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-bold text-orange-400">
                        ₦{detailsProduct.price?.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 text-white/80">
                        <MapPin className="w-4 h-4" />
                        <span>{detailsProduct.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-white/80">
                        <Tag className="w-4 h-4" />
                        <span>{detailsProduct.category}</span>
                      </div>
                      <div className="text-white/80">
                        {(() => {
                          const timeRemaining = getTimeRemaining(detailsProduct.expires_at);
                          if (timeRemaining.isExpired) {
                            return 'Expired';
                          }
                          return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
                        })()}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1 text-white/80">
                        <Eye className="w-4 h-4" />
                        <span>{detailsProduct.views_count} views</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/80">
                        <Clock className="w-4 h-4" />
                        <span>{formatRelativeTime(detailsProduct.created_at)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-6">
                      <button
                        onClick={() => handleContact(detailsProduct, 'whatsapp')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/90 backdrop-blur-md text-white rounded-xl hover:bg-green-600 transition-colors font-medium border border-white/20"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleContact(detailsProduct, 'call')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500/90 backdrop-blur-md text-white rounded-xl hover:bg-blue-600 transition-colors font-medium border border-white/20"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </button>
                    </div>

                    {/* Reactions */}
                    <div className="mb-6">
                      <ReactionsBar 
                        product={detailsProduct}
                        onReactionChange={() => {
                          // Refresh product data if needed
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <h3 className="text-white font-bold text-lg mb-4">Comments</h3>
                  <CommentsSection 
                    productId={detailsProduct.id}
                    onCommentChange={() => {
                      // Refresh product data if needed
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 