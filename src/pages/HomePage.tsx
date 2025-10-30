import { useEffect, useState } from 'react';
import ReviewSlider from '../components/ReviewSlider';
import RatingPrompt from '../components/RatingPrompt';
import MerchantVerifyPrompt from '../components/MerchantVerifyPrompt';
import UserGreeting from '../components/UserGreeting';
import AuthModal from '../components/AuthModal';
import Header from '../components/Header';
import ReviewForm from '../components/ReviewForm';
import { useTheme } from '../hooks/useTheme';
import { Product } from '../lib/supabase';
import { Toaster } from 'sonner';
import { supabase } from '../lib/supabase';
import PaymentModal from '../components/Payment/PaymentModal';
import ProductSearchComponent from '../components/ProductSearchComponent';
import MerchantCategoriesGrid from '../components/MerchantCategoriesGrid';
import HorizontalProductList from '../components/HorizontalProductList';
import ConfirmContactModal from '../components/ConfirmContactModal';
import ConfirmUniversityModal from '../components/ConfirmUniversityModal';
import VerticalProductList from '../components/VerticalProductList';
import CountdownTimer from '../components/CountDownTimer';


export default function HomePage() {
  const { currentTheme, backgroundTexture } = useTheme();
  const [university] = useState("Bingham");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null);
  const [, setUserType] = useState<string | null>(null);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const [showConfirmUniversityModal, setShowConfirmUniversityModal] = useState(false);
  const [showConfirmContactModal, setShowConfirmContactModal] = useState(false);
  const [pendingContactProduct, setPendingContactProduct] = useState<Partial<Product> | null>(null);


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
          className="flex min-h-screen flex-col items-center justify-center transition-colors duration-300"
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
          <CountdownTimer />

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
            {/* <button onClick={() => updateAllMerchantProductsFromVisitors()}>
            <h1>UPDATE ALL MERCHANTS PRODUCTS FROM VISITORS</h1>
          </button>  */}

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
            />

            <hr className="w-full max-w-2xl bg-yellow-400 h-2" />
            <MerchantCategoriesGrid
              schoolId={selectedSchoolId}
            />

            <hr className="w-full max-w-2xl bg-yellow-400 h-2 mt-4" />
            <HorizontalProductList
              categoryId="d5b787f7-e41c-4bd9-b0b9-aa17158a7373"
              schoolId={selectedSchoolId}
              userIsAuthenticated={userIsAuthenticated}
            />

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
            />

            <hr className="w-full max-w-2xl bg-yellow-400 h-2 mt-4" />
            <VerticalProductList
              categoryId="5f3cefb7-5833-4605-a647-9a077a308d8d"
              schoolId={selectedSchoolId}
              userIsAuthenticated={userIsAuthenticated}
            />

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

          </div>

          {/* Rating Prompt */}
          <RatingPrompt />

          {/* Merchant Verify Prompt */}
          <MerchantVerifyPrompt />

          {/* Auth Modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setUserIsAuthenticated(true)}
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