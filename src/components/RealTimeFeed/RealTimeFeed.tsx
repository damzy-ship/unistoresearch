import React, { useState, useEffect } from 'react';
import { ChevronRight, Play, Eye, MessageCircle, Clock } from 'lucide-react';
import { RealTimeProduct, getActiveRealTimeProducts, trackRealTimeProductView, formatRelativeTime, getTimeRemaining } from '../../lib/realTimeService';
import RealTimeCard from './RealTimeCard';
import RealTimeViewer from './RealTimeViewer';
import { toast } from 'sonner';

interface RealTimeFeedProps {
  limit?: number;
  showViewMore?: boolean;
  className?: string;
}

export default function RealTimeFeed({ 
  limit = 5, 
  showViewMore = true, 
  className = '' 
}: RealTimeFeedProps) {
  const [products, setProducts] = useState<RealTimeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<RealTimeProduct | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    loadProducts();
    
    // Set up realtime polling every 10 seconds
    const interval = setInterval(() => {
      loadProducts(true); // Pass true for background updates
    }, 10000);
    
    return () => clearInterval(interval);
  }, [limit]);

  const loadProducts = async (isBackgroundUpdate = false) => {
    try {
      // Only show loading on initial load, not on background updates
      if (!isBackgroundUpdate && products.length === 0) {
        setLoading(true);
      }
      setError(null);

      const { data, error: fetchError } = await getActiveRealTimeProducts(50); // Get all products

      if (fetchError) {
        setError(fetchError);
        if (!isBackgroundUpdate && products.length === 0) {
          toast.error('Failed to load real-time products');
        }
        return;
      }

      if (data) {
        // If this is a background update and we have existing products,
        // only add new products without disrupting current view
        if (isBackgroundUpdate && products.length > 0) {
          const existingIds = new Set(products.map(p => p.id));
          const newProducts = data.filter(p => !existingIds.has(p.id));
          
          if (newProducts.length > 0) {
            // Add new products to the beginning without changing current view
            setProducts(prev => [...newProducts, ...prev]);
          }
        } else {
          // Initial load or no existing products
          setProducts(data);
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading real-time products:', error);
      setError('Failed to load real-time products');
      if (!isBackgroundUpdate && products.length === 0) {
        toast.error('Failed to load real-time products');
      }
    } finally {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    }
  };

  const handleProductClick = async (product: RealTimeProduct) => {
    // Track view
    await trackRealTimeProductView(product.id);
    
    // Open viewer
    setSelectedProduct(product);
    setShowViewer(true);
  };

  const handleViewerClose = () => {
    setShowViewer(false);
    setSelectedProduct(null);
  };

  const handleViewMore = () => {
    // Navigate to full real-time page
    window.location.href = '/real-time';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Loading real-time products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadProducts}
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
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <Clock className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">No Real-time Products</p>
            <p className="text-sm">Check back later for fresh products!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-bold text-gray-900">🔥 Just In</h3>
            <span className="text-sm text-gray-500">• Real-time</span>
          </div>
          
          {showViewMore && products.length > 0 && (
            <button
              onClick={handleViewMore}
              className="flex items-center space-x-1 text-orange-500 hover:text-orange-600 transition-colors text-sm font-medium"
            >
              <span>View More</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <RealTimeCard
              key={product.id}
              product={product}
              onClick={() => handleProductClick(product)}
            />
          ))}
        </div>

        {/* Stats - COMMENTED OUT FOR NOW */}
        {/* <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{products.reduce((sum, p) => sum + p.views_count, 0)} views</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{products.reduce((sum, p) => sum + p.contact_clicks, 0)} contacts</span>
              </div>
            </div>
            <div className="text-xs">
              Updates every minute
            </div>
          </div>
        </div> */}
      </div>

      {/* Full-screen Viewer */}
      {showViewer && selectedProduct && (
        <RealTimeViewer
          product={selectedProduct}
          onClose={handleViewerClose}
        />
      )}
    </>
  );
} 