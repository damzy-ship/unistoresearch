import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme';
import HomePage from './pages/HomePage';
import PastRequestsPage from './pages/PastRequestsPage';
import SellersPage from './pages/SellersPage';
import SellerCardPage from './pages/SellerCardPage';
import PublicMerchantsPage from './pages/PublicMerchantsPage';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './components/AdminDashboard';
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
import { useHostelMode } from './hooks/useHostelMode';

function HomeEntry() {
  const { hostelMode } = useHostelMode();
  if (hostelMode) return <Navigate to="/hostel" replace />;
  return <HomePage />;
}

function App() {
  const { currentTheme } = useTheme();

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: currentTheme.background }}
    >
      <Router>
        <div className="lg:pl-64">{/* push content right on larger screens to avoid the fixed sidebar */}
          {/* analytics loader registers global handlers and records page views */}
          <AnalyticsLoader />
        <UserMenu />
        <Toaster position="top-center" richColors />
        <AnnouncementBar />
          <Routes>
            <Route path="/" element={<HomeEntry />} />
            <Route path="/hostel" element={<HostelHomePage />} />
            <Route path="/landing-page" element={<LandingPage />} />
            <Route path="/past-requests" element={<PastRequestsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/sellers" element={<SellersPage />} />
            <Route path="/merchants" element={<PublicMerchantsPage />} />
            <Route path="/seller-card/:sellerId" element={<SellerCardPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
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
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;

function AnalyticsLoader() {
  useAnalytics();
  return null;
}