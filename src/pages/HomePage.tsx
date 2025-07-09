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
import BoltBadge from '../components/BoltBadge';
import Header from '../components/Header';
import ReviewForm from '../components/ReviewForm';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';

export default function HomePage() {
  const navigate = useNavigate();
  const { currentTheme, backgroundTexture } = useTheme();
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
    <main 
      className="flex min-h-screen flex-col items-center justify-center px-4 py-8 transition-colors duration-300"
      style={{ backgroundColor: currentTheme.background }}
    >
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
              <span style={{ color: currentTheme.primary }}>uni</span>
              <span style={{ color: currentTheme.secondary }}>store.</span>
            </h1>
            <UserGreeting 
              university={university}
              className="text-center max-w-md mx-auto"
            />
          </div>

          {/* Search Card */}
          <div className="relative z-10 w-full max-w-2xl mx-auto">
            <div 
              className="p-8 shadow-xl border border-gray-100 rounded-2xl transition-colors duration-300"
              style={{ backgroundColor: currentTheme.surface }}
            >
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
                    // focus:ring-${currentTheme.primary} focus:border-${currentTheme.primary}
                      placeholder="I need tote bags below 5000 naira"
                      className={`focus:ring-2 focus:ring-${currentTheme.primaryTsFormat} focus:border-${currentTheme.primaryTsFormat} w-full min-h-[120px] p-4 border-2 rounded-xl resize-none text-base transition-all duration-200 placeholder-gray-400`}
                      // style={{
                        //   color: currentTheme.text
                        // }}
                        style={{
                          backgroundColor: currentTheme.background,
                          borderColor: currentTheme.primary,
                          color: currentTheme.text,
                  
                          // focusBorderColor: currentTheme.primary,
                      }}
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
                    className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}
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
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ 
                    color: currentTheme.textSecondary,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = currentTheme.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = currentTheme.textSecondary}
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
                <h3 style={{ color: currentTheme.text }} className="text-xl font-semibold text-center mb-6">
                  Share Your Unique Experience for fellow students to see
                </h3>
                <ReviewForm />
              </div>
            )}
          </div>

          {/* Bottom Links */}
          <div className="mt-12 flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => window.open("https://unistore.ng", "_blank")}
              className="text-sm font-medium underline hover:no-underline transition-all duration-200"
              style={{ color: currentTheme.secondary }}
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
                className="flex items-center gap-2 font-medium transition-colors"
                style={{ color: currentTheme.primary }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to search
              </button>
              
              {!userIsAuthenticated && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="font-medium transition-colors"
                  style={{ color: currentTheme.primary }}
                >
                  Sign In
                </button>
              )}
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                <span style={{ color: currentTheme.primary }}>uni</span>
                <span style={{ color: currentTheme.secondary }}>store.</span>
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
              <div 
                className="rounded-2xl p-6 border transition-colors duration-300"
                style={{ 
                  backgroundColor: currentTheme.surface,
                  borderColor: currentTheme.primary + '20'
                }}
              >
                <div className="text-center">
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ color: currentTheme.text }}
                  >
                    Retry?
                  </h3>
                  <p 
                    className="mb-4"
                    style={{ color: currentTheme.textSecondary }}
                  >
                    Search results might vary with different attempts. Try rephrasing your request or searching again to potentially get better matches.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleRetrySearch}
                      className={`bg-gradient-to-r ${currentTheme.buttonGradient} text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105`}
                    >
                      Retry Same Search
                    </button>
                    <button
                      onClick={handleBackToSearch}
                      className="border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium transition-colors"
                      style={{ 
                        backgroundColor: currentTheme.background,
                        color: currentTheme.text
                      }}
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