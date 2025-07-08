import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../hooks/useTracking';
import toast from 'react-hot-toast';

export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please enter a review');
      return;
    }

    setSubmitting(true);

    try {
      const userId = await getUserId();
      
      // Get user's name from unique_visitors
      const { data: userData } = await supabase
        .from('unique_visitors')
        .select('full_name')
        .eq('user_id', userId)
        .single();
      
      const userName = userData?.full_name || 'Anonymous User';
      
      // Insert the review
      const { error } = await supabase
        .from('site_reviews')
        .insert({
          user_id: userId,
          user_name: userName,
          rating,
          review_text: reviewText.trim(),
          is_featured: false // Admin will set this to true to feature it
        });

      if (error) {
        throw error;
      }

      toast.success('Thank you for your review! It will be reviewed by our team.');
      setRating(0);
      setReviewText('');
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-3">
            How would you rate your experience with UniStore?
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
                disabled={submitting}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share your experience
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
            rows={3}
            placeholder="Tell us about your experience with UniStore..."
            maxLength={500}
            disabled={submitting}
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {reviewText.length}/500 characters
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || rating === 0 || !reviewText.trim()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}