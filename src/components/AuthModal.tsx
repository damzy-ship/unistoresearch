import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, UserPlus, Send, Briefcase, Mail, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { setUserId, setPhoneAuthenticated, getUserId } from '../hooks/useTracking';
import PhoneInput from './auth/PhoneInput';
import UniversitySelector from './UniversitySelector';
import { AppDrawer } from './ui/Drawer';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
      const signupEmail = email.trim();
      // 1. Get the current anonymous ID stored in local storage BEFORE auth call
      const currentLocalUserId = await getUserId();

      // Prepare user metadata for Supabase Auth
      const userMetadata = {
        full_name: fullName,
        phone_number: phoneNumber,
        user_type: userType,
        school_id: selectedSchoolId,
        ...(userType === 'merchant' && { brand_name: brandName })
      };

      function isValidNigerianPhoneNumber(phoneNumber: string) {
        const regex = /^\+234\d{10}$/;

        return regex.test(phoneNumber);
      }


      if (isValidNigerianPhoneNumber(phoneNumber) === false) {
        // console.log(phoneNumber)
        setError('Phone number not provided or invalid');
        return;
      }
      // Sign up with Supabase Auth
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

      const newAuthUserId = authData.user.id;


      localStorage.setItem('selectedSchoolId', selectedSchoolId ?? '');

      // **3. Merge/Upsert Visitor Record**

      // Check for an existing anonymous record with the user's old local ID
      const { data: existingAnonVisitor } = await supabase
        .from('unique_visitors')
        .select('id, visit_count')
        .eq('user_id', currentLocalUserId) // Check using the old local ID
        .limit(1)
        .maybeSingle();

      if (existingAnonVisitor) {
        // **A. Found anonymous record: Attempt to merge its history by updating it**
        const mergePayload = {
          auth_user_id: newAuthUserId,
          phone_number: phoneNumber,
          email: signupEmail,
          full_name: fullName,
          user_type: userType,
          school_id: selectedSchoolId,
          last_visit: new Date().toISOString(),
          visit_count: existingAnonVisitor.visit_count + 1, // Keep old visits + 1 for sign-up
          ...(userType === 'merchant' && { brand_name: brandName })
        };

        const { error: updateError } = await supabase
          .from('unique_visitors')
          .update(mergePayload)
          .eq('id', existingAnonVisitor.id);

        if (updateError) {
          // If the merge update fails, we warn and let the final upsert handle creation/update.
          console.warn('Warning: Failed to merge anonymous record on sign-up.', updateError);
        } else {
          // **2. Set the permanent Auth ID in local storage immediately**
          setUserId(newAuthUserId, existingAnonVisitor.id);
        }
      }

      // **B. Final Insert/Upsert:** Guarantees a canonical authenticated record exists.
      // This runs whether a merge happened, failed, or no anonymous record existed.
      const finalRecordPayload = {
        user_id: newAuthUserId, // Auth ID is now the permanent user_id
        auth_user_id: newAuthUserId,
        phone_number: phoneNumber,
        email: signupEmail,
        full_name: fullName,
        last_visit: new Date().toISOString(),
        visit_count: 1, // Start count at 1 (if new record)
        user_type: userType,
        school_id: selectedSchoolId,
        ...(userType === 'merchant' && { brand_name: brandName })
      };

      // Use upsert on the canonical key (auth_user_id) to ensure exactly one record exists.
      const { data: upsertUserData, error: upsertError } = await supabase
        .from('unique_visitors')
        .upsert(finalRecordPayload, { onConflict: 'auth_user_id', ignoreDuplicates: false })
        .select('id')
        .single();

      if (upsertError) {
        console.error('Error ensuring final visitor record on sign up:', upsertError);
      } else {
        // **2. Set the permanent Auth ID in local storage immediately**
        setUserId(newAuthUserId, upsertUserData?.id);
      }

      // Final steps
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

      const { data: userDataFromUniqueVisitors } = await supabase.from('unique_visitors').select('email, id').eq('phone_number', phoneNumber).single();

      let loginEmail = authMethod === 'email' ? email.trim() : `${phoneNumber.replace(/\+/g, '')}@phone.unistore.local`;

      if (userDataFromUniqueVisitors && userDataFromUniqueVisitors.email && phoneNumber.length > 7) {
        loginEmail = userDataFromUniqueVisitors.email;
      }

      // 1. Sign in with Supabase Auth
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

      const loggedInAuthUserId = authData.user.id;

      // **NEW: Consolidate data from Auth Metadata**
      const identities = authData.user.identities;
      const authMetadata = (identities && identities[0] ? identities[0].identity_data : {}) || {};
      const existingPhoneNumber = authMetadata.phone_number || '';
      const existingFullName = authMetadata.full_name || '';

      // Determine the phone number to save: Use the one from the form if provided, otherwise use the existing one.
      // NOTE: 'phoneNumber' state might be empty if logging in with email.
      const finalPhoneNumber = existingPhoneNumber;

      // Determine the email to save: Use the one from the auth session if the user logged in via phone number alias.
      const finalEmail = authData.user.email || '';

      // **2. Set the permanent Auth ID in local storage immediately**
      setUserId(loggedInAuthUserId, userDataFromUniqueVisitors?.id);
      setPhoneAuthenticated(true);

      // **3. Update Visitor Record**

      // The preferred way to find a visitor record for a logged-in user is by Auth ID.
      const { data: visitorData, error: visitorFetchError } = await supabase
        .from('unique_visitors')
        .select('id, user_id, school_id, visit_count, phone_number, email')
        .eq('auth_user_id', loggedInAuthUserId)
        .limit(1);

      if (visitorFetchError && visitorFetchError.code !== 'PGRST116') {
        console.error('Error fetching visitor record:', visitorFetchError);
      }

      let schoolIdToSet = '';

      if (visitorData && visitorData.length > 0) {
        // **A. Update existing visitor**
        const existingVisitor = visitorData[0];
        schoolIdToSet = existingVisitor.school_id;

        // Only update fields that should change (visit count, time, and potentially phone/email if they changed)
        const updatePayload = {
          last_visit: new Date().toISOString(),
          visit_count: (existingVisitor.visit_count || 0) + 1,
          email: finalEmail,
          phone_number: finalPhoneNumber,
        };

        const { error: updateError } = await supabase
          .from('unique_visitors')
          .update(updatePayload)
          .eq('id', existingVisitor.id);

        if (updateError) {
          console.error('Error updating visitor record on login:', updateError);
        }

      } else {
        // **B. Create new visitor record** (Crucial Safety Net)
        const { data: newVisitor, error: insertError } = await supabase
          .from('unique_visitors')
          .insert({
            user_id: loggedInAuthUserId,
            auth_user_id: loggedInAuthUserId,
            // phone_number: finalPhoneNumber, // Use the consolidated data
            // email: finalEmail,             // Use the consolidated data
            full_name: existingFullName,
            last_visit: new Date().toISOString(),
            visit_count: 1
          })
          .select('school_id')
          .single();

        if (insertError) {
          console.error('Error creating visitor record on login:', insertError);
        } else if (newVisitor) {
          schoolIdToSet = newVisitor.school_id;
        }
      }

      // Final steps
      localStorage.setItem('selectedSchoolId', schoolIdToSet ?? '');
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/update-password`
      });

      // console.log(data);

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

  const getViewConfig = () => {
    switch (view) {
      case 'login':
        return {
          title: 'Sign In',
          subtitle: 'Sign in to contact sellers.',
          showBack: false
        };
      case 'signup':
        return {
          title: 'Create Account',
          subtitle: 'Create an account to get started.',
          showBack: false
        };
      case 'forgot-password':
        return {
          title: 'Reset Password',
          subtitle: 'Enter your email address.',
          showBack: true
        };
      case 'check-email':
        return {
          title: 'Check your email',
          subtitle: checkEmailMessage || 'We sent a password reset link.',
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
    <AppDrawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={viewConfig.title}
      description={viewConfig.subtitle}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-6 overflow-y-auto px-1">

        {/* School Dropdown */}
        {view === 'signup' && (
          <UniversitySelector
            selectedUniversity={selectedSchoolId ?? ''}
            onUniversityChange={(id: string) => setSelectedSchoolId(id)}
          />
        )}

        {/* User Type Tabs (Sign Up only) */}
        {view === 'signup' && (
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
            <button
              type="button"
              onClick={() => setUserType('user')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors text-sm font-medium ${userType === 'user' ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <User className="w-4 h-4 mr-2" />
              User
            </button>
            <button
              type="button"
              onClick={() => setUserType('merchant')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors text-sm font-medium ${userType === 'merchant' ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Merchant
            </button>
          </div>
        )}

        {/* Full Name (Sign Up only) */}
        {view === 'signup' && (
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            required
            disabled={loading}
            icon={<User className="w-4 h-4" />}
          />
        )}

        {view === 'signup' && userType === 'merchant' && (
          <Input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Brand Name"
            required
            disabled={loading}
            icon={<Tag className="w-4 h-4" />}
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
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${authMethod === 'phone' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  Use phone
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  disabled={loading}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${authMethod === 'email' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  Use email
                </button>
              </div>
            )}

            {/* Email input */}
            {(view === 'signup' || authMethod === 'email') && (
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required={view === 'signup'}
                disabled={loading}
                icon={<Mail className="w-4 h-4" />}
              />
            )}

            {/* Phone input */}
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
          <Input
            type="text"
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            placeholder="Your Email"
            required
            disabled={loading}
            icon={<Mail className="w-4 h-4" />}
          />
        )}

        {view === 'check-email' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">{checkEmailMessage || 'A password reset link was sent. Check your email.'}</p>
          </div>
        )}

        {/* Password */}
        {(view === 'login' || view === 'signup') && (
          <div className="space-y-1">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={'Enter password'}
              required
              disabled={loading}
              icon={<Lock className="w-4 h-4" />}
            />
            <p className="text-xs text-gray-500 ml-1">At least 6 characters</p>
          </div>
        )}

        {/* Forgot Password Link (Login view only) */}
        {view === 'login' && (
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => setView('forgot-password')}
              className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium"
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {viewConfig.showBack && (
            <Button
              variant="outline"
              onClick={() => {
                if (view === 'check-email') setView('forgot-password');
                else setView('login');
              }}
              disabled={loading}
              className="w-full"
            >
              Back
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading || (view === 'signup' && userType === 'merchant' && !selectedSchoolId)}
            loading={loading}
            className="w-full"
          >
            {view === 'login' && (
              <>
                Sign In <LogIn className="w-4 h-4 ml-2" />
              </>
            )}
            {view === 'signup' && (
              <>
                Create Account <UserPlus className="w-4 h-4 ml-2" />
              </>
            )}
            {view === 'forgot-password' && (
              <>
                Send Link <Send className="w-4 h-4 ml-2" />
              </>
            )}
            {view === 'check-email' && 'Close'}
          </Button>
        </div>
      </form>

      {/* Toggle between Login and Sign Up */}
      {(view === 'login' || view === 'signup') && (
        <div className="mt-4 text-center space-y-2 pb-4">
          {view === 'login' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setView('signup')}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium"
                disabled={loading}
              >
                Sign Up
              </button>
            </p>
          )}

          {view === 'signup' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium"
                disabled={loading}
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      )}
    </AppDrawer>
  );
}