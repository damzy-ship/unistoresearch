import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, MapPin, Heart, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import { getActiveRealTimeProducts, trackRealTimeProductView, trackRealTimeProductContact, getTimeRemaining } from '../../lib/realTimeService';
import { RealTimeProduct } from '../../lib/realTimeService';
import AuthModal from '../AuthModal';
import BuyNowButton from '../Payment/BuyNowButton';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../ProfileModal';

interface RealTimeInfiniteScrollProps {
  onClose?: () => void;
  scrollToProduct?: string;
  selectedProduct?: RealTimeProduct;
}

export default function RealTimeInfiniteScroll({ onClose, scrollToProduct, selectedProduct: initialSelectedProduct }: RealTimeInfiniteScrollProps) {
  const [products, setProducts] = useState<RealTimeProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<RealTimeProduct | null>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const [showDetails, setShowDetails] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<RealTimeProduct | null>(null);
  const [isFromStatusBar, setIsFromStatusBar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTapRef = useRef<number>(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<UserProfile | null>(null);
  const [hasNotScrolled, setHasNotScrolled] = useState(true);
  // Create infinite loop by duplicating products - ONLY if more than 1 product
  const infiniteProducts = products.length > 1 ? [...products, ...products, ...products] : products;

  // Handle scroll to specific product when navigating from status bar
  useEffect(() => {

    console.log('RealTimeInfiniteScroll: scrollToProduct =', scrollToProduct, 'products.length =', products.length);
    
    if (scrollToProduct && products.length > 0 && hasNotScrolled) {
      const productIndex = products.findIndex(p => p.id === scrollToProduct);
      console.log('RealTimeInfiniteScroll: Found product at index', productIndex);
      if (productIndex !== -1) {
        setCurrentIndex(productIndex);
        setIsFromStatusBar(true); // Mark that we came from status bar

        setTimeout(() => {
          if (containerRef.current) {
            const itemHeight = containerRef.current.clientHeight;
            const scrollTop = productIndex * itemHeight;
            console.log('RealTimeInfiniteScroll: Scrolling to position', scrollTop);
            containerRef.current.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    }


  }, [scrollToProduct, products]);

  // Handle selected product from navigation
  useEffect(() => {
    if (initialSelectedProduct) {
      setSelectedProduct(initialSelectedProduct);
    }
  }, [initialSelectedProduct]);

  useEffect(() => {
    fetchProducts();

    // Set up realtime polling every 10 seconds
    const interval = setInterval(() => {
      fetchProducts(true); // Pass true for background updates
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {

    const getUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: visitorData, error } = await supabase
            .from('unique_visitors')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();
          if (error) {
            console.error('Error fetching profile:', error);
          } else if (visitorData) {
            const profileData: UserProfile = {
              user_id: visitorData.auth_user_id,
              full_name: visitorData.full_name || 'User',
              phone_number: visitorData.phone_number || '',
              // email: session.user.email || '',
              created_at: visitorData.created_at,
              visit_count: visitorData.visit_count || 0
            };
            setCustomerInfo(profileData);
          }
        }
      }
      catch (err) {
        console.log(err);
      }
    }

    getUserData();

  }, [])


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
        console.log('Fetched products:', result.data);
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

  const handleAuthSuccess = () => {
    handleContact('whatsapp');
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
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
    setHasNotScrolled(false);
    
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    console.log(newIndex, currentIndex, products.length);
    if (newIndex !== currentIndex && newIndex < products.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, products.length]);


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
                >
                  {actualProduct.is_text_post ? (
                    // Text Post - Full colored background
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-8"
                      style={{ backgroundColor: actualProduct.text_color || '#FF6B35' }}
                    >

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                        <div className="text-white">
                          {/* <h2 className="text-xl font-bold mb-2">{actualProduct.title}</h2> */}

                          {/* {actualProduct.description && actualProduct.description.trim() && (
                            <p className="text-sm text-gray-200 mb-3 line-clamp-2">
                              {actualProduct.description}
                            </p>
                          )} */}

                          <div className="flex items-center justify-between mb-20">
                            <div className="flex items-center space-x-4">
                              <div className='flex flex-col gap-1'>
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

                                {actualProduct.merchant && actualProduct.merchant.full_name.trim() && (
                                  <div className="flex items-center space-x-1 text-sm">
                                    <span>Post by</span>
                                    <span>{actualProduct.merchant.full_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* CONTACT BUTTON FOR TEXT */}
                            <BuyNowButton
                              productData={actualProduct}
                              userData={customerInfo}
                            />
                            {/* <button
                              onClick={handleContactSeller}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg w-fit order-1 sm:order-2"
                            >
                              Buy Now
                            </button> */}

                          </div>
                        </div>
                      </div>

                      {/* Category Badge */}
                      {actualProduct.category && actualProduct.category.trim() && (
                        <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs px-3 py-1 rounded-full">
                          {actualProduct.category}
                        </div>
                      )}

                      {/* Time Remaining Badge */}
                      {!getTimeRemaining(actualProduct.expires_at).isExpired && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {getTimeRemaining(actualProduct.expires_at).hours === 23 ? 60 - getTimeRemaining(actualProduct.expires_at).minutes + "m" : 23 - getTimeRemaining(actualProduct.expires_at).hours + 'h'} ago
                          </span>
                        </div>
                      )}

                      <div className="text-center text-white w-full h-full flex items-center justify-center max-w-sm">
                        <h2 className={`text-2xl font-bold ${actualProduct.title.length > 50 ? 'text-left' : 'text-center'
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

                          <div className="flex items-center justify-between mb-20">
                            <div className="flex items-center space-x-4">
                              <div className='flex flex-col gap-1'>

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
                                {actualProduct.merchant?.full_name && actualProduct.merchant?.full_name.trim() && (
                                  <div className="flex items-center space-x-1 text-sm">
                                    <span>Post by</span>
                                    <span>{actualProduct.merchant?.full_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <BuyNowButton
                              productData={actualProduct}
                              userData={customerInfo}
                            />

                            {/* Contact Buttons - SIMPLIFIED
                            <button
                              onClick={handleContactSeller}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg w-fit order-1 sm:order-2"
                            >
                              Buy Now
                            </button> */}

                          </div>
                        </div>
                      </div>

                      {/* Time Remaining Badge */}
                      {!getTimeRemaining(actualProduct.expires_at).isExpired && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {getTimeRemaining(actualProduct.expires_at).hours === 23 ? 60 - getTimeRemaining(actualProduct.expires_at).minutes + "m" : 23 - getTimeRemaining(actualProduct.expires_at).hours + 'h'} ago
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


      {/* Phone Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
} 