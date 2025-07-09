import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import PastRequestsPage from './pages/PastRequestsPage';
import SellersPage from './pages/SellersPage';
import SellerCardPage from './pages/SellerCardPage';
import SellerDetailsPage from './pages/SellerDetailsPage';
import LandingPage from './pages/LandingPage';
import BillingCallbackPage from './pages/BillingCallbackPage';
import AdminDashboard from './components/AdminDashboard';
import CategoryTest from './components/CategoryTest';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/past-requests" element={<PastRequestsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/sellers" element={<SellersPage />} />
        <Route path="/seller-card/:sellerId" element={<SellerCardPage />} />
        <Route path="/seller/:sellerId" element={<SellerDetailsPage />} />
        <Route path="/billing/callback" element={<BillingCallbackPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/test-categories" element={<CategoryTest />} />
      </Routes>
    </Router>
  );
}

export default App;