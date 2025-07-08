import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import UserMenu from './UserMenu';
import { isAuthenticated } from '../hooks/useTracking';

interface HeaderProps {
  showAuth?: boolean;
  onAuthClick?: () => void;
}

export default function Header({ showAuth = true, onAuthClick }: HeaderProps) {
  const navigate = useNavigate();
  const [userIsAuthenticated, setUserIsAuthenticated] = React.useState(false);
  
  React.useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setUserIsAuthenticated(authenticated);
    };
    
    checkAuth();
  }, []);

  return (
    <div className="w-full flex justify-end items-center">
     
      
      {showAuth && (
        userIsAuthenticated ? (
          <UserMenu />
        ) : (
          <button
            onClick={onAuthClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )
      )}
    </div>
  );
}