import { useState, useEffect } from 'react';
import { getActiveRealTimeProducts, RealTimeProduct } from '../../lib/realTimeService';
import { useNavigate } from 'react-router-dom';

interface RealTimeStatusBarProps {
  onProductClick?: (product: RealTimeProduct) => void;
}

export default function RealTimeStatusBar({ onProductClick }: RealTimeStatusBarProps) {
  const [products, setProducts] = useState<RealTimeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = async (isBackgroundUpdate = false) => {
    try {
      const result = await getActiveRealTimeProducts();
      if (result.error) {
        console.error('Error fetching real-time products:', result.error);
        return;
      }
      
      if (result.data && Array.isArray(result.data)) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Error fetching real-time products:', error);
    } finally {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // Background polling every 10 seconds
    const interval = setInterval(() => {
      fetchProducts(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleProductClick = (product: RealTimeProduct) => {
    console.log('Status bar product clicked:', product.id, product.title);
    
    if (onProductClick) {
      onProductClick(product);
    } else {
      // Navigate to real-time page and scroll to this product without opening details
      console.log('Navigating to real-time with product:', product.id);
      navigate('/real-time', { 
        state: { 
          scrollToProduct: product.id,
          selectedProduct: product
        } 
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-3 overflow-x-auto">
          <div className="flex-shrink-0 w-24 h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="flex-shrink-0 w-24 h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="flex-shrink-0 w-24 h-32 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-2">
      <div className="lg:max-w-2xl h-[150px] px-2 mx-auto flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => handleProductClick(product)}
            className="flex-shrink-0 w-[100px] h-[140px] rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 cursor-pointer relative group shadow-sm"
          >
            {product.is_text_post ? (
              // Text post - show colored background with text
              <div 
                className="w-full h-full flex items-center justify-center text-white text-xs font-medium p-2 text-center"
                style={{ backgroundColor: product.text_color || '#3B82F6' }}
              >
                <span className="truncate leading-tight">
                  {product.title.length > 15 ? `${product.title.substring(0, 15)}...` : product.title}
                </span>
              </div>
            ) : (
              // Image/Video post - show thumbnail
              <div className="w-full h-full relative">
                {product.media_type === 'video' ? (
                  <video
                    src={product.media_url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={product.media_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                
                {/* Play icon for videos */}
                {product.media_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-2 border-l-white border-t-1 border-t-transparent border-b-1 border-b-transparent ml-0.5"></div>
                    </div>
                  </div>
                )}
                
                {/* Text overlay for media posts */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">
                    {product.title.length > 12 ? `${product.title.substring(0, 12)}...` : product.title}
                  </p>
                </div>
              </div>
            )}
            
            {/* Time remaining indicator */}
            {/* <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div> */}
          </button>
        ))}
      </div>
    </div>
  );
}
