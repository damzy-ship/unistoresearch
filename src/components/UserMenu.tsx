import { useState, useEffect } from 'react';
import { User, LogOut, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../hooks/useTracking';
import { useTheme } from '../hooks/useTheme';
import PaymentModal from './Payment/PaymentModal';

export default function UserMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const {currentTheme} = useTheme();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        // Get user details from unique_visitors
        const { data: visitorData } = await supabase
          .from('unique_visitors')
          .select('full_name')
          .eq('auth_user_id', session.user.id)
          .single();

        setUserId(session.user.id);
        const name = visitorData?.full_name || session.user.user_metadata?.full_name || '';
        setUserName(name);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      checkAuth();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    window.location.reload(); // Reload to reset the app state
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className={`w-8 h-8 bg-gradient-to-br ${currentTheme.buttonGradient} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
            {userName ? getFirstName(userName).charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
            {userName ? getFirstName(userName) : 'User'}
          </span>
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
              <div className="p-3 border-b border-gray-100">
                <p className="font-medium text-gray-900 truncate">
                  {userName ? getFirstName(userName) : 'User'}
                </p>
              </div>
              
              <div className="p-2">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile & Themes
                </button>
                
                <button
                  onClick={() => {
                    navigate('/invoices');
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <History className="w-4 h-4" />
                  Invoices
                </button>
                
                {/* Real-time and Create Product menu items removed per request */}
                
                <button
                  onClick={() => {
                    navigate('/past-requests');
                    setIsOpen(false);
                  }}
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
            </div>
          </>
        )}
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