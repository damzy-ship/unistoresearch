import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../hooks/useTracking';
import toast from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';

export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { currentTheme } = useTheme();

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
    <div className="w-full max-w-2xl mx-auto relative">
      {/* Animated Border Effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary}, ${currentTheme.accent}, ${currentTheme.primary})`,
            backgroundSize: '400% 400%',
            animation: 'neon-border 3s ease-in-out infinite',
            padding: '2px'
          }}
        >
          <div 
            className="w-full h-full rounded-2xl"
            style={{ backgroundColor: currentTheme.surface }}
          />
        </div>
      </div>

      {/* Neon Glow Effect */}
      <div 
        className="absolute inset-0 rounded-2xl blur-xl opacity-30"
        style={{
          background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary}, ${currentTheme.accent})`,
          backgroundSize: '400% 400%',
          animation: 'neon-glow 4s ease-in-out infinite'
        }}
      />

      {/* Form Content */}
      <div className="relative z-10 p-8 rounded-2xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg animate-bounce"
              style={{ 
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`
              }}
            >
              <Star className="w-8 h-8 text-white fill-current" />
            </div>
          </div>
          <h3 
            className="text-2xl font-bold mb-2 animate-fade-in"
            style={{ color: currentTheme.text }}
          >
            Share Your Experience
          </h3>
          <p 
            className="animate-fade-in"
            style={{ color: currentTheme.textSecondary }}
          >
            Help fellow students discover UniStore
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          

          <div className="relative">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className={`w-full px-6 py-4 border-2 rounded-2xl resize-none transition-all duration-300 focus:scale-105 transform focus:ring-2 focus:border-transparent`}
              style={{
                backgroundColor: currentTheme.background,
                borderColor: rating > 0 ? currentTheme.primary : currentTheme.textSecondary + '30',
                color: currentTheme.text,
                boxShadow: rating > 0 ? `0 0 20px ${currentTheme.primary}20` : undefined,
                // focusRingColor: currentTheme.primary
              }}
              rows={4}
              placeholder="Tell us about your experience with UniStore..."
              maxLength={500}
              disabled={submitting}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <div 
                className="text-xs animate-pulse"
                style={{ color: currentTheme.textSecondary }}
              >
                {reviewText.length}/500 characters
              </div>
              {reviewText.length > 0 && (
                <div 
                  className="text-xs font-medium animate-bounce"
                  style={{ color: currentTheme.primary }}
                >
                  Looking great! ✨
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-2 transition-all duration-200 hover:scale-125 transform"
                  disabled={submitting}
                >
                  <Star
                    className={`w-10 h-10 transition-all duration-200 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current drop-shadow-lg'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                    style={{
                      filter: star <= (hoveredRating || rating) 
                        ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' 
                        : undefined
                    }}
                  />
                </button>
              ))}
            </div>
            <div 
              className="text-sm font-medium animate-bounce"
              style={{ color: currentTheme.textSecondary }}
            >
              {rating === 0 && 'Click to rate your experience'}
              {rating === 1 && '⭐ Poor - We can do better!'}
              {rating === 2 && '⭐⭐ Fair - Room for improvement'}
              {rating === 3 && '⭐⭐⭐ Good - Pretty satisfied'}
              {rating === 4 && '⭐⭐⭐⭐ Very Good - Really enjoyed it!'}
              {rating === 5 && '⭐⭐⭐⭐⭐ Excellent - Absolutely amazing!'}
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={submitting || rating === 0 || !reviewText.trim()}
              className={`relative overflow-hidden bg-gradient-to-r ${currentTheme.buttonGradient} ${currentTheme.buttonGradientHover} text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:opacity-50 transform hover:scale-105 shadow-2xl`}
              style={{
                boxShadow: `0 10px 30px ${currentTheme.primary}40`,
                animation: rating > 0 && reviewText.trim() ? 'pulse-glow 2s ease-in-out infinite' : undefined
              }}
            >
              {/* Button Background Animation */}
              <div 
                className="absolute inset-0 bg-gradient-to-r opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary}, ${currentTheme.accent})`,
                  backgroundSize: '400% 400%',
                  animation: 'gradient-shift 3s ease infinite'
                }}
              />
              
              <div className="relative z-10 flex items-center justify-center gap-3">
                {submitting ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="animate-pulse">Submitting Your Review...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6 animate-bounce" />
                    <span>Submit Review</span>
                    <div className="ml-2 animate-ping w-2 h-2 bg-white rounded-full" />
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes neon-border {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes neon-glow {
          0%, 100% { 
            background-position: 0% 50%;
            transform: scale(1);
          }
          50% { 
            background-position: 100% 50%;
            transform: scale(1.02);
          }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 10px 30px ${currentTheme.primary}40;
          }
          50% { 
            box-shadow: 0 15px 40px ${currentTheme.primary}60;
          }
        }
      `}</style>
    </div>
  );
}