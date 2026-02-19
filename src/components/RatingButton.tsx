import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { getUserRating } from '../lib/ratingService';
import RatingModal from './RatingModal';

interface RatingButtonProps {
  merchantId: string;
  merchantName: string;
  requestId?: string;
  requestText?: string;
  className?: string;
}

export default function RatingButton({
  merchantId,
  merchantName,
  requestId,
  requestText,
  className = ''
}: RatingButtonProps) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState<any>(null);
  const [canRate, setCanRate] = useState(false);
  const [canCancel, setCanCancel] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRatingStatus = async () => {
      setLoading(true);
      const result = await getUserRating(merchantId, requestId);
      setUserRating(result.rating);
      setCanRate(result.canRate);
      setCanCancel(result.canCancel);
      setLoading(false);
    };

    checkRatingStatus();
  }, [merchantId, requestId]);

  const handleRatingSuccess = () => {
    // Refresh rating status
    const refreshStatus = async () => {
      const result = await getUserRating(merchantId, requestId);
      setUserRating(result.rating);
      setCanRate(result.canRate);
      setCanCancel(result.canCancel);
    };
    refreshStatus();
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg h-8 w-20 ${className}`} />
    );
  }

  // Don't show button if user can't rate and hasn't rated
  if (!canRate && !userRating && !canCancel) {
    return null;
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {canRate && (
          <button
            onClick={() => setShowRatingModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg font-medium transition-colors"
          >
            <Star className="w-4 h-4" />
            <span className="text-sm">
              {userRating ? 'Update Rating' : 'Rate Seller'}
            </span>
          </button>
        )}
        
        {userRating && !canRate && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm">Rated {userRating.rating}★</span>
          </div>
        )}
      </div>

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        merchantName={merchantName}
        merchantId={merchantId}
        requestId={requestId}
        requestText={requestText}
        existingRating={userRating}
        canCancel={canCancel}
        onSuccess={handleRatingSuccess}
      />
    </>
  );
}