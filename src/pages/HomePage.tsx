import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTracking, isAuthenticated } from '../hooks/useTracking';
import { findMerchantsForRequest, MerchantWithCategories } from '../lib/gemini';
// import { useNavigate } from 'react-router-dom';
// import SellerResults from '../components/SellerResults';
// import FloatingWhatsApp from '../components/FloatingWhatsApp';
import ReviewSlider from '../components/ReviewSlider';
// import UniversitySelector from '../components/UniversitySelector';
import RatingPrompt from '../components/RatingPrompt';
import UserGreeting from '../components/UserGreeting';
import AuthModal from '../components/AuthModal';
import Header from '../components/Header';
import ReviewForm from '../components/ReviewForm';
// import RealTimeSwiper from '../components/RealTimeFeed/RealTimeSwiper';
// import RealTimeStatusBar from '../components/RealTimeFeed/RealTimeStatusBar';
// import CreateRealtimeModal from '../components/RealTimeFeed/CreateRealtimeModal';
import { useTheme } from '../hooks/useTheme';
import { Toaster } from 'sonner';
import { supabase } from '../lib/supabase';
import PaymentModal from '../components/Payment/PaymentModal';
import ProductSearchComponent from '../components/ProductSearchComponent';

export default function HomePage() {
  // const navigate = useNavigate();
  const { currentTheme, backgroundTexture } = useTheme();
  const [request, setRequest] = useState("");
  const [university, setUniversity] = useState("Bingham");
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedSellers, setMatchedSellers] = useState<MerchantWithCategories[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  // const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // const [createMode, setCreateMode] = useState<'text' | 'image'>('text');
  const { trackRequest } = useTracking();
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUserIsAuthenticated(!!currentSession);
    };
    
    checkAuth();

    const fetchUserType = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: visitor } = await supabase
            .from('unique_visitors')
            .select('user_type')
            .eq('auth_user_id', session.user.id)
            .single();
          setUserType((visitor as { user_type?: string } | null)?.user_type || null);
        } else {
          setUserType(null);
        }
      } catch (err) {
        console.error('Error fetching user_type:', err);
        setUserType(null);
      }
    };

    fetchUserType();

    // Listen for payment modal open event
    const handlePaymentModalOpen = () => setShowPaymentModal(true);
    window.addEventListener('open-payment-modal', handlePaymentModalOpen);

    return () => {
      window.removeEventListener('open-payment-modal', handlePaymentModalOpen);
    };
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

  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center px- py-8 transition-colors duration-300"
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
      <Toaster position="top-center" richColors />
      {!showResults ? (
        <div className="w-full flex flex-col items-center justify-center">
          {/* User Menu */}
          <div className="w-full max-w-2xl mx-auto">
            <Header onAuthClick={() => setShowAuthModal(true)} />
          </div>
          
          
          {/* UniStore Logo */}
          <div className="mb-12 px-2">
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
         <ProductSearchComponent />

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
          {/* <div className="mt-12 flex flex-col items-center gap-4 w-full">
            <button
              onClick={() => window.open("https://unistore.ng", "_blank")}
              className="text-sm font-medium underline hover:no-underline transition-all duration-200"
              style={{ color: currentTheme.secondary }}
            >
              View more products from your university vendors
            </button>
            
    
          </div> */}
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

          {/* Seller Results
          <SellerResults 
            sellers={matchedSellers}
            isLoading={isSearching}
            requestText={request}
            university={university}
            requestId={currentRequestId ?? undefined}
          /> */}

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
      {/* <FloatingWhatsApp isVisible={!showResults} /> */}
      
      {/* Rating Prompt */}
      <RatingPrompt />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {userIsAuthenticated && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          userId={session?.user?.id || ''}
        />
      )}
    </main>
  );
}