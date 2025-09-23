import React from 'react';
import { LogIn, DollarSign } from 'lucide-react';
import { CreditCard } from 'lucide-react';
import UserMenu from './UserMenu';
import { isAuthenticated } from '../hooks/useTracking';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
 
interface HeaderProps {
   showAuth?: boolean;
   onAuthClick?: () => void;
   userType?: string;
}
 
export default function Header({ showAuth = true, onAuthClick, userType }: HeaderProps) {
   const navigate = useNavigate();
   const [userIsAuthenticated, setUserIsAuthenticated] = React.useState(false);
  // const [userType, setUserType] = React.useState<string | null>(null);
   const {currentTheme} = useTheme();
   
   React.useEffect(() => {
     const checkAuth = async () => {
       const authenticated = await isAuthenticated();
       setUserIsAuthenticated(authenticated);
     };

     
     
     checkAuth();
    // fetch user_type for the current session (if any)
  // const fetchUserType = async () => {
  //     try {
  //       const { data: { session } } = await supabase.auth.getSession();
  //       if (session?.user) {
  //         const { data: visitor } = await supabase
  //           .from('unique_visitors')
  //           .select('user_type')
  //           .eq('auth_user_id', session.user.id)
  //           .single();
  //     setUserType((visitor as { user_type?: string } | null)?.user_type || null);
  //       } else {
  //         setUserType(null);
  //       }
  //     } catch (err) {
  //       console.error('Error fetching user_type:', err);
  //       setUserType(null);
  //     }
  //   };

  //   fetchUserType();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
      // fetchUserType();
    });

    return () => {
      subscription.unsubscribe();
    };
   }, []);

 
   return (
     <div className="w-full flex justify-end items-center">
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
  {/* {userIsAuthenticated && userType === 'merchant' && (
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
       )} */}
       
       {showAuth && (
         userIsAuthenticated ? (
           <UserMenu />
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
   );
 }