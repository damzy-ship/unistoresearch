import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Tag,
  Star,
  Award,
  Share2,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Image,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  getMerchantCategories,
  getMerchantRatings,
} from '../lib/categoryService';
import StarRating from '../components/StarRating';
import SellerPaymentModal from '../components/SellerPaymentModal';
import ProductGallery from '../components/ProductGallery';

interface SellerDetails {
  id: string;
  seller_id: string;
  full_name: string;
  school_name: string;
  seller_description: string;
  created_at: string;
  average_rating?: number;
  total_ratings?: number;
  rating_breakdown?: any;
  billing_date?: string;
  is_billing_active?: boolean;
  categories: string[];
}

interface Review {
  id: string;
  rating: number;
  review_text?: string;
  created_at: string;
}

export default function SellerDetailsPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<SellerDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchSellerDetails = async () => {
      if (!sellerId) {
        setError('Seller ID not provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch seller data
        const { data: merchant, error: merchantError } = await supabase
          .from('merchants')
          .select(
            `
            id,
            seller_id,
            full_name,
            school_name,
            seller_description,
            created_at,
            average_rating,
            total_ratings,
            rating_breakdown,
            billing_date,
            is_billing_active
          `
          )
          .eq('seller_id', sellerId)
          .single();

        if (merchantError) {
          setError('Seller not found');
          setLoading(false);
          return;
        }

        // Get categories
        const categories = await getMerchantCategories(
          merchant.id,
          merchant.seller_description
        );

        // Get reviews
        const { data: reviewsData } = await supabase
          .from('seller_ratings')
          .select('id, rating, review_text, created_at')
          .eq('merchant_id', merchant.id)
          .eq('is_cancelled', false)
          .order('created_at', { ascending: false })
          .limit(10);

        setSeller({
          ...merchant,
          categories,
        });
        setReviews(reviewsData || []);
      } catch (error) {
        console.error('Error fetching seller details:', error);
        setError('Failed to load seller information');
      } finally {
        setLoading(false);
      }
    };

    fetchSellerDetails();
  }, [sellerId]);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((name) => name.charAt(0).toUpperCase())
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
      'bg-gradient-to-br from-teal-500 to-teal-600',
    ];
    const index = fullName.length % colors.length;
    return colors[index];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isTopRated = (seller: SellerDetails) => {
    return (
      (seller.average_rating || 0) >= 4.5 && (seller.total_ratings || 0) >= 10
    );
  };

  const isSellerActive = (seller: SellerDetails) => {
    if (!seller.billing_date || !seller.is_billing_active) return true;
    const currentDate = new Date().toISOString().split('T')[0];
    return seller.billing_date > currentDate;
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${seller?.full_name} - UniStore Seller`,
          text: `Check out ${seller?.full_name}'s profile on UniStore`,
          url: shareUrl,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Seller Not Found
          </h2>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Seller Profile
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => navigate('/')}
                className="text-lg font-bold"
              >
                <span className="text-orange-500">uni</span>
                <span className="text-blue-800">store.</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div
                className={`w-24 h-24 rounded-full ${getInitialsColor(
                  seller.full_name
                )} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}
              >
                {getInitials(seller.full_name)}
              </div>
              {isTopRated(seller) && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-2 rounded-full shadow-lg">
                  <Award className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {seller.full_name}
                </h1>

                <div className="flex justify-center gap-2 ">
                  {/* Status Badge */}
                  {isSellerActive(seller) ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                      <CheckCircle className="w-4 h-4" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                      <AlertCircle className="w-4 h-4" />
                      Inactive
                    </span>
                  )}

                  {isTopRated(seller) && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      <Award className="w-4 h-4" />
                      Top Rated
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{seller.school_name}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {formatDate(seller.created_at)}</span>
                </div>
              </div>

              {(seller.total_ratings || 0) > 0 && (
                <div className="flex justify-center md:justify-start mb-4">
                  <StarRating
                    rating={seller.average_rating || 0}
                    totalRatings={seller.total_ratings}
                    size="lg"
                  />
                </div>
              )}

              <p className="text-gray-700 leading-relaxed">
                {seller.seller_description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Categories */}
            {/* Product Gallery */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Product Gallery
                </h2>
              </div>
              <ProductGallery merchantId={seller.id} />
            </div>

            {seller.categories.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Product Categories
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {seller.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 rounded-xl font-medium border border-orange-300"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product Images */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Product Images
                </h2>
              </div>
              <ProductGallery merchantId={seller.id} />
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Customer Reviews
                  </h2>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-100 pb-4 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating
                          rating={review.rating}
                          size="sm"
                          showCount={false}
                        />
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-gray-700">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Seller ID</span>
                  <span className="font-mono text-sm text-gray-800">
                    {seller.seller_id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  {isSellerActive(seller) ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Categories</span>
                  <span className="font-bold text-orange-600">
                    {seller.categories.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Reviews</span>
                  <span className="font-bold text-blue-600">
                    {seller.total_ratings || 0}
                  </span>
                </div>
                {(seller.total_ratings || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-bold text-yellow-600">
                      {(seller.average_rating || 0).toFixed(1)}★
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Breakdown */}
            {seller.rating_breakdown && (seller.total_ratings || 0) > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Rating Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(seller.rating_breakdown)
                    .reverse()
                    .map(([stars, count]) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm font-medium w-8">
                          {stars}★
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full"
                            style={{
                              width: `${
                                ((count as number) /
                                  (seller.total_ratings || 1)) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-6">
              <h3 className="text-lg font-bold text-orange-900 mb-2">
                Need Something?
              </h3>
              <p className="text-orange-700 text-sm mb-4">
                Search for products to see if {seller.full_name} has what you're
                looking for.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-medium transition-all duration-200 mb-3"
              >
                Start Shopping
              </button>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl font-medium transition-all duration-200"
              >
                <CreditCard className="w-4 h-4" />
                Make Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <SellerPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        sellerId={seller.id}
        sellerName={seller.full_name}
        sellerEmail={seller.email}
      />
    </div>
  );
}
