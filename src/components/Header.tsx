import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, DollarSign } from 'lucide-react';
import UserMenu from './UserMenu';
import { isAuthenticated } from '../hooks/useTracking';
import { useTheme } from '../hooks/useTheme';

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
  }, []);

  return (
    <div className="w-full flex justify-end items-center">
      {userIsAuthenticated && (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-payment-modal'))}
          aria-label="Open accept payment modal"
          title="Accept Payment"
          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r ${currentTheme.buttonGradient} text-white font-medium shadow-sm hover:shadow-md transition-transform transform active:scale-95`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="hidden sm:inline">Accept Payment</span>
          <span className="inline sm:hidden">Accept</span>
        </button>
      )}
      
      {showAuth && (
        userIsAuthenticated ? (
          <UserMenu />
        ) : (
          <button
            onClick={onAuthClick}
            className={`flex mr-4 items-center gap-2 px-4 py-2 bg-gradient-to-r ${currentTheme.buttonGradient} hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )
      )}
    </div>
  );
}