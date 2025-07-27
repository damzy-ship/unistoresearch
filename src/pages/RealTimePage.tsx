import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Filter, Search, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RealTimeProduct, getActiveRealTimeProducts, trackRealTimeProductView, formatRelativeTime } from '../lib/realTimeService';
import RealTimeInfiniteScroll from '../components/RealTimeFeed/RealTimeInfiniteScroll';
import { useTheme } from '../hooks/useTheme';
import { toast } from 'sonner';

export default function RealTimePage() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [products, setProducts] = useState<RealTimeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<RealTimeProduct | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getActiveRealTimeProducts(50);

      if (fetchError) {
        setError(fetchError);
        toast.error('Failed to load real-time products');
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading real-time products:', error);
      setError('Failed to load real-time products');
      toast.error('Failed to load real-time products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product: RealTimeProduct, index: number) => {
    // Track view
    await trackRealTimeProductView(product.id);
    
    // Set current index and open viewer
    setCurrentIndex(index);
    setSelectedProduct(product);
    setShowViewer(true);
  };

  const handleViewerClose = () => {
    setShowViewer(false);
    setSelectedProduct(null);
  };

  const handleNextProduct = () => {
    if (currentIndex < products.length - 1) {
      const nextProduct = products[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setSelectedProduct(nextProduct);
      trackRealTimeProductView(nextProduct.id);
    }
  };

  const handlePrevProduct = () => {
    if (currentIndex > 0) {
      const prevProduct = products[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      setSelectedProduct(prevProduct);
      trackRealTimeProductView(prevProduct.id);
    }
  };

  const handleCreateProduct = () => {
    // Navigate to create product page
    navigate('/create-real-time-product');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || product.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading real-time products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* TikTok-style Infinite Scroll */}
      <RealTimeInfiniteScroll 
        className="h-screen"
        onClose={() => navigate('/')}
      />
    </div>
  );
} 