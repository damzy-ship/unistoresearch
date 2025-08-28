import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme';
import HomePage from './pages/HomePage';
import PastRequestsPage from './pages/PastRequestsPage';
import SellersPage from './pages/SellersPage';
import SellerCardPage from './pages/SellerCardPage';
import SellerDetailsPage from './pages/SellerDetailsPage';
import LandingPage from './pages/LandingPage';
import BillingCallbackPage from './pages/BillingCallbackPage';
import RealTimePage from './pages/RealTimePage';
import CreateRealTimeProductPage from './pages/CreateRealTimeProductPage';
import AdminDashboard from './components/AdminDashboard';
import CategoryTest from './components/CategoryTest';
import ProfilePage from './pages/ProfilePage';
import PaymentPage from './pages/PaymentPage';

function App() {
  const { currentTheme } = useTheme();
  
  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: currentTheme.background }}
    >
    <Router>
        <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/past-requests" element={<PastRequestsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/sellers" element={<SellersPage />} />
        <Route path="/seller-card/:sellerId" element={<SellerCardPage />} />
        <Route path="/seller/:sellerId" element={<SellerDetailsPage />} />
        <Route path="/billing/callback" element={<BillingCallbackPage />} />
          <Route path="/real-time" element={<RealTimePage />} />
          <Route path="/create-real-time-product" element={<CreateRealTimeProductPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/test-categories" element={<CategoryTest />} />
        <Route path="/payment/:merchantId" element={<PaymentPage />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App;