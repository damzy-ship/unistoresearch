import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Calendar, MessageSquare, Store, Phone, Mail, Tag, Copy } from 'lucide-react';
import { RequestLog, supabase } from '../../lib/supabase';
import { MerchantWithCategories } from '../../lib/gemini';

interface RequestViewProps {
  request: RequestLog;
  onClose: () => void;
}

export default function RequestView({ request, onClose }: RequestViewProps) {
  const [matchedSellers, setMatchedSellers] = useState<MerchantWithCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: visitor, error } = await supabase
          .from('unique_visitors')
          .select('phone_number')
          .eq('user_id', request.user_id)
          .limit(1);

        if (error) {
          console.error('Error fetching user info:', error);
        } else {
          setUserPhoneNumber((visitor && visitor.length > 0) ? visitor[0].phone_number : null);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setLoadingUserInfo(false);
      }
    };

    fetchUserInfo();

    const fetchMatchedSellers = async () => {
      if (!request.matched_seller_ids || request.matched_seller_ids.length === 0) {
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
            .select(`
              product_categories (
                name
              )
            `)
            .eq('merchant_id', merchant.id);

          const categories = merchantCategories?.map((item: any) => item.product_categories?.name).filter(Boolean) || [];

          sellersWithCategories.push({
            ...merchant,
            categories
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
      } catch (error) {
        console.error('Error fetching matched sellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedSellers();
  }, [request.matched_seller_ids]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleContactSeller = (seller: MerchantWithCategories) => {
    const message = `Hi! I'm looking for the following from ${request.university} University: ${request.request_text}`;
    const whatsappUrl = `https://wa.me/${seller.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyPhone = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
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
          {/* Request Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800">Request Information</h4>
            </div>
            <div className="space-y-3">
              {/* Request Analysis */}
              {((request as any).generated_categories || (request as any).matched_categories) && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h5 className="text-sm font-medium text-gray-600 mb-3">AI Analysis</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(request as any).generated_categories && (
                      <div>
                        <p className="text-xs font-medium text-blue-600 mb-2">Generated Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {(request as any).generated_categories.map((cat: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(request as any).matched_categories && (
                      <div>
                        <p className="text-xs font-medium text-green-600 mb-2">Matched Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {(request as any).matched_categories.map((cat: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-4 shadow-sm hidden md:block">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">User ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg flex-1">
                    {request.user_id}
                  </span>
                  <button
                    onClick={() => handleCopyUserId(request.user_id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy User ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">User Phone Number</span>
                </div>
                {loadingUserInfo ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                ) : userPhoneNumber ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      {userPhoneNumber}
                    </span>
                    <button
                      onClick={() => handleCopyPhone(userPhoneNumber)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy phone number"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                    Not provided
                  </span>
                )}
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">University</span>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    request.university === 'Bingham' 
                      ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {request.university} University
                  </span>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">Request Date</span>
                </div>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{formatDate(request.created_at)}</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">Request Details</span>
                </div>
                <p className="text-gray-800 leading-relaxed font-medium bg-gray-50 p-4 rounded-lg">
                  {request.request_text}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Scoring Info */}
          {(request as any).admin_scores && (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-3">Admin Scoring</h4>
              <div className="space-y-2">
                {Object.entries((request as any).admin_scores).map(([sellerId, score]) => (
                  <div key={sellerId} className="flex justify-between items-center">
                    <span className="text-sm text-yellow-700">{sellerId}</span>
                    <span className="text-sm font-medium text-yellow-800">Score: {score}/10</span>
                  </div>
                ))}
              </div>
              {(request as any).admin_notes && (
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <p className="text-sm text-yellow-700">
                    <span className="font-medium">Notes:</span> {(request as any).admin_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Matched Sellers */}
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
                <span className="ml-3 text-sm text-gray-600">Loading sellers...</span>
              </div>
            ) : matchedSellers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No sellers were matched to this request</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matchedSellers.map((seller, index) => (
                  <div
                    key={seller.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors"
                  >
                    {/* Seller Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        {/* Profile Picture with Initials */}
                        <div className={`w-10 h-10 rounded-full ${getInitialsColor(seller.full_name)} flex items-center justify-center text-white font-bold text-xs`}>
                          {getInitials(seller.full_name)}
                        </div>
                        <h5 className="font-semibold text-gray-900">{seller.full_name}</h5>
                      </div>
                    
                    </div>

                    {/* Seller Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Categories</p>
                        {seller.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {seller.categories.map((cat, catIndex) => (
                              <span key={catIndex} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                {cat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No categories</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Admin Score</p>
                        {(request as any).admin_scores?.[seller.seller_id] ? (
                          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                            {(request as any).admin_scores[seller.seller_id]}/10
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Not scored</span>
                        )}
                      </div>
                    </div>

                    {/* Seller Categories from Request Data */}
                    {(request as any).seller_categories?.[seller.seller_id] && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">Categories at time of match</p>
                        <div className="flex flex-wrap gap-1">
                          {(request as any).seller_categories[seller.seller_id].map((cat: string, catIndex: number) => (
                            <span key={catIndex} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Button */}
                    <div className="flex justify-center md:justify-end">
                      <button
                        onClick={() => handleContactSeller(seller)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 w-full md:w-fit"
                      >
                        Contact via WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}