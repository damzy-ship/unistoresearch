import { useState, useEffect } from 'react';
import { User, LogOut, History, FileText, Box, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../hooks/useTracking';
import { useTheme } from '../hooks/useTheme';
import PaymentModal from './Payment/PaymentModal';
import { useHostelMode } from '../hooks/useHostelMode';

// Sidebar that is fixed on larger screens and slide-in on mobile.
export default function UserMenu() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [actualUserId, setActualUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const { currentTheme } = useTheme();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { hostelMode, setHostelMode } = useHostelMode();

  // mobile open state
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);

      if (session?.user) {
        setUserId(session.user.id);
        const { data: visitorData } = await supabase
          .from('unique_visitors')
          .select('user_type, full_name, auth_user_id, id')
          .eq('auth_user_id', session.user.id)
          .single();

        const typedVisitor = visitorData as { user_type?: string; full_name?: string; id?: string } | null;
        setUserType(typedVisitor?.user_type || null);
        setActualUserId(typedVisitor?.id || null);
        const name = typedVisitor?.full_name || session.user.user_metadata?.full_name || '';
        setUserName(name);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    // listen for header toggle event - use a named handler so removal is consistent
    const toggleHandler = () => setMobileOpen((s) => !s);
    window.addEventListener('toggle-user-sidebar', toggleHandler as EventListener);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('toggle-user-sidebar', toggleHandler as EventListener);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const getFirstName = (fullName: string) => fullName.split(' ')[0] || 'User';

  if (!isAuthenticated) return null;

  const handleViewProducts = () => {
    setMobileOpen(false);
    navigate(`/merchant/${actualUserId}/${userId}/${encodeURIComponent(userName || 'Merchant')}`);
  };

  const menuContent = (
    <div className="flex flex-col h-full">
      <div className="hidden lg:flex p-4 border-b border-gray-100">
        <p className="font-medium text-gray-900 truncate">{userName ? getFirstName(userName) : 'User'}</p>
      </div>

      <div className="p-2 flex-1 overflow-y-auto">
        <button
          onClick={() => {
            setHostelMode(false);
            setMobileOpen(false);
            navigate('/');
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Store Mode
        </button>

        <button
          onClick={() => {
            setHostelMode(true);
            setMobileOpen(false);
            navigate('/hostel');
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Hostel Mode
        </button>

        <div className="px-3 py-1 text-xs text-gray-500">Current: {hostelMode ? 'Hostel' : 'Store'}</div>

        <button
          onClick={() => { navigate('/profile'); setMobileOpen(false); }}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <User className="w-4 h-4" />
          Profile & Themes
        </button>

        <button
          onClick={() => { navigate('/invoices'); setMobileOpen(false); }}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FileText className="w-4 h-4" />
          Transactions
        </button>

        {userType === 'merchant' && (
          <button
            onClick={handleViewProducts}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Box className="w-4 h-4" />
            Manage Products
          </button>
        )}

        <button
          onClick={() => { navigate('/past-requests'); setMobileOpen(false); }}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <History className="w-4 h-4" />
          Past Requests
        </button>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => setShowPaymentModal(true)}
          className={`w-full px-3 py-2 rounded-md bg-gradient-to-r ${currentTheme.buttonGradient} text-white text-sm`}
        >
          Make Payment
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Large screen fixed sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col lg:bg-white lg:border-r lg:shadow z-30">
        {menuContent}
      </aside>

      {/* Mobile slide-over (from right) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 w-64 bg-white border-l shadow z-30 transform transition-transform duration-200 lg:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="font-medium">{userName ? getFirstName(userName) : 'User'}</div>
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {menuContent}
      </div>

      {isAuthenticated && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          userId={userId || ''}
        />
      )}
    </>
  );
}