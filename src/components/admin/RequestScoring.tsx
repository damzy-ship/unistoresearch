import React, { useState, useEffect } from 'react';
import { X, Star, Save, Info } from 'lucide-react';
import { RequestLog, supabase } from '../../lib/supabase';
import { MerchantWithCategories } from '../../lib/gemini';
import CustomAlert from './CustomAlert';

interface RequestScoringProps {
  request: RequestLog;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestScoring({ request, onClose, onSuccess }: RequestScoringProps) {
  const [matchedSellers, setMatchedSellers] = useState<MerchantWithCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    const fetchRequestData = async () => {
      setLoading(true);
      try {
        // Load existing scores and notes
        const existingScores = (request as any).admin_scores || {};
        const existingNotes = (request as any).admin_notes || '';
        setScores(existingScores);
        setNotes(existingNotes);

        // Fetch matched sellers if any
        if (!request.matched_seller_ids || request.matched_seller_ids.length === 0) {
          setLoading(false);
          return;
        }

        const { data: merchants, error } = await supabase
          .from('merchants')
          .select(`
            *,
            average_rating,
            total_ratings,
            rating_breakdown
          `)
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
            .select(`
              product_categories (
                name
              )
            `)
            .eq('merchant_id', merchant.id);

          const categories = merchantCategories?.map((item: any) => item.product_categories?.name).filter(Boolean) || [];

          sellersWithCategories.push({
            ...merchant,
            categories,
            average_rating: merchant.average_rating || 0,
            total_ratings: merchant.total_ratings || 0,
            rating_breakdown: merchant.rating_breakdown || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
          });
        }

        // Sort by the original ranking order if available
        const rankingOrder = (request as any).seller_ranking_order || request.matched_seller_ids || [];
        const sortedSellers = sellersWithCategories.sort((a, b) => {
          const indexA = rankingOrder.indexOf(a.seller_id);
          const indexB = rankingOrder.indexOf(b.seller_id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        setMatchedSellers(sortedSellers);

        // Initialize scores for new sellers
        const newScores = { ...existingScores };
        sortedSellers.forEach(seller => {
          if (!(seller.seller_id in newScores)) {
            newScores[seller.seller_id] = 0;
          }
        });
        setScores(newScores);

      } catch (error) {
        console.error('Error fetching request data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, [request]);

  const handleScoreChange = (sellerId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [sellerId]: score
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('request_logs')
        .update({
          admin_scores: scores,
          admin_notes: notes.trim() || null
        })
        .eq('id', request.id);

      if (error) {
        throw error;
      }

      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Scores Saved',
        message: 'Admin scores and notes have been successfully saved.'
      });

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (error) {
      console.error('Error saving scores:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error Saving Scores',
        message: 'Failed to save scores. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Score Request Recommendations</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Request Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Request</p>
              <p className="text-gray-900">{request.request_text}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">University</p>
              <p className="text-gray-900">{request.university} University</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Date</p>
              <p className="text-gray-900">{formatDate(request.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Matched Sellers</p>
              <p className="text-gray-900">{request.matched_seller_ids?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Request Analysis */}
        {(request as any).generated_categories && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Request Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-800 mb-2">Generated Categories</p>
                <div className="flex flex-wrap gap-1">
                  {((request as any).generated_categories || []).map((cat: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium text-blue-800 mb-2">Matched Categories</p>
                <div className="flex flex-wrap gap-1">
                  {((request as any).matched_categories || []).map((cat: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium text-blue-800 mb-2">Ranking Order</p>
                <div className="text-xs text-blue-700">
                  {((request as any).seller_ranking_order || []).length > 0 
                    ? 'Preserved from AI algorithm' 
                    : 'Default order'}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-sm text-gray-600">Loading sellers...</span>
          </div>
        ) : matchedSellers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No matched sellers to score</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sellers Scoring */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Score Each Recommendation (1-10)</h4>
              <div className="space-y-4">
                {matchedSellers.map((seller, index) => (
                  <div key={seller.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <div className={`w-10 h-10 rounded-full ${getInitialsColor(seller.full_name)} flex items-center justify-center text-white font-bold text-sm`}>
                            {getInitials(seller.full_name)}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{seller.full_name}</h5>
                          <p className="text-sm text-gray-600">{seller.seller_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleScoreChange(seller.seller_id, score)}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                              scores[seller.seller_id] === score
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Seller Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {seller.categories.map((cat, catIndex) => (
                            <span key={catIndex} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Rating</p>
                        <p className="text-gray-600">
                          {seller.average_rating > 0 
                            ? `${seller.average_rating.toFixed(1)}⭐ (${seller.total_ratings} reviews)`
                            : 'No ratings yet'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                rows={3}
                placeholder="Add notes about this request and recommendations..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Scores
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Alert Dialog */}
        <CustomAlert
          isOpen={alert.isOpen}
          onClose={() => setAlert({ ...alert, isOpen: false })}
          type={alert.type}
          title={alert.title}
          message={alert.message}
        />
      </div>
    </div>
  );
}