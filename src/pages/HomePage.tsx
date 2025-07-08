import React, { useState } from 'react';
import { Send, ArrowLeft, History } from 'lucide-react';
import { useTracking, isAuthenticated } from '../hooks/useTracking';
import { findMerchantsForRequest, MerchantWithCategories } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';
import SellerResults from '../components/SellerResults';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import ReviewSlider from '../components/ReviewSlider';
import UniversitySelector from '../components/UniversitySelector';
import RatingPrompt from '../components/RatingPrompt';
import UserGreeting from '../components/UserGreeting';
import AuthModal from '../components/AuthModal';
import UserMenu from '../components/UserMenu';
import BoltBadge from '../components/BoltBadge';
import Header from '../components/Header';
import ReviewForm from '../components/ReviewForm';
import { Toaster } from 'react-hot-toast';

export default function HomePage() {
  const navigate = useNavigate();
  const [request, setRequest] = useState("");
  const [university, setUniversity] = useState("Bingham");
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedSellers, setMatchedSellers] = useState<MerchantWithCategories[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { trackRequest } = useTracking();
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setUserIsAuthenticated(authenticated);
    };
    
    checkAuth();
  }, []);

  const handleSearchRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!request.trim()) return;

    // Check if user is authenticated
    const userAuthenticated = await isAuthenticated();
    if (!userAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    setShowRetryPrompt(false);

    try {
      // Use AI-powered merchant matching from Gemini
      const universityName = university === "Bingham" ? "Bingham University" : 
                            university === "Veritas" ? "Veritas University" : 
                            `${university} University`;
      
      const matchResult = await findMerchantsForRequest(request, universityName, 5);
      
      if (!matchResult.success) {
        console.log('AI merchant matching failed:', matchResult.error);
        setMatchedSellers([]);
        const requestResult = await trackRequest(university, request, [], {
          generatedCategories: matchResult.generatedCategories || [],
          matchedCategories: matchResult.matchedCategories || [],
          sellerCategories: matchResult.sellerCategories || {},
          sellerRankingOrder: []
        });
        setCurrentRequestId(requestResult?.id || null);
        setIsSearching(false);
        setShowRetryPrompt(true);
        return;
      }
      
      const sellers = matchResult.merchants;
      const matchedSellerIds = sellers.map(seller => seller.seller_id);
      const sellerRankingOrder = sellers.map(seller => seller.seller_id);
      
      console.log('Found sellers:', sellers.length, 'Matched seller IDs:', matchedSellerIds);
      
      // Track the request with matched seller IDs
      const requestResult = await trackRequest(university, request, matchedSellerIds, {
        generatedCategories: matchResult.generatedCategories || [],
        matchedCategories: matchResult.matchedCategories || [],
        sellerCategories: matchResult.sellerCategories || {},
        sellerRankingOrder
      });
      setCurrentRequestId(requestResult?.id || null);
      
      // Track merchant matches in analytics
      if (requestResult?.id && sellers.length > 0) {
        const { trackMerchantMatch } = await import('../lib/merchantAnalytics');
        for (const seller of sellers) {
          await trackMerchantMatch(seller.id, requestResult.id);
        }
      }
      
      setMatchedSellers(sellers);
      setShowRetryPrompt(true);
      
    } catch (error) {
      console.error('Error searching for sellers:', error);
      setMatchedSellers([]);
      const requestResult = await trackRequest(university, request, [], {
        generatedCategories: [],
        matchedCategories: [],
        sellerCategories: {},
        sellerRankingOrder: []
      });
      setCurrentRequestId(requestResult?.id || null);
      setShowRetryPrompt(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBackToSearch = () => {
    setShowResults(false);
    setMatchedSellers([]);
    setRequest("");
    setCurrentRequestId(null);
    setShowRetryPrompt(false);
  };

  const handleRetrySearch = () => {
    setIsSearching(true);
    setShowRetryPrompt(false);
    handleSearchRequest({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleAuthSuccess = () => {
    // After successful authentication, proceed with the search
    handleSearchRequest({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleDirectWhatsApp = () => {
    // Fallback to direct WhatsApp contact
    const phoneNumber = "2349060859789";
    const message = `Hi! I'm looking for the following from ${university} University: ${request}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8">
      <Toaster position="top-center" />
      {!showResults ? (
        <div className="w-full flex flex-col items-center justify-center">
          {/* User Menu */}
          <div className="w-full max-w-2xl mx-auto mb-8">
            <Header onAuthClick={() => setShowAuthModal(true)} />
          </div>
          
          {/* UniStore Logo */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl text-center font-bold mb-4">
              <span className="text-orange-500">uni</span>
              <span className="text-blue-800">store.</span>
            </h1>
            <UserGreeting 
              university={university}
              className="text-center max-w-md mx-auto"
            />
          </div>

          {/* Search Card */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white p-8 shadow-xl border border-gray-100 rounded-2xl">
              <form onSubmit={handleSearchRequest} className="space-y-6">
                <div className="space-y-6">
                  {/* University Selection */}
                  <UniversitySelector
                    selectedUniversity={university}
                    onUniversityChange={setUniversity}
                  />

                  {/* Request Textarea */}
                  <div className="relative">
                    <textarea
                      placeholder="I need tote bags below 5000 naira"
                      className="w-full min-h-[120px] p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 resize-none text-base transition-all duration-200 placeholder-gray-400"
                      value={request}
                      onChange={(e) => setRequest(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex gap-1 items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 font-medium w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Find Sellers
                  </button>
                </div>
              </form>
              
              {/* Past Requests Link */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/past-requests')}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  <History className="w-4 h-4" />
                  View past requests
                </button>
              </div>
            </div>
          </div>
          
          {/* Reviews Section */}
          <div className="w-full max-w-4xl mx-auto mt-16 mb-8">
          
            <ReviewSlider />
            
            {userIsAuthenticated && (
              <div className="mt-12">
                <h3 className="text-xl font-semibold text-center mb-6">
                  Share Your Experience
                </h3>
                <ReviewForm />
              </div>
            )}
          </div>

          {/* Bottom Links */}
          <div className="mt-12 flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => window.open("https://unistore.ng", "_blank")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline hover:no-underline transition-all duration-200"
            >
              View more products from your university vendors
            </button>
            
    
            {/* Bolt Badge */}
            <BoltBadge variant="minimal" />
          </div>
        </div>
      ) : (
        <>
          {/* Back Button and Header */}
          <div className="w-full max-w-2xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBackToSearch}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to search
              </button>
              
              {!userIsAuthenticated && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Sign In
                </button>
              )}
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="text-orange-500">uni</span>
                <span className="text-blue-800">store.</span>
              </h1>
              <p className="text-sm text-gray-600">
                Results for "{request}" at {university} University
              </p>
            </div>
          </div>

          {/* Seller Results */}
          <SellerResults 
            sellers={matchedSellers}
            isLoading={isSearching}
            requestText={request}
            university={university}
            requestId={currentRequestId}
          />

          {/* Retry Search Prompt */}
          {showRetryPrompt && !isSearching && (
            <div className="w-full max-w-2xl mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Retry?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Search results might vary with different attempts. Try rephrasing your request or searching again to potentially get better matches.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleRetrySearch}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      Retry Same Search
                    </button>
                    <button
                      onClick={handleBackToSearch}
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      Modify Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp isVisible={!showResults} />
      
      {/* Rating Prompt */}
      <RatingPrompt />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}