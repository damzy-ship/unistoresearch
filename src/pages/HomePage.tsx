import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTracking, isAuthenticated } from '../hooks/useTracking';
import { findMerchantsForRequest, MerchantWithCategories } from '../lib/gemini';
// import { useNavigate } from 'react-router-dom';
// import SellerResults from '../components/SellerResults';
// import FloatingWhatsApp from '../components/FloatingWhatsApp';
import ReviewSlider from '../components/ReviewSlider';
// import UniversitySelector from '../components/UniversitySelector';
import RatingPrompt from '../components/RatingPrompt';
import MerchantVerifyPrompt from '../components/MerchantVerifyPrompt';
import UserGreeting from '../components/UserGreeting';
import AuthModal from '../components/AuthModal';
import Header from '../components/Header';
import ReviewForm from '../components/ReviewForm';
// import RealTimeSwiper from '../components/RealTimeFeed/RealTimeSwiper';
// import RealTimeStatusBar from '../components/RealTimeFeed/RealTimeStatusBar';
// import CreateRealtimeModal from '../components/RealTimeFeed/CreateRealtimeModal';
import { useTheme } from '../hooks/useTheme';
import { Product } from '../lib/supabase';
import { Toaster } from 'sonner';
import { supabase } from '../lib/supabase';
import PaymentModal from '../components/Payment/PaymentModal';
import ProductSearchComponent from '../components/ProductSearchComponent';
// imports for embedding utilities were removed because they're not used in this file
import MerchantCategoriesGrid from '../components/MerchantCategoriesGrid';
import HorizontalProductList from '../components/HorizontalProductList';
import ConfirmContactModal from '../components/ConfirmContactModal';
import ConfirmUniversityModal from '../components/ConfirmUniversityModal';
// import { generateProductEmbeddings } from '../lib/generateEmbedding';
// import merchantProductData from '../data/product_data.json'; // Import the JSON data directly
// import { updateMerchantProductAttributes } from '../lib/generateEmbedding';



export default function HomePage() {
  // const navigate = useNavigate();
  const { currentTheme, backgroundTexture } = useTheme();
  const [request, setRequest] = useState("");
  const [university] = useState("Bingham");
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [, setMatchedSellers] = useState<MerchantWithCategories[]>([]);
  const [, setCurrentRequestId] = useState<string | null>(null);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  // const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // const [createMode, setCreateMode] = useState<'text' | 'image'>('text');
  const { trackRequest } = useTracking();
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null);
  const [, setUserType] = useState<string | null>(null);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const [showConfirmUniversityModal, setShowConfirmUniversityModal] = useState(false);
  const [showConfirmContactModal, setShowConfirmContactModal] = useState(false);
  const [pendingContactProduct, setPendingContactProduct] = useState<Partial<Product> | null>(null);

  // React.useEffect(() => {
  //   try {
  //     const fetchProductsByCategory = async () => {
  //       // Call the Supabase Edge Function to get products by category
  //       const { data, error: functionError } = await supabase.functions.invoke('smooth-service', {
  //         body: {
  //           category_id: '43e1caed-5165-4e66-b60e-c705279fa689', // Pass the category ID here
  //           school_id: '1724171a-6664-44fd-aa1e-f509b124ab51' // Assuming 'university' is in scope
  //         },


  //       });

  //       if (functionError) {
  //         throw functionError;
  //       }

  //       const products = data?.results || [];
  //       console.log('Products in category:', products);

  //       // Store results and navigate
  //       // navigate('/search-results', { state: { products } });
  //     };

  //     fetchProductsByCategory();
  //   } catch (err) {
  //     console.error('Error during category search:', err);
  //     // setError('An error occurred while fetching category results. Please try again.');
  //   } finally {
  //     // setLoading(false);
  //   }
  // }, []);


    useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUserIsAuthenticated(!!session);

      if (session?.user) {
  try {
          const { data: visitor } = await supabase
            .from('unique_visitors')
            .select('user_type, school_id')
            .eq('auth_user_id', session.user.id)
            .single();

          const fetchedUserType = visitor?.user_type || null;
          setUserType(fetchedUserType);

          // Prioritize school_id from the database
          if (visitor?.school_id) {
            localStorage.setItem('selectedSchoolId', visitor.school_id);
            setSelectedSchoolId(visitor.school_id);
          } else {
            // Fallback to localStorage if not in DB
            const storedId = localStorage.getItem('selectedSchoolId');
            if (storedId) {
              setSelectedSchoolId(storedId);
            } else {
              // If neither exists, show the modal
              setShowConfirmUniversityModal(true);
            }
          }

        } catch (err) {
          console.error('Error fetching user_type:', err);
          setUserType(null);
          // Fallback to localStorage
          const storedId = localStorage.getItem('selectedSchoolId');
          if (storedId) {
            setSelectedSchoolId(storedId);
          } else {
            setShowConfirmUniversityModal(true);
          }
        }
      } else {
        setUserType(null);
        // Handle non-authenticated user flow
        const storedId = localStorage.getItem('selectedSchoolId');
        if (storedId) {
          setSelectedSchoolId(storedId);
        } else {
          setShowConfirmUniversityModal(true);
        }
      }
    };

    checkAuthAndFetchUser();

    const onPending = (e: Event) => {
      // event detail contains the product
      // types are not strict here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (e as CustomEvent).detail as any;
      setPendingContactProduct(detail);
      setShowConfirmContactModal(true);
    };

    window.addEventListener('pending-contact-available', onPending as EventListener);

    // Listen for payment modal open event
    const handlePaymentModalOpen = () => setShowPaymentModal(true);
    window.addEventListener('open-payment-modal', handlePaymentModalOpen);

    return () => {
      window.removeEventListener('open-payment-modal', handlePaymentModalOpen);
      window.removeEventListener('pending-contact-available', onPending as EventListener);
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
    handleSearchRequest({ preventDefault: () => { } } as React.FormEvent);
  };

  const handleAuthSuccess = () => {
    // After successful authentication, proceed with the search
    handleSearchRequest({ preventDefault: () => { } } as React.FormEvent);
    // check if there is a pending contact product and if so the ConfirmContactModal will be shown by effect
  };

  // Check for pending contact product when userIsAuthenticated changes to true
  useEffect(() => {
    if (!userIsAuthenticated) return;
    const raw = localStorage.getItem('pending_contact_product');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // open confirm modal by dispatching a custom event or local state; we'll use local state below
        // store it in localStorage is enough; we'll use a small state to trigger the modal
        setShowAuthModal(false);
        // create an event so other components/pages can show confirm modal if needed
        const ev = new CustomEvent('pending-contact-available', { detail: parsed });
        window.dispatchEvent(ev);
      } catch {
        localStorage.removeItem('pending_contact_product');
      }
    }
  }, [userIsAuthenticated]);



  const handleConfirmUniversity = (schoolId: string) => {
    // persist to localStorage and update state
    localStorage.setItem('selectedSchoolId', schoolId);
    setSelectedSchoolId(schoolId);
    setShowConfirmUniversityModal(false);
  };

  return (
    <>

      {selectedSchoolId ?

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

              {/* <button onClick={() => getMatchingCategoriesAndFeatures("i need a graduation gown for my graduation ceremony")}>
            <h1>Get Matching Categories and Features</h1>
          </button> */}
              {/* <button onClick={() => updateMerchantProductAttributes(merchantProductData)}>
            <h1>UPDATE</h1>
          </button> */}

              {/* UniStore Logo */}
              <div className="mb-12 px-2">
                <h1 className="text-5xl md:text-6xl text-center font-bold mb-4 mt-2">
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

              <hr className="w-full max-w-2xl bg-yellow-400 h-2 mt-4" />
              <HorizontalProductList
                showFeatured={true}
                schoolId={selectedSchoolId}
                userIsAuthenticated={userIsAuthenticated}
                categoryName="Featured Products" />

              <hr className="w-full max-w-2xl bg-yellow-400 h-2" />
              <MerchantCategoriesGrid
                schoolId={selectedSchoolId}
              />

              <hr className="w-full max-w-2xl bg-yellow-400 h-2 mt-4" />
              <HorizontalProductList
                categoryId="d5b787f7-e41c-4bd9-b0b9-aa17158a7373"
                schoolId={selectedSchoolId}
                userIsAuthenticated={userIsAuthenticated}
                categoryName="Apparel & Clothing" />

              <hr className="w-full max-w-2xl bg-yellow-400 h-2" />
              <MerchantCategoriesGrid
                showFirst={false}
                schoolId={selectedSchoolId}
              />

              <hr className="w-full max-w-2xl bg-yellow-400 h-2 mt-4" />
              <HorizontalProductList
                categoryId="09e9cc32-b75e-4138-9aa6-7dbf6bb7a756"
                schoolId={selectedSchoolId}
                userIsAuthenticated={userIsAuthenticated}
                categoryName="Bags & Luggage" />

              <hr className="w-full max-w-2xl bg-yellow-400 h-2" />
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

          {/* Merchant Verify Prompt */}
          <MerchantVerifyPrompt />

          {/* Auth Modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />

          <ConfirmContactModal
            isOpen={showConfirmContactModal}
            product={pendingContactProduct || undefined}
            onClose={() => { setShowConfirmContactModal(false); setPendingContactProduct(null); localStorage.removeItem('pending_contact_product'); }}
            onConfirm={() => { setShowConfirmContactModal(false); setPendingContactProduct(null); localStorage.removeItem('pending_contact_product'); }}
          />

          {userIsAuthenticated && (
            <PaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              userId={session?.user?.id || ''}
            />
          )}
        </main>
        : <ConfirmUniversityModal
          isOpen={showConfirmUniversityModal}
          onClose={() => setShowConfirmUniversityModal(false)}
          initialSchoolId={selectedSchoolId}
          onConfirm={handleConfirmUniversity}
        />
      }
    </>
  );
}