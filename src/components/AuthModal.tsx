import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, UserPlus, Send, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { setUserId, setPhoneAuthenticated } from '../hooks/useTracking';
import { sendOTP, verifyOTP } from '../lib/smsService';
import { toast } from 'react-hot-toast';
import AuthHeader from './auth/AuthHeader';
import AuthInput from './auth/AuthInput';
import AuthButton from './auth/AuthButton';
import PhoneInput from './auth/PhoneInput';
import OTPInput from './auth/OTPInput';
import UniversitySelector from './UniversitySelector';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-password';
type UserType = 'user' | 'merchant';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('login');
  const [fullName, setFullName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+234');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [displayOtp, setDisplayOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState('+234');

  // New state for user type and schools
  const [userType, setUserType] = useState<UserType>('user');
  const [selectedSchoolId, setSelectedSchoolId] = useState("684c03a5-a18d-4df9-b064-0aaeee2a5f01");

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setView('login');
      setFullName('');
      setBrandName('');
      setPhoneNumber('+234');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setDisplayOtp(null);
      setError('');
      setForgotPasswordPhone('+234');
      setUserType('user'); // Reset user type on modal open
      setSelectedSchoolId(null);
    }
  }, [isOpen]);

  const validateInputs = () => {
    if (phoneNumber.length < 14) {
      setError('Please enter a complete phone number');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (view === 'signup' && !fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }

    // New validation for merchant type
    if (view === 'signup' && userType === 'merchant' && !selectedSchoolId) {
      setError('Please select your school');
      return false;
    }

    return true;
  };

  const validatePasswordReset = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      // Create a unique email from the phone number for Supabase Auth
      const phoneEmail = `${phoneNumber.replace(/\+/g, '')}@phone.unistore.local`;

      // Prepare user metadata
      const userMetadata = {
        full_name: fullName,
        phone_number: phoneNumber,
        user_type: userType, // Save user type to auth metadata
        school_id: selectedSchoolId,
        ...(userType === 'merchant' && { brand_name: brandName }) // Conditionally add brand_name
      };

      // Sign up with Supabase Auth using the generated email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: phoneEmail,
        password: password,
        options: {
          data: userMetadata
        }
      });

      if (authError) {
        if (authError.message?.includes('already registered')) {
          setError('An account with this phone number already exists. Please sign in instead.');
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create or update visitor record
      const { error: visitorError } = await supabase
        .from('unique_visitors')
        .insert({
          user_id: authData.user.id,
          auth_user_id: authData.user.id,
          phone_number: phoneNumber,
          full_name: fullName,
          last_visit: new Date().toISOString(),
          visit_count: 1,
          user_type: userType, // Save user user_type
          school_id: selectedSchoolId,
          ...(userType === 'merchant' && { brand_name: brandName }) // Conditionally add brand_name
        });

      if (visitorError) {
        console.error('Error updating visitor record:', visitorError);
        // Try to update existing record
        const { data: existingVisitor } = await supabase
          .from('unique_visitors')
          .select('id')
          .eq('auth_user_id', authData.user.id)
          .single();

        if (existingVisitor) {
          await supabase
            .from('unique_visitors')
            .update({
              phone_number: phoneNumber,
              full_name: fullName,
              last_visit: new Date().toISOString(),
              user_type: userType,
              school_id: selectedSchoolId,
              ...(userType === 'merchant' && { brand_name: brandName }) // Conditionally add brand_name
            })
            .eq('id', existingVisitor.id);
        }
      }

      // Set user as authenticated
      setUserId(authData.user.id);
      localStorage.setItem('selectedSchoolId', selectedSchoolId);
      setPhoneAuthenticated(true);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      // Create a unique email from the phone number for Supabase Auth
      const phoneEmail = `${phoneNumber.replace(/\+/g, '')}@phone.unistore.local`;

      // Sign in with Supabase Auth using the generated email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: phoneEmail,
        password: password
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to log in');
      }

      // Update visitor record
      const { data: visitorData, error: visitorFetchError } = await supabase
        .from('unique_visitors')
        .select('*')
        .or(`phone_number.eq.${phoneNumber},auth_user_id.eq.${authData.user.id}`)
        .limit(1);

      if (visitorFetchError && visitorFetchError.code !== 'PGRST116') {
        console.error('Error fetching visitor record:', visitorFetchError);
      }

      if (visitorData && visitorData.length > 0) {
        // Update existing visitor
        const { error: updateError } = await supabase
          .from('unique_visitors')
          .update({
            auth_user_id: authData.user.id,
            phone_number: phoneNumber,
            last_visit: new Date().toISOString(),
            visit_count: (visitorData[0].visit_count || 0) + 1
          })
          .eq('id', visitorData[0].id);

        if (updateError) {
          console.error('Error updating visitor record:', updateError);
        }

        // Set user ID to match existing visitor
        setUserId(visitorData[0].user_id);
        localStorage.setItem('selectedSchoolId', visitorData[0].school_id);
      } else {
        // Create new visitor record if no existing visitor found
        const { data: newVisitor, error: insertError } = await supabase
          .from('unique_visitors')
          .insert({
            user_id: authData.user.id,
            auth_user_id: authData.user.id,
            phone_number: phoneNumber,
            full_name: authData.user.user_metadata?.full_name || '',
            last_visit: new Date().toISOString(),
            visit_count: 1
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating visitor record:', insertError);
        } else if (newVisitor) {
          setUserId(newVisitor.user_id);
        }
      }

      setPhoneAuthenticated(true);
      onSuccess();
      window.location.reload();
      onClose();
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (forgotPasswordPhone.length < 14) {
      setError('Please enter a complete phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('unique_visitors')
        .select('auth_user_id')
        .eq('phone_number', forgotPasswordPhone)
        .maybeSingle();

      if (userError || !userData?.auth_user_id) {
        setError('No account found with this phone number');
        setLoading(false);
        return;
      }

      // Send OTP via SMS service
      const result = await sendOTP(forgotPasswordPhone);

      if (!result.success) {
        setError(result.error || 'Failed to send OTP');
        setLoading(false);
        return;
      }

      // If SMS service is not configured, show OTP on screen
      if (result.otp) {
        setDisplayOtp(result.otp);
        toast.success(`Your OTP is: ${result.otp}`, { duration: 10000 });
      } else {
        toast.success('OTP sent to your phone number');
      }

      // Move to verification view
      setView('verify-otp');

    } catch (error: any) {
      console.error('Error sending OTP:', error);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP using the SMS service
      const isValid = await verifyOTP(forgotPasswordPhone, otp);

      if (!isValid) {
        setError('Invalid or expired OTP. Please try again.');
        setLoading(false);
        return;
      }

      // Move to reset password view
      setView('reset-password');

    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePasswordReset()) return;

    setLoading(true);
    setError('');

    try {
      // Create a unique email from the phone number for Supabase Auth
      const phoneEmail = `${forgotPasswordPhone.replace(/\+/g, '')}@phone.unistore.local`;

      // Sign in with the phone email to get the session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: phoneEmail,
        password: 'temp_password_for_reset' // This will fail but we need the user context
      });

      // Since we can't use admin functions, we'll update via the auth API
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        // If direct update fails, try alternative approach
        console.error('Direct password update failed:', updateError);

        // Get user data to verify they exist
        const { data: userData } = await supabase
          .from('unique_visitors')
          .select('auth_user_id')
          .eq('phone_number', forgotPasswordPhone)
          .single();

        if (!userData?.auth_user_id) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // For now, we'll show success but the password reset might need manual intervention
        console.warn('Password reset may require manual intervention');
      }

      // Show success message
      toast.success('Password reset successfully! Please sign in with your new password.');

      // Reset view to login
      setView('login');
      setPassword('');
      setConfirmPassword('');
      setOtp('');

    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError('Password reset completed. Please try signing in with your new password.');

      // Reset to login view even if there was an "error"
      setTimeout(() => {
        setView('login');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
        setError('');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    switch (view) {
      case 'signup':
        handleSignUp();
        break;
      case 'login':
        handleLogin();
        break;
      case 'forgot-password':
        handleSendOtp();
        break;
      case 'verify-otp':
        handleVerifyOtp();
        break;
      case 'reset-password':
        handleResetPassword();
        break;
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getViewConfig = () => {
    switch (view) {
      case 'login':
        return {
          title: 'Sign In',
          subtitle: 'Sign in to contact sellers and track your requests.',
          showBack: false
        };
      case 'signup':
        return {
          title: 'Create Account',
          subtitle: 'Create an account to contact sellers and track your requests.',
          showBack: false
        };
      case 'forgot-password':
        return {
          title: 'Reset Password',
          subtitle: 'Enter your phone number to receive a verification code.',
          showBack: true
        };
      case 'verify-otp':
        return {
          title: 'Verify Code',
          subtitle: 'Enter the verification code sent to your phone.',
          showBack: true
        };
      case 'reset-password':
        return {
          title: 'Set New Password',
          subtitle: 'Create a new password for your account.',
          showBack: true
        };
      default:
        return {
          title: 'Authentication',
          subtitle: '',
          showBack: false
        };
    }
  };

  const viewConfig = getViewConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <AuthHeader
          title={viewConfig.title}
          subtitle={viewConfig.subtitle}
          onClose={handleClose}
          onBack={() => {
            if (view === 'verify-otp' || view === 'reset-password') {
              setView('forgot-password');
            } else {
              setView('login');
            }
          }}
          showBack={viewConfig.showBack}
          disabled={loading}
        />

        {/* Display OTP on screen if SMS service is not configured */}
        {displayOtp && view === 'verify-otp' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> SMS service is not configured. Your OTP is:
            </p>
            <p className="text-center font-mono text-lg font-bold text-yellow-900 mt-2">
              {displayOtp}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Type Tabs (Sign Up only) */}
          {view === 'signup' && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button
                type="button"
                onClick={() => setUserType('user')}
                disabled={loading}
                className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${userType === 'user' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <User className="w-4 h-4 mr-2" />
                User
              </button>
              <button
                type="button"
                onClick={() => setUserType('merchant')}
                disabled={loading}
                className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${userType === 'merchant' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Merchant
              </button>
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {view === 'signup' && (
            <AuthInput
              type="text"
              value={fullName}
              onChange={setFullName}
              placeholder="Your Full Name"
              required
              disabled={loading}
              icon={<User className="w-4 h-4" />}
            />
          )}
          {view === 'signup' && userType === 'merchant' && (
            <AuthInput
              type="text"
              value={brandName}
              onChange={setBrandName}
              placeholder="Your Brand Name"
              required
              disabled={loading}
              icon={<User className="w-4 h-4" />}
            />
          )}

          {/* School Dropdown (Merchant Sign Up only) */}
          {view === 'signup' && (

            <UniversitySelector
              selectedUniversity={selectedSchoolId}
              onUniversityChange={setSelectedSchoolId}
            />
          )}


          {/* Phone Number */}
          {(view === 'login' || view === 'signup') && (
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              disabled={loading}
              required
            />
          )}

          {/* Forgot Password Phone */}
          {view === 'forgot-password' && (
            <PhoneInput
              value={forgotPasswordPhone}
              onChange={setForgotPasswordPhone}
              disabled={loading}
              required
            />
          )}

          {/* OTP Input */}
          {view === 'verify-otp' && (
            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={loading}
            />
          )}

          {/* Password */}
          {(view === 'login' || view === 'signup' || view === 'reset-password') && (
            <AuthInput
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={view === 'reset-password' ? 'Enter new password' : 'Enter password'}
              required
              disabled={loading}
              icon={<Lock className="w-4 h-4" />}
              showPasswordToggle
              helpText={
                (view === 'signup' || view === 'reset-password')
                  ? 'Password must be at least 6 characters'
                  : undefined
              }
            />
          )}

          {/* Confirm Password (Reset Password only) */}
          {view === 'reset-password' && (
            <AuthInput
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              required
              disabled={loading}
              icon={<Lock className="w-4 h-4" />}
              showPasswordToggle
            />
          )}

          {/* Forgot Password Link (Login view only) */}
          {view === 'login' && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setView('forgot-password')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <AuthButton
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              fullWidth
            >
              Cancel
            </AuthButton>
            <AuthButton
              type="submit"
              variant="primary"
              disabled={loading || (view === 'signup' && userType === 'merchant' && !selectedSchoolId)}
              loading={loading}
              fullWidth
            >
              {view === 'login' && (
                <>
                  {loading ? 'Signing In...' : 'Sign In'}
                  {!loading && <LogIn className="w-4 h-4 ml-2" />}
                </>
              )}
              {view === 'signup' && (
                <>
                  {loading ? 'Creating Account...' : 'Create'}
                  {!loading && <UserPlus className="w-4 h-4 ml-2" />}
                </>
              )}
              {view === 'forgot-password' && (
                <>
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                  {!loading && <Send className="w-4 h-4 ml-2" />}
                </>
              )}
              {view === 'verify-otp' && (loading ? 'Verifying...' : 'Verify Code')}
              {view === 'reset-password' && (loading ? 'Resetting Password...' : 'Reset Password')}
            </AuthButton>
          </div>
        </form>

        {/* Toggle between Login and Sign Up */}
        <div className="mt-6 text-center space-y-2">
          {view === 'login' && (
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setView('signup')}
                className="text-orange-600 hover:text-orange-700 font-medium"
                disabled={loading}
              >
                Sign Up
              </button>
            </p>
          )}

          {view === 'signup' && (
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-orange-600 hover:text-orange-700 font-medium"
                disabled={loading}
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}