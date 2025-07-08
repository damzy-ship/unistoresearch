import React, { useState, useEffect } from 'react';
import { Star, Search, Filter, X, Check, Trash2, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CustomDialog from './CustomDialog';
import CustomAlert from './CustomAlert';
import StarRating from '../StarRating';

interface SiteReview {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  review_text?: string;
  is_featured: boolean;
  created_at: string;
}

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingReview, setDeletingReview] = useState<SiteReview | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      }

      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load reviews. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async () => {
    if (!deletingReview) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('site_reviews')
        .delete()
        .eq('id', deletingReview.id);

      if (error) {
        throw error;
      }

      setReviews(reviews.filter(review => review.id !== deletingReview.id));
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Review Deleted',
        message: 'The review has been successfully deleted.'
      });
      setDeletingReview(null);
    } catch (error) {
      console.error('Error deleting review:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to delete review. Please try again.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleFeatured = async (review: SiteReview) => {
    try {
      const { error } = await supabase
        .from('site_reviews')
        .update({ is_featured: !review.is_featured })
        .eq('id', review.id);

      if (error) {
        throw error;
      }

      // Update local state
      setReviews(reviews.map(r => 
        r.id === review.id ? { ...r, is_featured: !r.is_featured } : r
      ));

      setAlert({
        isOpen: true,
        type: 'success',
        title: review.is_featured ? 'Review Unfeatured' : 'Review Featured',
        message: `The review has been ${review.is_featured ? 'removed from' : 'added to'} featured reviews.`
      });
    } catch (error) {
      console.error('Error toggling featured status:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to update review status. Please try again.'
      });
    }
  };

  // Filter reviews based on search and filters
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchTerm || 
      review.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.review_text && review.review_text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRating = !ratingFilter || 
      (ratingFilter === '5' && review.rating === 5) ||
      (ratingFilter === '4' && review.rating === 4) ||
      (ratingFilter === '3' && review.rating === 3) ||
      (ratingFilter === '2' && review.rating === 2) ||
      (ratingFilter === '1' && review.rating === 1);
    
    const matchesFeatured = !featuredFilter || 
      (featuredFilter === 'featured' && review.is_featured) ||
      (featuredFilter === 'not-featured' && !review.is_featured);
    
    return matchesSearch && matchesRating && matchesFeatured;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRatingFilter('');
    setFeaturedFilter('');
  };

  const activeFiltersCount = [ratingFilter, featuredFilter].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Site Reviews</h2>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search reviews by user name or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Filter Toggle and Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {(searchTerm || activeFiltersCount > 0) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}

          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-1" />
                  Rating
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Featured Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="w-4 h-4 inline mr-1" />
                  Featured Status
                </label>
                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  <option value="">All Reviews</option>
                  <option value="featured">Featured Only</option>
                  <option value="not-featured">Not Featured</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600">
              {searchTerm || activeFiltersCount > 0 
                ? 'Try adjusting your filters or search terms' 
                : 'No reviews have been submitted yet'
              }
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
                review.is_featured ? 'border-yellow-300 bg-yellow-50' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Review Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{review.user_name}</h3>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="sm" showCount={false} />
                        <span className="text-xs text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  {review.review_text && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-2">
                      <p className="text-gray-700 italic">"{review.review_text}"</p>
                    </div>
                  )}

                  {/* Featured Badge */}
                  {review.is_featured && (
                    <div className="flex items-center gap-2 text-yellow-700 text-sm">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span>Featured review</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2">
                  <button
                    onClick={() => handleToggleFeatured(review)}
                    className={`p-2 rounded-lg transition-colors ${
                      review.is_featured
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={review.is_featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    {review.is_featured ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Award className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeletingReview(review)}
                    className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={!!deletingReview}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDeleteReview}
        title="Delete Review"
        message={`Are you sure you want to delete this review from ${deletingReview?.user_name}? This action cannot be undone.`}
        confirmText="Delete Review"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      {/* Alert Dialog */}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
}