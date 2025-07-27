import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Clock, MapPin, Tag, MessageCircle, Phone, Share2, Heart, Play, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { getActiveRealTimeProducts, trackRealTimeProductView, trackRealTimeProductContact, formatRelativeTime, getTimeRemaining } from '../../lib/realTimeService';
import { RealTimeProduct } from '../../lib/realTimeService';
import ReactionsBar from './ReactionsBar';
import CommentsSection from './CommentsSection';

interface RealTimeInfiniteScrollProps {
  className?: string;
  onClose?: () => void;
}

export default function RealTimeInfiniteScroll({ className = '', onClose }: RealTimeInfiniteScrollProps) {
  const [products, setProducts] = useState<RealTimeProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
        setProducts(result.data);
        setHasMore(result.data.length > 0);
      } else {
        setProducts([]);
        setHasMore(false);
      }
    } catch (err) {
      setError('Failed to load real-time products');
      console.error('Error fetching real-time products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductView = async (product: RealTimeProduct) => {
    try {
      await trackRealTimeProductView(product.id);
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  const handleContact = async (product: RealTimeProduct, method: 'whatsapp' | 'call' | 'message') => {
    try {
      await trackRealTimeProductContact(product.id, method);
      
      switch (method) {
        case 'whatsapp':
          window.open(`https://wa.me/${product.contact_phone?.replace('+', '')}?text=Hi! I'm interested in your ${product.title}`, '_blank');
          break;
        case 'call':
          window.open(`tel:${product.contact_phone}`, '_blank');
          break;
        case 'message':
          toast.success('Contact information copied to clipboard');
          navigator.clipboard.writeText(product.contact_phone || '');
          break;
      }
    } catch (error) {
      console.error('Error tracking contact:', error);
      toast.error('Failed to track contact');
    }
  };

  const handleShare = async (product: RealTimeProduct) => {
    try {
      const shareData = {
        title: product.title,
        text: `Check out this ${product.title} on UniStore!`,
        url: `${window.location.origin}/real-time/${product.id}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const scrollToProduct = (index: number) => {
    if (containerRef.current) {
      const productElement = containerRef.current.children[index] as HTMLElement;
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setCurrentIndex(index);
        handleProductView(products[index]);
      }
    }
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.top + childRect.height / 2;
      const distance = Math.abs(containerCenter - childCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== currentIndex) {
      setCurrentIndex(closestIndex);
      if (products[closestIndex]) {
        handleProductView(products[closestIndex]);
      }
    }
  }, [currentIndex, products]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center h-screen`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center h-screen`}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={fetchProducts}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center h-screen`}>
        <div className="text-center">
          <p className="text-gray-500 mb-2">No real-time products available</p>
          <p className="text-sm text-gray-400">Check back later for new items!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative h-screen overflow-hidden bg-black`}>
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-50 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          ✕
        </button>
      )}

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 h-1 bg-gray-800">
        <div 
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}
        />
      </div>

      {/* Main Scroll Container */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="relative h-screen snap-start flex items-center justify-center"
            style={{ scrollSnapAlign: 'center' }}
          >
            {/* Product Card */}
            <div className="relative w-full max-w-sm mx-auto h-5/6 bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* Media Container */}
              <div className="relative h-3/4 overflow-hidden">
                {product.media_type === 'video' ? (
                  <video
                    src={product.media_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    autoPlay={index === currentIndex}
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

                {/* Play Button for Videos */}
                {product.media_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Stats */}
                <div className="absolute top-4 right-4 flex items-center gap-2 text-white text-sm">
                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Eye className="w-4 h-4" />
                    <span>{product.views_count}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" />
                    <span>{formatRelativeTime(product.expires_at)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-3">
                  <button
                    onClick={() => handleContact(product, 'whatsapp')}
                    className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleContact(product, 'call')}
                    className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleShare(product)}
                    className="w-12 h-12 bg-gray-800/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors shadow-lg"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2">
                  {product.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-orange-600">
                    ₦{product.price?.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{product.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Tag className="w-4 h-4" />
                    <span>{product.category}</span>
                  </div>
                  <div className="text-sm text-red-500 font-medium">
                    {getTimeRemaining(product.expires_at)}
                  </div>
                </div>

                {/* Reactions Bar */}
                <div className="mb-4">
                  <ReactionsBar 
                    product={product}
                    onReactionChange={() => {
                      // Refresh product data if needed
                    }}
                  />
                </div>

                {/* Comments Toggle */}
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{product.comments_count || 0} comments</span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${showComments ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* Comments Section */}
                {showComments && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <CommentsSection 
                      productId={product.id}
                      onCommentChange={() => {
                        // Refresh product data if needed
                      }}
                    />
                  </div>
                )}
              </div>


            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {products.map((_, dotIndex) => (
                <button
                  key={dotIndex}
                  onClick={() => scrollToProduct(dotIndex)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    dotIndex === currentIndex 
                      ? 'bg-orange-500 w-6' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => scrollToProduct(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      
      <button
        onClick={() => scrollToProduct(Math.min(products.length - 1, currentIndex + 1))}
        disabled={currentIndex === products.length - 1}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
} 