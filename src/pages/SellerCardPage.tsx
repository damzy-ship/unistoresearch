import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, ArrowLeft, Star, Award, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMerchantCategories } from '../lib/categoryService';
import StarRating from '../components/StarRating';

interface SellerCardData {
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

export default function SellerCardPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<SellerCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeller = async () => {
      if (!sellerId) {
        setError('Seller ID not provided');
        setLoading(false);
        return;
      }

      try {
        const { data: merchant, error } = await supabase
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
          .eq('seller_id', sellerId)
          .single();

        if (error) {
          setError('Seller not found');
          setLoading(false);
          return;
        }

        // Get categories
        const categories = await getMerchantCategories(merchant.id, merchant.seller_description);

        setSeller({
          ...merchant,
          categories
        });
      } catch (error) {
        console.error('Error fetching seller:', error);
        setError('Failed to load seller information');
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [sellerId]);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const isTopRated = (seller: SellerCardData) => {
    return (seller.average_rating || 0) >= 4.5 && (seller.total_ratings || 0) >= 10;
  };

  const isSellerActive = (seller: SellerCardData) => {
    if (!seller.billing_date || !seller.is_billing_active) return true;
    const currentDate = new Date().toISOString().split('T')[0];
    return seller.billing_date > currentDate;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Seller Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/sellers')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
          >
            Browse All Sellers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* FIFA-Style Card */}
      <div className="relative max-w-sm w-full">
        {/* Card Container with 3D Effect */}
        <div className="relative transform transition-all duration-500 hover:scale-105 hover:rotate-1">
          {/* Card Background with Gradient */}
          <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-3xl p-1 shadow-2xl">
            {/* Inner Card */}
            <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-3xl p-6 relative overflow-hidden">
              
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500 to-blue-500"></div>
                <div className="absolute top-4 left-4 w-32 h-32 border-2 border-orange-300 rounded-full opacity-20"></div>
                <div className="absolute bottom-4 right-4 w-24 h-24 border-2 border-blue-300 rounded-full opacity-20"></div>
              </div>

              {/* Top Badges */}
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
                  <MapPin className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-bold text-orange-700">
                    {seller.school_name.replace(' University', '')}
                  </span>
                </div>
                
                <div className="flex gap-1">
                  {/* Status Badge */}
                  {isSellerActive(seller) ? (
                    <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-bold text-green-700">ACTIVE</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      <span className="text-xs font-bold text-red-700">INACTIVE</span>
                    </div>
                  )}
                  
                  {isTopRated(seller) && (
                    <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 px-2 py-1 rounded-full shadow-lg animate-pulse">
                      <Award className="w-3 h-3 text-white" />
                      <span className="text-xs font-bold text-white">TOP</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Section */}
              <div className="relative z-10 text-center mb-6">
                {/* Profile Picture with Glow Effect */}
                <div className="relative mx-auto mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-2xl transform transition-all duration-300 hover:scale-110">
                    {getInitials(seller.full_name)}
                  </div>
                  {/* Glow Effect */}
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
                </div>

                {/* Seller ID */}
                <p className="text-xs font-mono text-gray-500 mb-2">{seller.seller_id}</p>

                {/* Name with Gradient Text */}
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  {seller.full_name}
                </h1>

                {/* Rating */}
                {(seller.total_ratings || 0) > 0 && (
                  <div className="flex items-center justify-center mb-3">
                    <StarRating
                      rating={seller.average_rating || 0}
                      totalRatings={seller.total_ratings}
                      size="sm"
                      className="justify-center"
                    />
                  </div>
                )}

                {/* Member Since */}
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {formatDate(seller.created_at)}</span>
                </div>
              </div>

              {/* Categories Section */}
              {seller.categories.length > 0 && (
                <div className="relative z-10 mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">SPECIALIZES IN</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {seller.categories.slice(0, 4).map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-xs font-bold border border-blue-300 shadow-sm transform transition-all duration-200 hover:scale-105"
                      >
                        {category}
                      </span>
                    ))}
                    {seller.categories.length > 4 && (
                      <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 rounded-full text-xs font-bold">
                        +{seller.categories.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Section */}
              <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
                <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200">
                  <div className="text-lg font-bold text-orange-600">
                    {seller.categories.length}
                  </div>
                  <div className="text-xs text-orange-700 font-medium">Categories</div>
                </div>
                <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
                  <div className="text-lg font-bold text-blue-600">
                    {seller.total_ratings || 0}
                  </div>
                  <div className="text-xs text-blue-700 font-medium">Reviews</div>
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10">
                <button
                  onClick={() => navigate(`/seller/${seller.seller_id}`)}
                  className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  VIEW FULL PROFILE
                </button>
              </div>

              {/* UniStore Branding */}
              <div className="relative z-10 text-center mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 font-medium">
                  made by <span className="font-bold text-orange-600">unistore</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card Shadow/Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl blur-xl opacity-20 -z-10 transform scale-105"></div>
        </div>
      </div>
    </div>
  );
}