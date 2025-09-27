import React from 'react';
import { LogIn, Menu, User } from 'lucide-react';
import { CreditCard } from 'lucide-react';
import { isAuthenticated } from '../hooks/useTracking';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
 
interface HeaderProps {
   showAuth?: boolean;
   onAuthClick?: () => void;
}
 
export default function Header({ showAuth = true, onAuthClick }: HeaderProps) {
   const navigate = useNavigate();
  const [userIsAuthenticated, setUserIsAuthenticated] = React.useState(false);
   const {currentTheme} = useTheme();
   
   React.useEffect(() => {
     const checkAuth = async () => {
       const authenticated = await isAuthenticated();
       setUserIsAuthenticated(authenticated);
     };

     
     
     checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
   }, []);

 
  return (
    <div className="w-full flex items-center justify-between">
      {/* Left: mobile toggle */}
      <div className="flex items-center">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-user-sidebar'))}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 ml-2"
          aria-label="Open user menu"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center">
        {/* Pay Merchant button - visible always */}
        <button
          onClick={() => navigate('/pay-merchant')}
          aria-label="Pay a merchant"
          title="Pay Merchant"
          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r ${currentTheme.buttonGradient} text-white font-medium shadow-sm hover:shadow-md transition-transform transform active:scale-95`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">Make Payment</span>
          <span className="inline sm:hidden">Make Payment</span>
        </button>

        {showAuth && (
          userIsAuthenticated ? (
            // don't render UserMenu here to avoid duplicate sidebars; show a simple profile button
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center mx-4 p-2 rounded-full hover:bg-gray-100"
              aria-label="Open profile"
            >
              <User className="w-5 h-5 text-gray-700" />
            </button>
          ) : (
            <button
              onClick={onAuthClick}
              className={`flex mx-4 items-center gap-2 px-4 py-2 bg-gradient-to-r ${currentTheme.buttonGradient} hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )
        )}
      </div>
    </div>
  );
 }