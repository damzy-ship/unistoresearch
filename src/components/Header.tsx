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
    <div className="w-full flex justify-end items-center gap-4">
      {userIsAuthenticated && (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-payment-modal'))}
          className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-all duration-200"
        >
          <DollarSign className="w-4 h-4" />
          <span className="hidden sm:inline">Accept Payment</span>
        </button>
      )}
      
      {showAuth && (
        userIsAuthenticated ? (
          <UserMenu />
        ) : (
          <button
            onClick={onAuthClick}
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${currentTheme.buttonGradient} hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )
      )}
    </div>
  );
}