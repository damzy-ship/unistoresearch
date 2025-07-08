import React, { useState, useEffect } from 'react';
import { X, User, Phone, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { setUserId, setPhoneAuthenticated } from '../hooks/useTracking';
import { sendOTP, verifyOTP } from '../lib/smsService';
import { toast } from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-password';
type ForgotPasswordState = 'input' | 'verify' | 'reset';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('login');
  const [forgotPasswordView, setForgotPasswordView] = useState<ForgotPasswordState>('input');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+234');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [displayOtp, setDisplayOtp] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState('+234');
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setView('login');
      setForgotPasswordView('input');
      setFullName('');
      setPhoneNumber('+234');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setDisplayOtp(null);
      setConfirmPassword('');
      setOtp('');
      setError('');
      setResetToken('');
      setForgotPasswordPhone('+234');
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    } else {
      setCanResendOtp(true);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCountdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure it always starts with +234
    if (!value.startsWith('+234')) {
      value = '+234';
    }
    
    // Remove any non-digit characters except the + at the beginning
    value = '+234' + value.slice(4).replace(/\D/g, '');
    
    // Limit to +234 + 10 digits
    if (value.length > 14) {
      value = value.slice(0, 14);
    }
    
    // Ensure the first digit after +234 is not 0
    if (value.length > 4 && value[4] === '0') {
      value = '+234' + value.slice(5);
    }
    
    setPhoneNumber(value);
  };

  const handleForgotPasswordPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure it always starts with +234
    if (!value.startsWith('+234')) {
      value = '+234';
    }
    
    // Remove any non-digit characters except the + at the beginning
    value = '+234' + value.slice(4).replace(/\D/g, '');
    
    // Limit to +234 + 10 digits
    if (value.length > 14) {
      value = value.slice(0, 14);
    }
    
    // Ensure the first digit after +234 is not 0
    if (value.length > 4 && value[4] === '0') {
      value = '+234' + value.slice(5);
    }
    
    setForgotPasswordPhone(value);
  };

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

  const handleRequestOTP = async () => {
    if (!validatePasswordReset()) return;

    setLoading(true);
    setError('');
    setDisplayOtp(null);

    try {
      // Send OTP via SMS
      const result = await sendOTP(phoneNumber);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send OTP');
      }
      
      // If SMS service is not configured, display OTP on screen
      if (result.otp) {
        setDisplayOtp(result.otp);
        toast.success(`Your OTP is: ${result.otp}`, { duration: 10000 });
      } else {
        toast.success('OTP sent to your phone number');
      }
      
      // Move to OTP verification view
      setView('verify-otp');
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setError(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP
      const isValid = await verifyOTP(phoneNumber, otp);
      
      if (!isValid) {
        throw new Error('Invalid or expired OTP');
      }
      
      // Move to reset password view
      setView('reset-password');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      // Create a unique email from the phone number for Supabase Auth
      // This is a workaround since we're using email auth but want to authenticate with phone
      const phoneEmail = `${phoneNumber.replace(/\+/g, '')}@phone.unistore.local`;
      
      // Sign up with Supabase Auth using the generated email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: phoneEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber
          }
        }
      });

      if (authError) {
        throw authError;
      }
      
      if (authError?.message?.includes('already registered')) {
        setError('An account with this phone number already exists. Please sign in instead.');
        return;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create or update visitor record
      const { error: visitorError } = await supabase
        .from('unique_visitors')
        .insert({
          user_id: authData.user.id, // Use Auth user ID as user_id
          auth_user_id: authData.user.id,
          phone_number: phoneNumber,
          full_name: fullName,
          last_visit: new Date().toISOString(),
          visit_count: 1
        });

      if (visitorError) {
        console.error('Error updating visitor record:', visitorError);
      }
      
      // If insert fails, try to update the existing record
      if (visitorError) {
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
              last_visit: new Date().toISOString()
            })
            .eq('id', existingVisitor.id);
        }
      }

      // Set user as authenticated
      setUserId(authData.user.id);
      setPhoneAuthenticated(true);
      
      onSuccess();
      onClose();
    } catch (error) {
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
    } catch (error) {
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
      // Create a unique email from the phone number for Supabase Auth
      const phoneEmail = `${forgotPasswordPhone.replace(/\+/g, '')}@phone.unistore.local`;
      
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
      
      // Generate a 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Try to send OTP via SMS
      const smsSent = await sendOTP(forgotPasswordPhone, generatedOtp);
      
      if (!smsSent) {
        // Fallback: show OTP in toast for demo purposes
        toast.success(`Your OTP is: ${generatedOtp}`, {
          duration: 10000,
        });
      }
      
      // Store the OTP in localStorage (in a real app, this would be handled securely on the server)
      localStorage.setItem(`otp_${forgotPasswordPhone}`, generatedOtp);
      localStorage.setItem(`otp_token_${forgotPasswordPhone}`, Date.now().toString());
      
      // Set the reset token
      setResetToken(userData.auth_user_id);
      
      // Move to verification view
      setForgotPasswordView('verify');
      
      // Start countdown for resend
      setCanResendOtp(false);
      setResendCountdown(30);
      
    } catch (error) {
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
      // Get the stored OTP
      const storedOtp = localStorage.getItem(`otp_${forgotPasswordPhone}`);
      
      if (storedOtp !== otp) {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }
      
      // Move to reset password view
      setForgotPasswordView('reset');
      
    } catch (error) {
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
      
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }
      
      // Clear stored OTP
      localStorage.removeItem(`otp_${forgotPasswordPhone}`);
      localStorage.removeItem(`otp_token_${forgotPasswordPhone}`);
      
      // Show success message
      toast.success('Password reset successfully! Please sign in with your new password.');
      
      // Reset view to login
      setView('login');
      setForgotPasswordView('input');
      setPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    
    setLoading(true);
    
    try {
      // Generate a new 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Try to send OTP via SMS
      const smsSent = await sendOTP(forgotPasswordPhone, generatedOtp);
      
      if (!smsSent) {
        // Fallback: show OTP in toast for demo purposes
        toast.success(`Your new OTP is: ${generatedOtp}`, {
          duration: 10000,
        });
      }
      
      // Store the new OTP
      localStorage.setItem(`otp_${forgotPasswordPhone}`, generatedOtp);
      localStorage.setItem(`otp_token_${forgotPasswordPhone}`, Date.now().toString());
      
      // Start countdown for resend
      setCanResendOtp(false);
      setResendCountdown(30);
      
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.error('Failed to resend OTP. Please try again.');
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
        handleRequestOTP();
        break;
      case 'verify-otp':
        handleVerifyOTP();
        break;
      case 'reset-password':
        handleResetPassword();
        break;
    }
  };

  const renderForgotPasswordContent = () => {
    switch (forgotPasswordView) {
      case 'input':
        return (
          <>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Enter your phone number to receive a verification code.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                value={forgotPasswordPhone}
                onChange={handleForgotPasswordPhoneChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors font-mono"
                placeholder="+234 123 456 7890"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nigerian phone number format: +234XXXXXXXXX
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setView('login')}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Back to Login
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || forgotPasswordPhone.length < 14}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </>
        );
        
      case 'verify':
        return (
          <>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Enter the 6-digit verification code sent to your phone.
              </p>
              <p className="text-sm text-gray-500">
                Phone: {forgotPasswordPhone}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors font-mono text-center text-lg tracking-widest"
                placeholder="000000"
                required
                disabled={loading}
                maxLength={6}
              />
              
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={() => setForgotPasswordView('input')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                  disabled={loading}
                >
                  Change phone number
                </button>
                
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResendOtp || loading}
                  className={`text-sm ${canResendOtp ? 'text-orange-600 hover:text-orange-700' : 'text-gray-400'} flex items-center gap-1`}
                >
                  {canResendOtp ? (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Resend code
                    </>
                  ) : (
                    `Resend in ${resendCountdown}s`
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setView('login')}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </>
        );
        
      case 'reset':
        return (
          <>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Create a new password for your account.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors pr-12"
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors pr-12"
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setView('login')}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || !password || !confirmPassword}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </>
        );
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Render forgot password flow
  if (view === 'forgot-password') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Reset Password
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {renderForgotPasswordContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {view === 'login' && 'Sign In'}
            {view === 'signup' && 'Create Account'}
            {view === 'forgot-password' && 'Reset Password'}
            {view === 'verify-otp' && 'Verify OTP'}
            {view === 'reset-password' && 'Set New Password'}
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            {view === 'login' && 'Sign in to contact sellers and track your requests.'}
            {view === 'signup' && 'Create an account to contact sellers and track your requests.'}
            {view === 'forgot-password' && 'Enter your phone number to receive a verification code.'}
            {view === 'verify-otp' && 'Enter the verification code sent to your phone.'}
            {view === 'reset-password' && 'Create a new password for your account.'}
          </p>
          
          {/* Back Button for multi-step flows */}
          {(view === 'forgot-password' || view === 'verify-otp' || view === 'reset-password') && (
            <button
              type="button"
              onClick={() => view === 'verify-otp' ? setView('forgot-password') : setView('login')}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Sign Up only) */}
          {view === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Phone Number */}
          {(view === 'login' || view === 'signup' || view === 'forgot-password') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors font-mono"
                placeholder="+234 123 456 7890"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nigerian phone number format: +234XXXXXXXXX
              </p>
            </div>
          )}

          {/* OTP Input */}
          {view === 'verify-otp' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors font-mono text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code sent to your phone
              </p>
            </div>
          )}

          {/* Password */}
          {(view === 'login' || view === 'signup' || view === 'reset-password') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                {view === 'reset-password' ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors pr-12"
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(view === 'signup' || view === 'reset-password') ? 'Password must be at least 6 characters' : ''}
              </p>
            </div>
          )}

          {/* Confirm Password (Reset Password only) */}
          {view === 'reset-password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors pr-12"
                  placeholder="Confirm password"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
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
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              
              {view === 'login' && (loading ? 'Signing In...' : 'Sign In')}
              {view === 'signup' && (loading ? 'Creating Account...' : 'Create Account')}
              {view === 'forgot-password' && (loading ? 'Sending Code...' : 'Send Verification Code')}
              {view === 'verify-otp' && (loading ? 'Verifying...' : 'Verify Code')}
              {view === 'reset-password' && (loading ? 'Resetting Password...' : 'Reset Password')}
              
              {!loading && view === 'login' && <LogIn className="w-4 h-4 ml-2" />}
              {!loading && view === 'signup' && <UserPlus className="w-4 h-4 ml-2" />}
              {!loading && view === 'forgot-password' && <Send className="w-4 h-4 ml-2" />}
              {!loading && view === 'verify-otp' && <ArrowLeft className="w-4 h-4 ml-2" />}
              {!loading && view === 'reset-password' && <Lock className="w-4 h-4 ml-2" />}
            </button>
          </div>
        </form>

        {/* Toggle between Login and Sign Up */}
        <div className="mt-6 text-center space-y-2">
          {view === 'login' && (
            <>
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
            </>
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