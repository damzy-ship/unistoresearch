import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Users, MessageSquare, Store, Tag, School, CreditCard, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, UniqueVisitor, RequestLog, Merchant } from '../lib/supabase';
import LoginForm from './admin/LoginForm';
import OverviewTab from './admin/OverviewTab';
import VisitorsTab from './admin/VisitorsTab';
import RequestsTab from './admin/RequestsTab';
import MerchantsTab from './admin/MerchantsTab';
import CategoriesTab from './admin/CategoriesTab';
import SchoolsTab from './admin/SchoolsTab';
import BillingTab from './admin/BillingTab';
import RealTimeProductsTab from './admin/RealTimeProductsTab';
import InvoicesTab from './admin/InvoicesTab';

import { Toaster } from 'sonner';

interface DashboardStats {
  totalVisitors: number;
  totalRequests: number;
  binghamRequests: number;
  veritasRequests: number;
  todayVisitors: number;
  todayRequests: number;
  totalMerchants: number;
  averageRating: number;
  totalRatings: number;
  invoicePaidTotal?: number;
  invoiceCollectedTotal?: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitors: 0,
    totalRequests: 0,
    binghamRequests: 0,
    veritasRequests: 0,
    todayVisitors: 0,
    todayRequests: 0,
    totalMerchants: 0,
    averageRating: 0,
    totalRatings: 0
  });
  const [visitors, setVisitors] = useState<UniqueVisitor[]>([]);
  const [requests, setRequests] = useState<RequestLog[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  type TabId = 'overview' | 'visitors' | 'requests' | 'merchants' | 'categories' | 'schools' | 'billing' | 'real-time' | 'invoices';
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Set active tab from URL on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['overview', 'visitors', 'requests', 'merchants', 'categories', 'schools', 'billing', 'real-time', 'invoices'].includes(tabParam)) {
      setActiveTab(tabParam as TabId);
    }
  }, [location]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('admin_authenticated', 'true');
    fetchData();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    navigate(`/admin?tab=${tabId}`);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch visitors
      const { data: visitorsData } = await supabase
        .from('unique_visitors')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch requests
      const { data: requestsData } = await supabase
        .from('request_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch merchants
      const { data: merchantsData } = await supabase
        .from('merchants')
        .select(`
          *,
          average_rating,
          total_ratings,
          rating_breakdown
        `)
        .order('created_at', { ascending: false });

      if (visitorsData) setVisitors(visitorsData);
      if (requestsData) setRequests(requestsData);
      if (merchantsData) setMerchants(merchantsData);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayVisitors = visitorsData?.filter(v => 
        v.first_visit.startsWith(today)
      ).length || 0;
      
      const todayRequests = requestsData?.filter(r => 
        r.created_at.startsWith(today)
      ).length || 0;

      const binghamRequests = requestsData?.filter(r => r.university === 'Bingham').length || 0;
      const veritasRequests = requestsData?.filter(r => r.university === 'Veritas').length || 0;

      // Calculate overall rating stats
      const totalRatings = merchantsData?.reduce((sum: number, m: any) => sum + (m.total_ratings || 0), 0) || 0;
      const weightedRatingSum = merchantsData?.reduce((sum: number, m: any) => {
        return sum + ((m.average_rating || 0) * (m.total_ratings || 0));
      }, 0) || 0;
      const averageRating = totalRatings > 0 ? weightedRatingSum / totalRatings : 0;

      // Calculate invoice totals (paid and collected)
      type InvoiceRow = { invoice_amount?: number | string };
      const getAmt = (row: unknown) => {
        try {
          const a = (row as InvoiceRow)?.invoice_amount;
          return Number(a) || 0;
        } catch { return 0; }
      };
      
      const { data: paidData } = await supabase
        .from('invoices')
        .select('invoice_amount', { count: 'exact' })
        .eq('invoice_status', 'paid');

      const { data: collectedData } = await supabase
        .from('invoices')
        .select('invoice_amount', { count: 'exact' })
        .eq('invoice_status', 'collected');

  const invoicePaidTotal = (paidData || []).reduce((s: number, r: unknown) => s + getAmt(r), 0);
  const invoiceCollectedTotal = (collectedData || []).reduce((s: number, r: unknown) => s + getAmt(r), 0);
      setStats({
        totalVisitors: visitorsData?.length || 0,
        totalRequests: requestsData?.length || 0,
        binghamRequests,
        veritasRequests,
        todayVisitors,
        todayRequests,
        totalMerchants: merchantsData?.length || 0,
        averageRating,
  totalRatings,
  invoicePaidTotal,
  invoiceCollectedTotal
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">UniStore Analytics</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 sm:mb-8 overflow-x-auto">
            {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'visitors', label: 'Visitors', icon: Users },
            { id: 'requests', label: 'Requests', icon: MessageSquare },
            { id: 'merchants', label: 'Merchants', icon: Store },
            { id: 'categories', label: 'Categories', icon: Tag },
            { id: 'schools', label: 'Schools', icon: School },
              { id: 'billing', label: 'Billing', icon: CreditCard },
              { id: 'invoices', label: 'Invoices', icon: CreditCard },
              { id: 'real-time', label: 'Real-time', icon: Zap }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id} 
              onClick={() => handleTabChange(id as TabId)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === id
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">{label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'visitors' && <VisitorsTab visitors={visitors} />}
            {activeTab === 'requests' && <RequestsTab requests={requests} onRefresh={fetchData} />}
            {activeTab === 'merchants' && <MerchantsTab merchants={merchants} onRefresh={fetchData} />}
            {activeTab === 'categories' && <CategoriesTab />}
            {activeTab === 'schools' && <SchoolsTab />}
            {activeTab === 'billing' && <BillingTab />}
            {activeTab === 'invoices' && <InvoicesTab />}
            {activeTab === 'real-time' && <RealTimeProductsTab />}
          </>
        )}
      </div>
    </div>
  );
}