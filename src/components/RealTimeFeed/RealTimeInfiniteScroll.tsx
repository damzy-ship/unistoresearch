import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, MapPin, MessageCircle, Phone, Heart, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import { getActiveRealTimeProducts, trackRealTimeProductView, trackRealTimeProductContact, formatRelativeTime, getTimeRemaining } from '../../lib/realTimeService';
import { RealTimeProduct } from '../../lib/realTimeService';
// import ReactionsBar from './ReactionsBar';
// import CommentsSection from './CommentsSection';
import ProductGallery from './ProductGallery';

interface RealTimeInfiniteScrollProps {
  onClose?: () => void;
}

export default function RealTimeInfiniteScroll({ onClose }: RealTimeInfiniteScrollProps) {
  const [products, setProducts] = useState<RealTimeProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<RealTimeProduct | null>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const [showDetails, setShowDetails] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<RealTimeProduct | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTapRef = useRef<number>(0);

  // Create infinite loop by duplicating products - ONLY if more than 1 product
  const infiniteProducts = products.length > 1 ? [...products, ...products, ...products] : products;

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
      const result = await getActiveRealTimeProducts(50);
      
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

  const handleProductView = async (product: RealTimeProduct) => {
    try {
      await trackRealTimeProductView(product.id);
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  // Set up intersection observer for auto-playing videos and tracking views
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const productId = entry.target.getAttribute('data-product-id');
            const product = products.find(p => p.id === productId);
            
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
          }
        });
      },
      { threshold: 0.5 }
    );

    const productElements = containerRef.current.querySelectorAll('[data-product-id]');
    productElements.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [products]);

  const handleSingleTap = (product: RealTimeProduct) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < 300) {
      // Double tap detected
      handleDoubleTap({ clientX: 0, clientY: 0 } as React.MouseEvent, product);
    } else {
      // Single tap - show details
      setDetailsProduct(product);
      setShowDetails(true);
    }
    
    lastTapRef.current = now;
  };

  const handleDoubleTap = (e: React.MouseEvent, product: RealTimeProduct) => {
    // Show heart animation
    setHeartPosition({ x: e.clientX, y: e.clientY });
    setShowHeart(true);
    
    setTimeout(() => {
      setShowHeart(false);
    }, 1000);
    
    // TODO: Add like functionality - use the product
    console.log('Liked product:', product.title);
    toast.success('❤️ Liked!');
  };

  const handleContact = async (method: 'whatsapp' | 'call' | 'message') => {
    if (!selectedProduct) return;
    
    try {
      await trackRealTimeProductContact(selectedProduct.id, method);
      
      let url = '';
      const phone = selectedProduct.contact_phone || selectedProduct.merchant?.phone_number;
      
      if (!phone) {
        toast.error('No contact information available');
        return;
      }
      
      switch (method) {
        case 'whatsapp':
          url = `https://wa.me/${phone.replace(/\D/g, '')}?text=Hi! I'm interested in your ${selectedProduct.title}`;
          break;
        case 'call':
          url = `tel:${phone}`;
          break;
        case 'message':
          url = `sms:${phone}?body=Hi! I'm interested in your ${selectedProduct.title}`;
          break;
      }
      
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error handling contact:', error);
      toast.error('Failed to open contact method');
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex && newIndex < products.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, products.length]);

  // Auto-scroll to next item
  const scrollToNext = useCallback(() => {
    if (products.length <= 1) return; // Don't scroll if only one product
    
    const nextIndex = (currentIndex + 1) % products.length;
    const container = containerRef.current;
    
    if (container) {
      const itemHeight = container.clientHeight;
      container.scrollTo({
        top: nextIndex * itemHeight,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, products.length]);

  // Auto-scroll every 5 seconds if there are multiple products
  useEffect(() => {
    if (products.length <= 1) return; // Don't auto-scroll if only one product
    
    const interval = setInterval(() => {
      scrollToNext();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [scrollToNext, products.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading real-time updates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <p className="text-white text-lg mb-4">{error}</p>
          <button 
            onClick={fetchProducts}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <p className="text-white text-lg mb-4">No real-time updates available</p>
          <button 
            onClick={fetchProducts}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-40">
      {/* Background Blur */}
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
      {/* <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-40">
        <div 
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}
        />
      </div> */}

      {/* Main Scroll Container */}
      <div 
        ref={containerRef}
        className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
        onScroll={handleScroll}
      >
        {infiniteProducts.map((product, index) => {
          const actualIndex = index % products.length;
          const actualProduct = products[actualIndex];
          
          return (
            <div
              key={`${actualProduct.id}-${index}`}
              data-product-id={actualProduct.id}
              className="relative h-screen snap-start flex items-center justify-center"
              style={{ scrollSnapAlign: 'center' }}
            >
              {/* Product Card */}
              <div className="relative w-full max-w-md mx-auto h-[95vh] bg-white rounde overflow-hidden shadow-2xl">
                {/* Media Container - Full Height */}
                <div 
                  className="relative h-full overflow-hidden cursor-pointer"
                  onClick={() => handleSingleTap(actualProduct)}
                  onDoubleClick={(e) => handleDoubleTap(e, actualProduct)}
                >
                  {actualProduct.is_text_post ? (
                    // Text Post - Full colored background
                    <div 
                      className="w-full h-full flex items-center justify-center p-8"
                      style={{ backgroundColor: actualProduct.text_color || '#FF6B35' }}
                    >
                      <div className="text-center text-white w-full h-full flex items-center justify-center max-w-sm">
                        <h2 className={`text-2xl font-bold ${
                          actualProduct.title.length > 50 ? 'text-left' : 'text-center'
                        }`}>
                          {actualProduct.title}
                        </h2>
                      </div>
                    </div>
                  ) : (
                    // Image/Video Post
                    <>
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
                              video.play().catch(() => {
                                // Ignore autoplay errors
                              });
                            }
                          }}
                        >
                          <div className="bg-black bg-opacity-50 rounded-full p-4">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Overlay with Product Info - Only for image/video posts */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                        <div className="text-white">
                          <h2 className="text-xl font-bold mb-2">{actualProduct.title}</h2>
                          
                          {actualProduct.description && actualProduct.description.trim() && (
                            <p className="text-sm text-gray-200 mb-3 line-clamp-2">
                              {actualProduct.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {actualProduct.price && actualProduct.price > 0 && (
                                <span className="text-2xl font-bold text-orange-400">
                                  ₦{actualProduct.price.toLocaleString()}
                                </span>
                              )}
                              
                              {actualProduct.location && actualProduct.location.trim() && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <MapPin className="w-4 h-4" />
                                  <span>{actualProduct.location}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {/* Contact Buttons - SIMPLIFIED */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContact('whatsapp');
                                }}
                                className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                                title="Contact via WhatsApp"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContact('call');
                                }}
                                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                                title="Call"
                              >
                                <Phone className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Time Remaining Badge */}
                      {!getTimeRemaining(actualProduct.expires_at).isExpired && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {getTimeRemaining(actualProduct.expires_at).hours}h {getTimeRemaining(actualProduct.expires_at).minutes}m
                          </span>
                        </div>
                      )}

                      {/* Category Badge */}
                      {actualProduct.category && actualProduct.category.trim() && (
                        <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs px-3 py-1 rounded-full">
                          {actualProduct.category}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="fixed top-4 left-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Details Modal */}
      {showDetails && detailsProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{detailsProduct.title}</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {detailsProduct.description && (
                <p className="text-gray-600 mb-4">{detailsProduct.description}</p>
              )}
              
              <div className="space-y-3">
                {detailsProduct.price && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="text-2xl font-bold text-orange-500">
                      ₦{detailsProduct.price.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {detailsProduct.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">{detailsProduct.location}</span>
                  </div>
                )}
                
                {detailsProduct.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm">
                      {detailsProduct.category}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span className="text-gray-900">{formatRelativeTime(detailsProduct.created_at)}</span>
                </div>
              </div>
              
              {/* Contact Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleContact('whatsapp')}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  onClick={() => handleContact('call')}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Gallery Modal */}
      {selectedProduct && (
        <ProductGallery
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
} 