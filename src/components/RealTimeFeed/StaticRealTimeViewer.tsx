import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Play, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { RealTimeProduct } from '../../lib/realTimeService';
import { getTimeRemaining } from '../../lib/realTimeService';

interface Props {
  products: RealTimeProduct[];
  onClose?: () => void;
}

interface MerchantPartial {
  id: string;
  full_name?: string;
}

export default function StaticRealTimeViewer({ products, onClose }: Props) {
  const { currentTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset index when products change
    setCurrentIndex(0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [products]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < products.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, products.length]);

  if (!products || products.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black z-40">
      {/* Background blur using currently visible product */}
      {products[currentIndex] && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${products[currentIndex].media_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.3)'
          }}
        />
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-product-id={product.id}
            className="relative h-screen snap-start flex items-center justify-center"
            style={{ scrollSnapAlign: 'center' }}
          >
            <div className="relative w-full max-w-md mx-auto h-[95vh] bg-white rounde overflow-hidden shadow-2xl">
              <div className="relative h-full overflow-hidden">
                {product.is_text_post ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8" style={{ backgroundColor: product.text_color || '#FF6B35' }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                      <div className="text-white">
                        <div className="flex items-center justify-between mb-20">
                          <div className="flex items-center space-x-4">
                            <div className='flex flex-col gap-1'>
                              {product.price && (
                                <span className="text-2xl font-bold text-orange-400">₦{product.price}</span>
                              )}

                              {product.location && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <MapPin className="w-4 h-4" />
                                  <span>{product.location}</span>
                                </div>
                              )}

                              {product.merchant && (product.merchant as MerchantPartial).full_name && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <span>Post by</span>
                                  <span className='font-bold'>{(product.merchant as MerchantPartial).full_name}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-medium">Get Now</button>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-white w-full h-full flex items-center justify-center max-w-sm">
                      <h2 className={`text-2xl font-bold ${product.title && product.title.length > 50 ? 'text-left' : 'text-center'}`}>{product.title}</h2>
                    </div>
                  </div>
                ) : (
                  <>
                    {product.media_type === 'video' ? (
                      <video src={product.media_url} className="w-full h-full object-cover" muted loop />
                    ) : (
                      <img src={product.media_url} alt={product.title} className="w-full h-full object-cover" />
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                      <div className="text-white">
                        <h2 className="text-xl font-bold mb-2">{product.title}</h2>
                        {product.description && <p className="text-sm text-gray-200 mb-3 line-clamp-2">{product.description}</p>}

                        <div className="flex items-center justify-between mb-20">
                          <div className="flex items-center space-x-4">
                            <div className='flex flex-col gap-1'>
                              {product.price && (
                                <span className="text-2xl font-bold text-orange-400">₦{product.price}</span>
                              )}

                              {product.location && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <MapPin className="w-4 h-4" />
                                  <span>{product.location}</span>
                                </div>
                              )}

                              {product.merchant && (product.merchant as MerchantPartial).full_name && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <span>Post by</span>
                                  <span className='font-bold'>{(product.merchant as MerchantPartial).full_name}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-medium">Get Now</button>
                        </div>
                      </div>
                    </div>

                    {!getTimeRemaining(product.expires_at).isExpired && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeRemaining(product.expires_at).hours === 23 ? 60 - getTimeRemaining(product.expires_at).minutes + "m" : 23 - getTimeRemaining(product.expires_at).hours + 'h'} ago</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Close Button */}
      {onClose && (
        <button onClick={onClose} className="fixed top-4 left-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
          <X className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
