import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme.tsx';
// import HomePage from './pages/HomePage';
import PastRequestsPage from './pages/PastRequestsPage';
import SellersPage from './pages/SellersPage';
import SellerCardPage from './pages/SellerCardPage';
import PublicMerchantsPage from './pages/PublicMerchantsPage';
import LandingPage from './pages/LandingPage';
import CategoryTest from './components/CategoryTest';
import ProfilePage from './pages/ProfilePage';
import PaymentPage from './pages/PaymentPage';
import InvoicesPage from './pages/InvoicesPage';
import ViewInvoicePage from './pages/ViewInvoicePage';
import PayMerchantPage from './pages/PayMerchantPage';
import AnnouncementBar from './components/AnnouncementBar';
import useAnalytics from './hooks/useAnalytics';
import SearchResultsPage from './pages/SearchResultsPage';
import MerchantProductPage from './pages/MerchantProductPage';
import AllProductsPage from './pages/AllProductsPage';
import CategoryProductsPage from './pages/CategoryProductsPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import UserMenu from './components/UserMenu';
import HostelHomePage from './pages/HostelHomePage';
import AdminCouponsPage from './pages/AdminCouponsPage';
import { HostelHomePageV2 } from './pages/v2/HostelHomePageV2';
import { ProfilePageV2 } from './pages/v2/ProfilePageV2';
import { OrdersPageV2 } from './pages/v2/OrdersPageV2';
import { PaymentsPageV2 } from './pages/v2/PaymentsPageV2';
import { UpdatePasswordPageV2 } from './pages/v2/UpdatePasswordPageV2';
// import { useHostelMode } from './hooks/useHostelMode';

// function HomeEntry() {
//   const { hostelMode } = useHostelMode();
//   if (hostelMode) return <Navigate to="/hostel" replace />;
//   return <HomePage />;
// }

function App() {
  const { currentTheme } = useTheme();

  return (
    <Router>
      <AppContent currentTheme={currentTheme} />
    </Router>
  );
}

function AppContent({ currentTheme }: { currentTheme: any }) {
  const isV2 = window.location.pathname.startsWith('/v2');

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={!isV2 ? { backgroundColor: currentTheme.background } : {}}
    >
      <div className={!isV2 ? "lg:pl-64" : ""}>
        <AnalyticsLoader />
        {!isV2 && <UserMenu />}
        <Toaster position="top-center" richColors />
        {!isV2 && <AnnouncementBar />}
        <Routes>
          <Route path="/" element={<HostelHomePage />} />
          <Route path="/hostel" element={<HostelHomePage />} />
          <Route path="/landing-page" element={<LandingPage />} />
          <Route path="/past-requests" element={<PastRequestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sellers" element={<SellersPage />} />
          <Route path="/merchants" element={<PublicMerchantsPage />} />
          <Route path="/seller-card/:sellerId" element={<SellerCardPage />} />
          <Route path="/test-categories" element={<CategoryTest />} />
          <Route path="/payment/:merchantId" element={<PaymentPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/pay-merchant" element={<PayMerchantPage />} />
          <Route path="/view-invoice/:invoiceId" element={<ViewInvoicePage />} />
          <Route path="/search-results" element={<SearchResultsPage />} />
          <Route path="/merchant/:actual_merchant_id/:merchantId/:merchantName" element={<MerchantProductPage />} />
          <Route path="/all-products" element={<AllProductsPage />} />
          <Route path="/categories/:categoryId/products" element={<CategoryProductsPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/admin-coupons" element={<AdminCouponsPage />} />
          <Route path="/v2/hostel" element={<HostelHomePageV2 />} />
          <Route path="/v2/profile" element={<ProfilePageV2 />} />
          <Route path="/v2/orders" element={<OrdersPageV2 />} />
          <Route path="/v2/payments" element={<PaymentsPageV2 />} />
          <Route path="/v2/update-password" element={<UpdatePasswordPageV2 />} />
          {/* Handle the weird doubled path appearing in user's browser */}
          <Route path="/v2/update-password/update-password" element={<UpdatePasswordPageV2 />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

function AnalyticsLoader() {
  useAnalytics();
  return null;
}