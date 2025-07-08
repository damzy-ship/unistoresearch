import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Calendar, MapPin, Store, Eye, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, RequestLog } from '../lib/supabase';
import { getUserId } from '../hooks/useTracking';
import RequestViewSimple from '../components/RequestViewSimple';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import RatingPrompt from '../components/RatingPrompt';

export default function PastRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingRequest, setViewingRequest] = useState<RequestLog | null>(null);

  useEffect(() => {
    const fetchUserRequests = async () => {
      setLoading(true);
      try {
        const userId = getUserId();
        
        const { data, error } = await supabase
          .from('request_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching user requests:', error);
        } else {
          setRequests(data || []);
        }
      } catch (error) {
        console.error('Error fetching user requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRequests();
  }, []);

  const filteredRequests = requests.filter(request =>
    request.request_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.university.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Past Requests</h1>
                <p className="text-sm text-gray-600">View your previous product searches</p>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">
                <span className="text-orange-500">uni</span>
                <span className="text-blue-800">store.</span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No matching requests found' : 'No requests yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Start by making your first product request'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
              >
                Make a Request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    {/* Request Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <MessageSquare className="w-5 h-5 text-orange-500" />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.university === 'Bingham' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        <MapPin className="w-3 h-3 mr-1" />
                        {request.university} University
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(request.created_at)}
                      </div>
                    </div>

                    {/* Request Text */}
                    <p className="text-gray-900 leading-relaxed mb-3">
                      {request.request_text}
                    </p>

                    {/* Matched Sellers Info */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm font-medium ${
                          (request.matched_seller_ids?.length || 0) > 0
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}>
                          {request.matched_seller_ids?.length || 0} seller{(request.matched_seller_ids?.length || 0) !== 1 ? 's' : ''} matched
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingRequest(request)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {requests.length > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Request Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{requests.length}</p>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.university === 'Bingham').length}
                </p>
                <p className="text-sm text-gray-600">Bingham Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.university === 'Veritas').length}
                </p>
                <p className="text-sm text-gray-600">Veritas Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => (r.matched_seller_ids?.length || 0) > 0).length}
                </p>
                <p className="text-sm text-gray-600">With Matches</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request View Modal */}
      {viewingRequest && (
        <RequestViewSimple
          request={viewingRequest}
          onClose={() => setViewingRequest(null)}
        />
      )}
      
      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp isVisible={!viewingRequest} />
      
      {/* Rating Prompt */}
      <RatingPrompt />
    </div>
  );
}