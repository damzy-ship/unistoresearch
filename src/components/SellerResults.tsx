import React, { useState, useEffect } from 'react';
import { Store, MapPin, ExternalLink, Award } from 'lucide-react';
import { MerchantWithCategories } from '../lib/gemini';
import { getUserRequestCount, isAuthenticated } from '../hooks/useTracking';
import AuthModal from './AuthModal';
import StarRating from './StarRating';
import { trackContactInteraction } from '../lib/ratingService';
import RatingButton from './RatingButton';

interface SellerResultsProps {
  sellers: MerchantWithCategories[];
  isLoading: boolean;
  requestText: string;
  university: string;
  requestId?: string;
}

export default function SellerResults({ sellers, isLoading, requestText, university, requestId }: SellerResultsProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSeller, setPendingSeller] = useState<MerchantWithCategories | null>(null);

  useEffect(() => {
    // No need to check request count on component mount
  }, []);

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
    await trackContactInteraction(seller.id, requestId);
    
    const message = `Hi! I'm looking for the following from ${university} University: ${requestText}`;
    const whatsappUrl = `https://wa.me/${seller.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
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
      .map(name => name.charAt(0).toUpperCase())
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
      'bg-teal-500'
    ];
    const index = fullName.length % colors.length;
    return colors[index];
  };

  const isTopRated = (seller: MerchantWithCategories) => {
    return (seller.average_rating || 0) >= 4.5 && (seller.total_ratings || 0) >= 10;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Finding sellers for you...</span>
          </div>
        </div>
      </div>
    );
  }

  if (sellers.length === 0) {
    return (
      <div className="w-full max-w-2xl mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="text-center py-8">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sellers found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any sellers matching your request at the moment.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  const phoneNumber = "2349060859789";
                  const message = `Hi! I'm looking for the following from ${university} University: ${requestText}`;
                  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, "_blank");
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Contact us directly
              </button>
              
              <div className="text-center">
                <span className="text-sm text-gray-500">or</span>
              </div>
              
              <button
                onClick={() => window.open("https://unistore.ng", "_blank")}
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Browse all university vendors
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-2xl mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Found {sellers.length} seller{sellers.length !== 1 ? 's' : ''} for you
            </h3>
            <p className="text-sm text-gray-600">
              These sellers offer products that match your request
            </p>
          </div>

          <div className="space-y-4">
            {sellers.map((seller) => (
              <div
                key={seller.id}
                className="border border-gray-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${getInitialsColor(seller.full_name)} flex items-center justify-center text-white font-bold text-sm`}>
                        {getInitials(seller.full_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-lg">{seller.full_name}</h4>
                          {isTopRated(seller) && (
                            <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              <Award className="w-3 h-3" />
                              Top Rated
                            </div>
                          )}
                        </div>
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

                  {seller.categories && seller.categories.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{seller.full_name} sells:</span>{' '}
                        {seller.categories.join(', ')}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-end pt-2">
                    <RatingButton
                      merchantId={seller.id}
                      merchantName={seller.full_name}
                      requestId={requestId}
                      requestText={requestText}
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

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <button
              onClick={() => window.open("https://unistore.ng", "_blank")}
              className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View more products from university vendors
            </button>
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