import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, UserPlus, Send, Briefcase, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { setUserId, setPhoneAuthenticated } from '../hooks/useTracking';
import AuthHeader from './auth/AuthHeader';
import AuthInput from './auth/AuthInput';
import AuthButton from './auth/AuthButton';
import PhoneInput from './auth/PhoneInput';
import UniversitySelector from './UniversitySelector';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot-password' | 'check-email';
type UserType = 'user' | 'merchant';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('login');
  const [fullName, setFullName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+234');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [checkEmailMessage, setCheckEmailMessage] = useState('');

  // New state for user type and schools
  const [userType, setUserType] = useState<UserType>('user');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>("684c03a5-a18d-4df9-b064-0aaeee2a5f01");

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setView('login');
      setFullName('');
      setBrandName('');
      setPhoneNumber('+234');
      setPassword('');
      setError('');
      setForgotPasswordEmail('');
      setUserType('user'); // Reset user type on modal open
      setSelectedSchoolId(null);
      setAuthMethod('phone');
    }
  }, [isOpen]);

  const validateInputs = () => {
    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    // Validate inputs for login depending on method
    if (view === 'login') {
      if (authMethod === 'phone' && phoneNumber.length < 14) {
        setError('Please enter a complete phone number');
        return false;
      }
      if (authMethod === 'email' && !email.includes('@')) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    // Signup validations
    if (view === 'signup' && !fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }

    // New validation for merchant type
    if (view === 'signup' && userType === 'merchant' && !selectedSchoolId) {
      setError('Please select your school');
      return false;
    }

    // Make registering with email compulsory
    if (view === 'signup' && !email.includes('@')) {
      setError('Please provide a valid email address to register');
      return false;
    }

    return true;
  };



  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      // Use the provided email for signup (registration with email is compulsory)
      const signupEmail = email.trim();

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
        email: signupEmail,
        password: password,
        options: {
          data: userMetadata
        }
      });

      if (authError) {
        if (authError.message?.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
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
          email: signupEmail,
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
              email: signupEmail,
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
      localStorage.setItem('selectedSchoolId', selectedSchoolId ?? '');
      setPhoneAuthenticated(true);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Sign up error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      // Determine login email depending on chosen method
      const loginEmail = authMethod === 'email' ? email.trim() : `${phoneNumber.replace(/\+/g, '')}@phone.unistore.local`;

      // Sign in with Supabase Auth using the selected email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
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
    } catch (err) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!forgotPasswordEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use Supabase to send a password reset email
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/update-password`
      });

      console.log(data);

      if (resetError) {
        console.error('Supabase reset error:', resetError);
        setError(resetError.message || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setCheckEmailMessage(`A password reset link was sent to ${forgotPasswordEmail}. Check your email and follow the instructions.`);
      setView('check-email');
    } catch (err) {
      console.error('Error sending reset email:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // The reset flow is handled by Supabase sending a reset link to the user's email.

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
          subtitle: 'Enter your email address to receive a password reset link.',
          showBack: true
        };
      case 'check-email':
        return {
          title: 'Check your email',
          subtitle: checkEmailMessage || 'We sent a password reset link to your email.',
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
            if (view === 'check-email') {
              setView('forgot-password');
            } else {
              setView('login');
            }
          }}
          showBack={viewConfig.showBack}
          disabled={loading}
        />

        {/* Display OTP on screen if SMS service is not configured */}


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
              selectedUniversity={selectedSchoolId ?? ''}
              onUniversityChange={(id: string) => setSelectedSchoolId(id)}
            />
          )}

          {(view === 'login' || view === 'signup') && (
            <>
              {view === 'login' && (
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('phone')}
                    disabled={loading}
                    className={`px-3 py-1 rounded-md text-sm ${authMethod === 'phone' ? 'bg-orange-100 text-orange-700' : 'bg-white border'}`}
                  >
                    Use phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('email')}
                    disabled={loading}
                    className={`px-3 py-1 rounded-md text-sm ${authMethod === 'email' ? 'bg-orange-100 text-orange-700' : 'bg-white border'}`}
                  >
                    Use email
                  </button>
                </div>
              )}

              {/* Email input - always visible on signup; visible on login when authMethod === 'email' */}
              {(view === 'signup' || authMethod === 'email') && (
                <AuthInput
                  type="text"
                  value={email}
                  onChange={setEmail}
                  placeholder="Your Email"
                  required={view === 'signup'}
                  disabled={loading}
                  icon={<Mail className="w-4 h-4" />}
                />
              )}

              {/* Phone input - always visible on signup; visible on login when authMethod === 'phone' */}
              {(view === 'signup' || authMethod === 'phone') && (
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  disabled={loading}
                  required={view === 'signup' || authMethod === 'phone'}
                />
              )}
            </>
          )}


          {/* Forgot Password Phone */}
          {view === 'forgot-password' && (
            <AuthInput
              type="text"
              value={forgotPasswordEmail}
              onChange={setForgotPasswordEmail}
              placeholder="Your Email"
              required
              disabled={loading}
              icon={<User className="w-4 h-4" />}
            />

          )}

          {view === 'check-email' && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-800">{checkEmailMessage || 'A password reset link was sent. Check your email.'}</p>
            </div>
          )}

          {/* Password */}
          {(view === 'login' || view === 'signup') && (
            <AuthInput
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={'Enter password'}
              required
              disabled={loading}
              icon={<Lock className="w-4 h-4" />}
              showPasswordToggle
              helpText={
                'Password must be at least 6 characters'

              }
            />
          )}

          {/* Confirm Password (Reset Password only) */}
          {/** reset handled via email link; no in-modal reset UI **/}

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
                  {loading ? 'Sending link...' : 'Send reset link'}
                  {!loading && <Send className="w-4 h-4 ml-2" />}
                </>
              )}
              {view === 'check-email' && (loading ? 'Processing...' : 'Ok')}
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