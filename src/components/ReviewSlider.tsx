import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';


interface Review {
  id: string;
  user_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

export default function ReviewSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const {currentTheme} = useTheme()
  

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_reviews')
          .select('*')
          .eq('is_featured', true)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // If no featured reviews, get the most recent ones
        if (!data || data.length === 0) {
          const { data: recentData, error: recentError } = await supabase
            .from('site_reviews')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

          if (recentError) {
            throw recentError;
          }

          setReviews(recentData || []);
        } else {
          setReviews(data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  useEffect(() => {
    // Auto-play functionality
    if (reviews.length > 1) {
      autoPlayRef.current = setInterval(() => {
        goToNextSlide();
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [reviews, currentIndex]);

  const goToNextSlide = () => {
    if (isAnimating || reviews.length <= 1) return;
    
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
    
    // Reset animation state after transition
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const goToPrevSlide = () => {
    if (isAnimating || reviews.length <= 1) return;
    
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length);
    
    // Reset animation state after transition
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 style={{ color: currentTheme.text }} className="text-xl font-bold mb-2">What your fellow students are saying...</h3>
        <p className="text-gray-600">No reviews available yet.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden py-8">
      <h3 style={{ color: currentTheme.text }} className="text-2xl font-bold text-center mb-8">What your fellow students are saying...</h3>
      
      <div className="relative max-w-3xl mx-auto px-4">
        {/* Navigation Arrows (only show if more than one review) */}
        {reviews.length > 1 && (
          <>
            <button
              onClick={goToPrevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-all"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={goToNextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-all"
              aria-label="Next review"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
        
        {/* Reviews Slider */}
        <div className="overflow-hidden">
          <div 
            className=" flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="w-full flex-shrink-0 px-4"
              >
                <div  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${currentTheme.buttonGradient}  rounded-full flex items-center justify-center text-white font-bold text-xl mb-3`}>
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">{review.user_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {review.review_text && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-700 italic text-center">"{review.review_text}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Dots Indicator (only show if more than one review) */}
        {reviews.length > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setCurrentIndex(index);
                    setTimeout(() => setIsAnimating(false), 500);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? `bg-${currentTheme.primaryTsFormat} w-4` 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}