import { useState, useEffect } from 'react';
import { X, MapPin, MessageSquare, Store } from 'lucide-react';
import { RequestLog, supabase } from '../lib/supabase';
import { MerchantWithCategories } from '../lib/gemini';
import { isAuthenticated } from '../hooks/useTracking';
import AuthModal from './AuthModal';
import StarRating from './StarRating';
import { trackContactInteraction } from '../lib/ratingService';
import RatingButton from './RatingButton';

interface RequestViewSimpleProps {
  request: RequestLog;
  onClose: () => void;
}

export default function RequestViewSimple({
  request,
  onClose,
}: RequestViewSimpleProps) {
  const [matchedSellers, setMatchedSellers] = useState<
    MerchantWithCategories[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSeller, setPendingSeller] =
    useState<MerchantWithCategories | null>(null);

  useEffect(() => {
    // No need to check request count on component mount
  }, []);

  useEffect(() => {
    const fetchMatchedSellers = async () => {
      if (
        !request.matched_seller_ids ||
        request.matched_seller_ids.length === 0
      ) {
        setLoading(false);
        return;
      }

      try {
        // Fetch merchants by seller IDs
        const { data: merchants, error } = await supabase
          .from('merchants')
          .select('*')
          .in('seller_id', request.matched_seller_ids);

        if (error) {
          console.error('Error fetching matched sellers:', error);
          setLoading(false);
          return;
        }

        if (!merchants || merchants.length === 0) {
          setLoading(false);
          return;
        }

        // Get categories for each merchant
        const sellersWithCategories: MerchantWithCategories[] = [];

        for (const merchant of merchants) {
          const { data: merchantCategories } = await supabase
            .from('merchant_categories')
            .select(
              `
              product_categories (
                name
              )
            `
            )
            .eq('merchant_id', merchant.id);

          const categories =
            merchantCategories
              ?.map((item: any) => item.product_categories?.name)
              .filter(Boolean) || [];

          sellersWithCategories.push({
            ...merchant,
            categories,
          });
        }

        // Sort by the original ranking order if available
        const rankingOrder =
          (request as any).seller_ranking_order ||
          request.matched_seller_ids ||
          [];
        const sortedSellers = sellersWithCategories.sort((a, b) => {
          const indexA = rankingOrder.indexOf(a.seller_id);
          const indexB = rankingOrder.indexOf(b.seller_id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        setMatchedSellers(sortedSellers);
      } catch (error) {
        console.error('Error fetching matched sellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedSellers();
  }, [request.matched_seller_ids]);

  const handleContactSeller = async (seller: MerchantWithCategories) => {
    // Check if user is already authenticated
    const userAuthenticated = await isAuthenticated();
    if (!userAuthenticated) {
      setPendingSeller(seller);
      setShowAuthModal(true);
      return;
    }

    // Proceed with contact
    contactSeller(seller);
  };

  const contactSeller = async (seller: MerchantWithCategories) => {
    // Track the contact interaction for rating prompts
    await trackContactInteraction(seller.id, request.id);

    const message = `Hi! I'm looking for the following from ${request.university} University: ${request.request_text}`;
    const whatsappUrl = `https://wa.me/${seller.phone_number.replace(
      /[^0-9]/g,
      ''
    )}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAuthSuccess = () => {
    if (pendingSeller) {
      contactSeller(pendingSeller);
      setPendingSeller(null);
    }
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    setPendingSeller(null);
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((name) => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getInitialsColor = (fullName: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const index = fullName.length % colors.length;
    return colors[index];
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Request Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Request Information - Beautified */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  Your Request
                </h4>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">
                      University
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      request.university === 'Bingham'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {request.university} University
                  </span>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Request Details
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed font-medium">
                    {request.request_text}
                  </p>
                </div>
              </div>
            </div>

            {/* Matched Sellers - Simplified */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  Matched Sellers ({request.matched_seller_ids?.length || 0})
                </h4>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12 bg-gray-50 rounded-xl">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-sm text-gray-600">
                    Loading sellers...
                  </span>
                </div>
              ) : matchedSellers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    No sellers were matched to this request
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedSellers.reverse().map((seller) => (
                    <div
                      key={seller.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                    >
                      {/* Seller Info */}
                      <div className="space-y-4">
                        {/* Header with name and university */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Profile Picture with Initials */}
                            <div
                              className={`w-12 h-12 rounded-full ${getInitialsColor(
                                seller.full_name
                              )} flex items-center justify-center text-white font-bold text-sm`}
                            >
                              {getInitials(seller.full_name)}
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 text-lg">
                                {seller.full_name}
                              </h5>
                              {(seller.total_ratings || 0) > 0 && (
                                <StarRating
                                  rating={seller.average_rating || 0}
                                  totalRatings={seller.total_ratings}
                                  size="sm"
                                  className="mt-1"
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Categories */}
                        {seller.categories && seller.categories.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                {seller.full_name} sells:
                              </span>{' '}
                              {seller.categories.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Contact Button */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-end pt-2">
                          <RatingButton
                            merchantId={seller.id}
                            merchantName={seller.full_name}
                            requestId={request.id}
                            requestText={request.request_text}
                            className="order-2 sm:order-1"
                          />
                          <button
                            onClick={() => handleContactSeller(seller)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg w-full md:w-fit order-1 sm:order-2"
                          >
                            Contact via WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-center pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phone Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
