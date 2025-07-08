import React, { useState, useEffect } from 'react';
import { Search, Filter, Share2, Eye, MapPin, Calendar, Tag, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getMerchantCategories } from '../lib/categoryService';
import { getActiveSchools } from '../lib/schoolService';
import StarRating from '../components/StarRating';
import BoltBadge from '../components/BoltBadge';

interface SellerWithCategories {
  id: string;
  seller_id: string;
  full_name: string;
  school_name: string;
  seller_description: string;
  created_at: string;
  average_rating?: number;
  total_ratings?: number;
  billing_date?: string;
  is_billing_active?: boolean;
  categories: string[];
}

export default function SellersPage() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<SellerWithCategories[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<SellerWithCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);

  useEffect(() => {
    const fetchSellers = async () => {
      setLoading(true);
      try {
        // Fetch all merchants with ratings
        const { data: merchants, error } = await supabase
          .from('merchants')
          .select(`
            id,
            seller_id,
            full_name,
            school_name,
            seller_description,
            created_at,
            average_rating,
            total_ratings,
            billing_date,
            is_billing_active
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching merchants:', error);
          return;
        }

        // Get categories for each merchant
        const sellersWithCategories: SellerWithCategories[] = [];
        
        for (const merchant of merchants || []) {
          const categories = await getMerchantCategories(merchant.id, merchant.seller_description);
          sellersWithCategories.push({
            ...merchant,
            categories
          });
        }

        // Fetch schools
        const activeSchools = await getActiveSchools();
        setSchools(activeSchools);

        setSellers(sellersWithCategories);
        setFilteredSellers(sellersWithCategories);
      } catch (error) {
        console.error('Error fetching sellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  useEffect(() => {
    let filtered = sellers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(seller =>
        seller.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
        seller.seller_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by university
    if (selectedUniversity) {
      filtered = filtered.filter(seller => seller.school_name === selectedUniversity);
    }

    setFilteredSellers(filtered);
  }, [searchTerm, selectedUniversity, sellers]);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getInitialsColor = (fullName: string) => {
    const colors = [
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-teal-500 to-teal-600'
    ];
    const index = fullName.length % colors.length;
    return colors[index];
  };

  const isSellerActive = (seller: SellerWithCategories) => {
    if (!seller.billing_date || !seller.is_billing_active) return true;
    const currentDate = new Date().toISOString().split('T')[0];
    return seller.billing_date > currentDate;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleShareProfile = async (seller: SellerWithCategories) => {
    const shareUrl = `${window.location.origin}/seller-card/${seller.seller_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${seller.full_name} - UniStore Seller`,
          text: `Check out ${seller.full_name}'s profile on UniStore`,
          url: shareUrl
        });
      } catch (error) {
        // If sharing fails, fall back to copying to clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert('Profile link copied to clipboard!');
        } catch (clipboardError) {
          console.error('Failed to copy to clipboard:', clipboardError);
          alert('Unable to share or copy link. Please try again.');
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Profile link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
        alert('Unable to copy link. Please try again.');
      }
    }
  };

  const handleViewAccount = (seller: SellerWithCategories) => {
    navigate(`/seller/${seller.seller_id}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUniversity('');
  };

  const activeFiltersCount = [searchTerm, selectedUniversity].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold"
              >
                <span className="text-orange-500">uni</span>
                <span className="text-blue-800">store.</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Sellers Directory</h1>
              <BoltBadge variant="minimal" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search sellers by name, categories, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            <div className="text-sm text-gray-600 flex items-center">
              Showing {filteredSellers.length} of {sellers.length} sellers
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    University
                  </label>
                  <select
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">All Universities</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.name}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sellers Grid */}
        {filteredSellers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sellers found</h3>
            <p className="text-gray-600">
              {activeFiltersCount > 0 
                ? 'Try adjusting your filters or search terms'
                : 'No sellers are currently registered'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSellers.map((seller) => (
              <div
                key={seller.id}
                className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Profile Header */}
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 rounded-full ${getInitialsColor(seller.full_name)} flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 shadow-lg`}>
                    {getInitials(seller.full_name)}
                  </div>
                  
                  {/* Seller ID */}
                  <p className="text-xs font-mono text-gray-500 mb-2">{seller.seller_id}</p>
                  
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{seller.full_name}</h3>
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-3 h-3" />
                    {seller.school_name}
                  </div>
                  
                  {/* Status Badge */}
                  <div className="mb-2">
                    {isSellerActive(seller) ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {(seller.total_ratings || 0) > 0 && (
                    <StarRating
                      rating={seller.average_rating || 0}
                      totalRatings={seller.total_ratings}
                      size="sm"
                      className="justify-center"
                    />
                  )}
                </div>

                {/* Categories */}       
                {seller.categories.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-2">
                      <Tag className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">Categories</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {seller.categories.slice(0, 3).map((category, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                        >
                          {category}
                        </span>
                      ))}
                      {seller.categories.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{seller.categories.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Registration Date */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  Joined {formatDate(seller.created_at)}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShareProfile(seller)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={() => handleViewAccount(seller)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}