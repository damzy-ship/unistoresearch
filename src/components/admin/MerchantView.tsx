import React from 'react';
import { X, Mail, User, Phone, School, FileText, Edit, Calendar, Tag, Sparkles, Star, TrendingUp, MessageSquare, CreditCard, ImageIcon } from 'lucide-react';
import { Merchant } from '../../lib/supabase';
import { getMerchantCategories } from '../../lib/categoryService';
import { getMerchantStats } from '../../lib/merchantAnalytics';
import { getMerchantRatings } from '../../lib/ratingService';
import { paystackService } from '../../lib/paystackService';
import StarRating from '../StarRating';
import ProductGallery from '../ProductGallery';

interface MerchantViewProps {
  merchant: Merchant;
  onClose: () => void;
  onEdit: () => void;
}

export default function MerchantView({ merchant, onClose, onEdit }: MerchantViewProps) {
  const [categories, setCategories] = React.useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);
  const [stats, setStats] = React.useState<any>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [billingInfo, setBillingInfo] = React.useState<any>(null);
  const [loadingBilling, setLoadingBilling] = React.useState(true);
  const [ratings, setRatings] = React.useState<any[]>([]);
  const [loadingRatings, setLoadingRatings] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingCategories(true);
      setLoadingStats(true);
      setLoadingBilling(true);
      setLoadingRatings(true);
      
      try {
        const [merchantCategories, merchantStats, merchantRatings, billingResult] = await Promise.all([
          getMerchantCategories(merchant.id, merchant.seller_description),
          getMerchantStats(merchant.id),
          getMerchantRatings(merchant.id),
          paystackService.getMerchantBilling(merchant.id)
        ]);
        
        setCategories(merchantCategories);
        setStats(merchantStats);
        setRatings(merchantRatings);
        if (billingResult.success) {
          setBillingInfo(billingResult.data);
        }
      } catch (error) {
        console.error('Error fetching merchant data:', error);
      } finally {
        setLoadingCategories(false);
        setLoadingStats(false);
        setLoadingBilling(false);
        setLoadingRatings(false);
      }
    };

    fetchData();
  }, [merchant.id, merchant.seller_description]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Type assertion for merchant with rating data
  const merchantWithRating = merchant as any;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Merchant Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
              title="Edit Merchant"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

          {/* Product Images */}
          {/* <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-medium text-purple-800">Product Images</h4>
            </div>
            <ProductGallery merchantId={merchant.id} />
          </div> */}

        <div className="space-y-6">
          {/* Seller ID */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Seller ID</p>
              <p className="text-lg font-mono font-bold text-gray-900">{merchant.seller_id}</p>
            </div>
          </div>

          {/* Analytics Stats */}
          {!loadingStats && stats && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Performance Analytics</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.total_matches}</p>
                  <p className="text-xs text-blue-700">Total Matches</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.total_contacts}</p>
                  <p className="text-xs text-blue-700">Total Contacts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.match_to_contact_ratio}%</p>
                  <p className="text-xs text-blue-700">Contact Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.recent_contacts}</p>
                  <p className="text-xs text-blue-700">Recent Contacts</p>
                </div>
              </div>
            </div>
          )}

          {/* Rating Summary */}
          {merchantWithRating.total_ratings > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <h4 className="text-sm font-medium text-yellow-800">Rating Summary</h4>
              </div>
              <div className="text-center">
                <StarRating
                  rating={merchantWithRating.average_rating || 0}
                  totalRatings={merchantWithRating.total_ratings || 0}
                  size="lg"
                  className="justify-center mb-2"
                />
                {merchantWithRating.rating_breakdown && (
                  <div className="text-xs text-yellow-700 space-y-1">
                    {Object.entries(merchantWithRating.rating_breakdown)
                      .reverse()
                      .map(([stars, count]) => (
                        <div key={stars} className="flex items-center justify-between">
                          <span>{stars} star{stars !== '1' ? 's' : ''}</span>
                          <span>{count} review{count !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Information */}
          {!loadingBilling && billingInfo && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Billing Information</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(billingInfo.billing_status)}`}>
                    {billingInfo.billing_status?.charAt(0).toUpperCase() + billingInfo.billing_status?.slice(1)}
                  </span>
                </div>
                {billingInfo.next_billing_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Next Billing Date</span>
                    <span className="text-sm font-medium text-blue-800">
                      {new Date(billingInfo.next_billing_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {billingInfo.billing_plan_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Billing Plan</span>
                    <span className="text-sm font-medium text-blue-800">
                      {billingInfo.billing_plan_id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Full Name</p>
                <p className="text-base text-gray-900">{merchant.full_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Email Address</p>
                <p className="text-base text-gray-900 break-all">{merchant.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Phone Number</p>
                <p className="text-base text-gray-900">{merchant.phone_number}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <School className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">School</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  merchant.school_name === 'Bingham University' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {merchant.school_name}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Seller Description</p>
                <p className="text-base text-gray-900 leading-relaxed">{merchant.seller_description}</p>
              </div>
            </div>

            {/* Generated Categories */}
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">Categories</p>
                {loadingCategories ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Loading categories...</span>
                  </div>
                ) : categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">No categories generated yet</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Registration Date</p>
                <p className="text-base text-gray-900">{formatDate(merchant.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Recent Reviews */}
          {/* Product Gallery */}
          <div className="bg-white rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-800">Product Gallery</h4>
            </div>
            <ProductGallery merchantId={merchant.id} />
          </div>
          
          {!loadingRatings && ratings.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-800">Recent Reviews</h4>
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {ratings.slice(0, 5).map((rating) => (
                  <div key={rating.id} className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={rating.rating} size="sm" showCount={false} />
                      <span className="text-xs text-gray-500">
                        {formatDate(rating.created_at)}
                      </span>
                    </div>
                    {rating.review_text && (
                      <p className="text-sm text-gray-700">{rating.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200"
            >
              Edit Merchant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}