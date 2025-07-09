import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Calendar, MapPin, Store, Eye, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, RequestLog } from '../lib/supabase';
import { getUserId } from '../hooks/useTracking';
import RequestViewSimple from '../components/RequestViewSimple';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import RatingPrompt from '../components/RatingPrompt';
import { useTheme } from '../hooks/useTheme';

export default function PastRequestsPage() {
  const navigate = useNavigate();
  const { currentTheme, backgroundTexture } = useTheme();
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
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: currentTheme.surface }}
    >
   
      {/* Header */}
      <div 
        className="relative z-10 shadow-sm border-b transition-colors duration-300"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="transition-colors"
                style={{ color: currentTheme.textSecondary }}
                onMouseEnter={(e) => e.currentTarget.style.color = currentTheme.text}
                onMouseLeave={(e) => e.currentTarget.style.color = currentTheme.textSecondary}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 
                  className="text-xl sm:text-2xl font-bold"
                  style={{ color: currentTheme.text }}
                >
                  Past Requests
                </h1>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  View your previous product searches
                </p>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">
                <span style={{ color: currentTheme.primary }}>uni</span>
                <span style={{ color: currentTheme.secondary }}>store.</span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
            {/* Background texture overlay */}
       {backgroundTexture.id !== 'none' && (
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: backgroundTexture.pattern,
            backgroundSize: backgroundTexture.id === 'grid' ? '20px 20px' : '30px 30px',
            opacity: backgroundTexture.opacity,
            color: currentTheme.textSecondary
          }}
        />
      )}
        <div className="mb-6">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              style={{ color: currentTheme.textSecondary }}
            />
            <input
              type="text"
              placeholder="Search your requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition-colors"
              style={{
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                focusBorderColor: currentTheme.primary
              }}
            />
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare 
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: currentTheme.textSecondary }}
            />
            <h3 
              className="text-lg font-semibold mb-2"
              style={{ color: currentTheme.text }}
            >
              {searchTerm ? 'No matching requests found' : 'No requests yet'}
            </h3>
            <p 
              className="mb-4"
              style={{ color: currentTheme.textSecondary }}
            >
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Start by making your first product request'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/')}
                className={`bg-gradient-to-r ${currentTheme.buttonGradient} text-white px-6 py-3 rounded-xl font-medium transition-all duration-200`}
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
                className="rounded-xl p-6 shadow-sm border hover:shadow-md transition-all duration-300"
                style={{ backgroundColor: currentTheme.background }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    {/* Request Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <MessageSquare 
                        className="w-5 h-5"
                        style={{ color: currentTheme.primary }}
                      />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.university === 'Bingham' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        <MapPin className="w-3 h-3 mr-1" />
                        {request.university} University
                      </span>
                      <div 
                        className="flex items-center gap-1 text-sm"
                        style={{ color: currentTheme.textSecondary }}
                      >
                        <Calendar className="w-4 h-4" />
                        {formatDate(request.created_at)}
                      </div>
                    </div>

                    {/* Request Text */}
                    <p 
                      className="leading-relaxed mb-3"
                      style={{ color: currentTheme.text }}
                    >
                      {request.request_text}
                    </p>

                    {/* Matched Sellers Info */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Store 
                          className="w-4 h-4"
                          style={{ color: currentTheme.textSecondary }}
                        />
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
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{ 
                        backgroundColor: currentTheme.primary + '10',
                        color: currentTheme.primary
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.primary + '20'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.primary + '10'}
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
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: currentTheme.text }}
            >
              Your Request Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p 
                  className="text-2xl font-bold"
                  style={{ color: currentTheme.primary }}
                >
                  {requests.length}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  Total Requests
                </p>
              </div>
              <div className="text-center">
                <p 
                  className="text-2xl font-bold"
                  style={{ color: currentTheme.secondary }}
                >
                  {requests.filter(r => r.university === 'Bingham').length}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  Bingham Requests
                </p>
              </div>
              <div className="text-center">
                <p 
                  className="text-2xl font-bold"
                  style={{ color: currentTheme.secondary }}
                >
                  {requests.filter(r => r.university === 'Veritas').length}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  Veritas Requests
                </p>
              </div>
              <div className="text-center">
                <p 
                  className="text-2xl font-bold"
                  style={{ color: currentTheme.accent }}
                >
                  {requests.filter(r => (r.matched_seller_ids?.length || 0) > 0).length}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.textSecondary }}
                >
                  With Matches
                </p>
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