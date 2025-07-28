import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Clock, MapPin, Tag, MessageCircle, Phone, Share2, Heart, Play, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { getActiveRealTimeProducts, trackRealTimeProductView, trackRealTimeProductContact, formatRelativeTime, getTimeRemaining } from '../../lib/realTimeService';
import { RealTimeProduct } from '../../lib/realTimeService';
import ReactionsBar from './ReactionsBar';
import CommentsSection from './CommentsSection';
import ProductGallery from './ProductGallery';

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
  const [selectedProduct, setSelectedProduct] = useState<RealTimeProduct | null>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const [showDetails, setShowDetails] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<RealTimeProduct | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTapRef = useRef<number>(0);

  // Create infinite loop by duplicating products
  const infiniteProducts = [...products, ...products, ...products];

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

  const handleDoubleTap = (e: React.MouseEvent, product: RealTimeProduct) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;
    lastTapRef.current = currentTime;

    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setHeartPosition({ x, y });
      setShowHeart(true);
      
      // Like the product
      handleLike(product);
      
      // Hide heart after animation
      setTimeout(() => setShowHeart(false), 1000);
      
      e.preventDefault();
      e.stopPropagation();
      return; // Prevent single tap from firing
    }
  };

  const handleSingleTap = (product: RealTimeProduct) => {
    // Add a small delay to allow for double tap detection
    setTimeout(() => {
      const currentTime = new Date().getTime();
      const timeSinceLastTap = currentTime - lastTapRef.current;
      
      // Only open details if no double tap occurred
      if (timeSinceLastTap > 300) {
        setDetailsProduct(product);
        setShowDetails(true);
      }
    }, 300);
  };

  const handleLike = async (product: RealTimeProduct) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      toast.success('Post liked! ❤️');
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const scrollToProduct = (index: number) => {
    const container = containerRef.current;
    if (container) {
      const productElement = container.children[index] as HTMLElement;
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      const rect = child.getBoundingClientRect();
      const childCenter = rect.top + rect.height / 2;
      const distance = Math.abs(childCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    // Calculate the actual product index (accounting for the duplicated array)
    const actualIndex = closestIndex % products.length;
    setCurrentIndex(actualIndex);

    // Handle infinite loop - when reaching the end, jump to the middle section
    if (closestIndex >= products.length * 2) {
      // We're in the last section, jump to the middle section
      setTimeout(() => {
        const middleSectionStart = products.length;
        const targetElement = container.children[middleSectionStart] as HTMLElement;
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }, 100);
    } else if (closestIndex < products.length) {
      // We're in the first section, jump to the middle section
      setTimeout(() => {
        const middleSectionStart = products.length;
        const targetElement = container.children[middleSectionStart] as HTMLElement;
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }, 100);
    }
  }, [products.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    // Set up intersection observer for preloading
    if (containerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = parseInt(entry.target.getAttribute('data-index') || '0');
              const actualIndex = index % products.length;
              const product = products[actualIndex];
              if (product) {
                handleProductView(product);
                
                // Auto-play video if it's a video product
                if (product.media_type === 'video') {
                  const video = entry.target.querySelector('video') as HTMLVideoElement;
                  if (video) {
                    video.play().catch(() => {
                      // Ignore autoplay errors
                    });
                  }
                }
              }
            } else {
              // Pause video when out of view
              const video = entry.target.querySelector('video') as HTMLVideoElement;
              if (video) {
                video.pause();
              }
            }
          });
        },
        { threshold: 0.5 }
      );

      Array.from(containerRef.current.children).forEach((child, index) => {
        child.setAttribute('data-index', index.toString());
        observerRef.current?.observe(child);
      });
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [products]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading real-time products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
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
      <div className={`${className} flex items-center justify-center`}>
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
        {/* Dynamic Background */}
        {products[currentIndex] && (
          <div 
            className="fixed inset-0 z-0"
            style={{
              backgroundImage: `url(${products[currentIndex].media_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px) brightness(0.3)',
            }}
          />
        )}

        {/* Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-40">
          <div 
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}
          />
        </div>

        {/* Main Scroll Container */}
        <div 
          ref={containerRef}
          className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {infiniteProducts.map((product, index) => {
            const actualIndex = index % products.length;
            const actualProduct = products[actualIndex];
            
            return (
              <div
                key={`${actualProduct.id}-${index}`}
                className="relative h-screen snap-start flex items-center justify-center"
                style={{ scrollSnapAlign: 'center' }}
              >
                {/* Product Card */}
                <div className="relative w-full max-w-md mx-auto h-[95vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
                  {/* Media Container - Full Height */}
                  <div 
                    className="relative h-full overflow-hidden cursor-pointer"
                    onClick={() => handleSingleTap(actualProduct)}
                    onDoubleClick={(e) => handleDoubleTap(e, actualProduct)}
                  >
                    {actualProduct.media_type === 'video' ? (
                      <video
                        src={actualProduct.media_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                        onPlay={() => {
                          // Hide any play button when video starts playing
                          const playButton = document.querySelector(`[data-video-id="${actualProduct.id}"]`);
                          if (playButton) {
                            (playButton as HTMLElement).style.display = 'none';
                          }
                        }}
                        onPause={() => {
                          // Show play button when video is paused
                          const playButton = document.querySelector(`[data-video-id="${actualProduct.id}"]`);
                          if (playButton) {
                            (playButton as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <img
                        src={actualProduct.media_url}
                        alt={actualProduct.title}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Animated Heart on Double Tap */}
                    {showHeart && (
                      <div 
                        className="absolute pointer-events-none z-50"
                        style={{
                          left: heartPosition.x - 50,
                          top: heartPosition.y - 50,
                        }}
                      >
                        <div className="animate-ping">
                          <Heart className="w-20 h-20 text-red-500 fill-current animate-bounce" />
                        </div>
                        <div className="absolute inset-0 animate-pulse">
                          <Heart className="w-24 h-24 text-red-400 fill-current opacity-50" />
                        </div>
                      </div>
                    )}

                    {/* Play Button for Videos - Only show when paused */}
                    {actualProduct.media_type === 'video' && (
                      <div 
                        data-video-id={actualProduct.id}
                        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          const video = e.currentTarget.previousElementSibling as HTMLVideoElement;
                          if (video) {
                            if (video.paused) {
                              video.play();
                            } else {
                              video.pause();
                            }
                          }
                        }}
                      >
                        <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Glassmorphism Overlay - All Content */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                      {/* Top Stats - Glassmorphism */}
                      <div 
                        className="absolute top-4 right-4 flex items-center gap-2 text-white text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                          <Eye className="w-4 h-4" />
                          <span>{actualProduct.views_count}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                          <Clock className="w-4 h-4" />
                          <span>{formatRelativeTime(actualProduct.created_at)}</span>
                        </div>
                      </div>

                      {/* Action Buttons - Glassmorphism */}
                      <div 
                        className="absolute bottom-4 right-4 flex flex-col gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContact(actualProduct, 'whatsapp');
                          }}
                          className="w-12 h-12 bg-green-500/90 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-lg border border-white/30"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContact(actualProduct, 'call');
                          }}
                          className="w-12 h-12 bg-blue-500/90 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-lg border border-white/30"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(actualProduct);
                          }}
                          className="w-12 h-12 bg-gray-800/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors shadow-lg border border-white/30"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Bottom Content - Glassmorphism */}
                      <div 
                        className="absolute bottom-4 left-4 right-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                          {actualProduct.title}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-orange-400">
                            ₦{actualProduct.price?.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1 text-white/80 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{actualProduct.location}</span>
                          </div>
                        </div>

                        {/* Single Reaction Button */}
                        <div 
                          className="flex items-center gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div onClick={(e) => e.stopPropagation()}>
                            <ReactionsBar 
                              product={actualProduct}
                              onReactionChange={() => {
                                // Refresh product data if needed
                              }}
                            />
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowComments(!showComments);
                            }}
                            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">{actualProduct.comments_count || 0}</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments Section - Overlay */}
                      {showComments && (
                        <div 
                          className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div 
                            className="w-full max-w-md mx-4 bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-white font-bold text-lg">Comments</h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowComments(false);
                                }}
                                className="text-white/80 hover:text-white"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            <CommentsSection 
                              productId={actualProduct.id}
                              onCommentChange={() => {
                                // Refresh product data if needed
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation Dots - REMOVED */}
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows - REMOVED */}
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