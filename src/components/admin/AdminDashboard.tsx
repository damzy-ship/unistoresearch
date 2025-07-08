import RequestsTab from './RequestsTab';
import MerchantsTab from './MerchantsTab';
import CategoriesTab from './CategoriesTab';
import SchoolsTab from './SchoolsTab';
import BillingTab from './BillingTab';
import ReviewsTab from './ReviewsTab';
import BoltBadge from './BoltBadge';
import { Toaster } from 'react-hot-toast';

interface DashboardStats {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'visitors' | 'requests' | 'merchants' | 'categories' | 'schools' | 'billing' | 'reviews'>('overview');

  // Set active tab from URL on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['overview', 'visitors', 'requests', 'merchants', 'categories', 'schools', 'billing', 'reviews'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            { id: 'requests', label: 'Requests', icon: MessageSquare },
            { id: 'merchants', label: 'Merchants', icon: Store },
            { id: 'categories', label: 'Categories', icon: Tag },
            { id: 'schools', label: 'Schools', icon: School },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'reviews', label: 'Site Reviews', icon: Star }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id} 
            {activeTab === 'merchants' && <MerchantsTab merchants={merchants} onRefresh={fetchData} />}
            {activeTab === 'categories' && <CategoriesTab />}
            {activeTab === 'schools' && <SchoolsTab />}
            {activeTab === 'billing' && <BillingTab />}
            {activeTab === 'reviews' && <ReviewsTab />}
          </>
        )}
  )
}
  )
}
  )
}