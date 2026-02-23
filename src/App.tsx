import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme.tsx';
// import HomePage from './pages/HomePage';
import PastRequestsPage from './pages/PastRequestsPage';
import SellersPage from './pages/SellersPage';
import SellerCardPage from './pages/SellerCardPage';
import PublicMerchantsPage from './pages/PublicMerchantsPage';
import LandingPage from './pages/LandingPage';
import CategoryTest from './components/CategoryTest';
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
import UserMenu from './components/UserMenu';
import { HostelHomePageV2 } from './pages/v2/HostelHomePageV2';
import { ProfilePageV2 } from './pages/v2/ProfilePageV2';
import { OrdersPageV2 } from './pages/v2/OrdersPageV2';
import { ActivityPageV2 } from './pages/v2/ActivityPageV2';
import { PaymentsPageV2 } from './pages/v2/PaymentsPageV2';
import { UpdatePasswordPageV2 } from './pages/v2/UpdatePasswordPageV2';
// import { useHostelMode } from './hooks/useHostelMode';



function App() {
  const { currentTheme } = useTheme();

  return (
    <Router>
      <AppContent currentTheme={currentTheme} />
    </Router>
  );
}

function AppContent({ currentTheme }: { currentTheme: any }) {
  const pathname = window.location.pathname;
  const isV2 =
    pathname === '/' ||
    pathname === '/hostel' ||
    pathname === '/profile' ||
    pathname === '/orders' ||
    pathname === '/activity' ||
    pathname === '/payments' ||
    pathname === '/update-password' ||
    pathname.startsWith('/v2/');

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
          <Route path="/" element={<HostelHomePageV2 />} />
          <Route path="/hostel" element={<HostelHomePageV2 />} />
          <Route path="/landing-page" element={<LandingPage />} />
          <Route path="/past-requests" element={<PastRequestsPage />} />
          <Route path="/profile" element={<ProfilePageV2 />} />
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
          <Route path="/update-password" element={<UpdatePasswordPageV2 />} />
          <Route path="/orders" element={<OrdersPageV2 />} />
          <Route path="/activity" element={<ActivityPageV2 />} />
          <Route path="/payments" element={<PaymentsPageV2 />} />
          {/* Redirect legacy /v2 paths to root */}
          <Route path="/v2/hostel" element={<Navigate to="/hostel" replace />} />
          <Route path="/v2/profile" element={<Navigate to="/profile" replace />} />
          <Route path="/v2/orders" element={<Navigate to="/orders" replace />} />
          <Route path="/v2/payments" element={<Navigate to="/payments" replace />} />
          <Route path="/v2/update-password" element={<Navigate to="/update-password" replace />} />
          {/* Handle the weird doubled path appearing in user's browser */}
          <Route path="/v2/update-password/update-password" element={<Navigate to="/update-password" replace />} />
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