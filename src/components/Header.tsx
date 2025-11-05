import React from 'react';
import { LogIn, Menu, Repeat } from 'lucide-react';
import { CreditCard } from 'lucide-react';
import { isAuthenticated } from '../hooks/useTracking';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useHostelMode } from '../hooks/useHostelMode';

interface HeaderProps {
  showAuth?: boolean;
  onAuthClick?: () => void;
  isHostelMerchant?: boolean;
}

export default function Header({ showAuth = true, onAuthClick, isHostelMerchant = false }: HeaderProps) {
  const navigate = useNavigate();
  const [userIsAuthenticated, setUserIsAuthenticated] = React.useState(false);
  const { currentTheme } = useTheme();
  const { hostelMode, toggleHostelMode } = useHostelMode();

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
    <div className="w-full flex items-center justify-between py-4">
      {/* Left: Mode toggle always visible */}
      {isHostelMerchant ?
        <button
          onClick={() => { toggleHostelMode(); navigate('/'); }}
          className={`ml-4 flex items-center gap-2 px-3 py-2 rounded-xl border border-transparent text-sm ${hostelMode ? 'bg-[#15202b] text-white' : 'bg-gray-100 text-gray-800'} hover:opacity-90`}
          aria-label="Toggle hostel mode"
          title="Switch modes"
        >
          <Repeat className="w-4 h-4" />

        </button> : <button
          onClick={() => { toggleHostelMode(); navigate('/'); }}
          className={`ml-4 flex items-center gap-2 px-3 py-2 rounded-xl border border-transparent text-sm ${hostelMode ? 'bg-[#15202b] text-white' : 'bg-gray-100 text-gray-800'} hover:opacity-90`}
          aria-label="Toggle hostel mode"
          title="Switch modes"
        >
          <Repeat className="w-4 h-4" />

        </button>}

      {/* Right: actions */}
      <div className="flex items-center">
        {/* Pay Merchant  bbutton - visible always */}
        <button
          onClick={() => navigate('/pay-merchant')}
          aria-label="Pay a merchant"
          title="Pay Merchant"
          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r ${currentTheme.buttonGradient} text-white font-medium shadow-sm hover:shadow-md transition-transform transform active:scale-95`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">Make Payment</span>
          <span className="inline sm:hidden">Make Payment</span>
        </button>



        {showAuth && (
          userIsAuthenticated ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-user-sidebar'))}
              className={`lg:hidden p-2 rounded-lg mx-5 bg-gradient-to-l ${currentTheme.buttonGradient} text-white font-bold shadow-sm hover:shadow-md transition-transform transform active:scale-95`}
              aria-label="Open user menu"
              title="Menu"
            >
              <Menu className="w-6 h-6" />
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