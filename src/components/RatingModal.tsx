import React, { useState, useEffect } from 'react';
import { X, Star, Send, Trash2 } from 'lucide-react';
import { submitRating, cancelRating, RatingData } from '../lib/ratingService';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantName: string;
  merchantId: string;
  requestId?: string;
  requestText?: string;
  existingRating?: any;
  canCancel?: boolean;
  onSuccess?: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  merchantName,
  merchantId,
  requestId,
  requestText,
  existingRating,
  canCancel = false,
  onSuccess
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  // Load existing rating data when modal opens
  useEffect(() => {
    if (isOpen && existingRating) {
      setRating(existingRating.rating);
      setReviewText(existingRating.review_text || '');
    } else if (isOpen) {
      setRating(0);
      setReviewText('');
    }
    setError('');
  }, [isOpen, existingRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    const ratingData: RatingData = {
      rating,
      review_text: reviewText.trim() || undefined
    };

    const result = await submitRating(merchantId, ratingData, requestId);

    if (result.success) {
      onSuccess?.();
      onClose();
      // Reset form
      setRating(0);
      setReviewText('');
    } else {
      setError(result.error || 'Failed to submit rating');
    }

    setSubmitting(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError('');

    const result = await cancelRating(merchantId, requestId);

    if (result.success) {
      onSuccess?.();
      onClose();
      setRating(0);
      setReviewText('');
    } else {
      setError(result.error || 'Failed to cancel rating');
    }

    setCancelling(false);
  };

  const handleClose = () => {
    if (!submitting && !cancelling) {
      setRating(0);
      setReviewText('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {existingRating ? 'Update Your Rating' : 'Rate Your Experience'}
          </h3>
          <button
            onClick={handleClose}
            disabled={submitting || cancelling}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="text-center mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">{merchantName}</h4>
            {requestText && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                "{requestText}"
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">
              How was your experience with this seller?
            </p>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  disabled={submitting || cancelling}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              {rating === 0 && 'Click to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your experience (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
              rows={3}
              placeholder="Tell others about your experience with this seller..."
              maxLength={500}
              disabled={submitting || cancelling}
            />
            <div className="text-xs text-gray-500 mt-1">
              {reviewText.length}/500 characters
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting || cancelling}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            {canCancel && existingRating && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting || cancelling}
                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Cancel Rating
                  </>
                )}
              </button>
            )}
            
            <button
              type="submit"
              disabled={submitting || cancelling || rating === 0}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {existingRating ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {existingRating ? 'Update Rating' : 'Submit Rating'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}