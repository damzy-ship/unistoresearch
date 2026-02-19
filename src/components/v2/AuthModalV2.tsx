import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { setUserId, setPhoneAuthenticated, getUserId } from '../../hooks/useTracking';
import { toast } from 'sonner';

interface AuthModalV2Props {
    isOpen: boolean;
    onClose: () => void;
    initialView?: AuthView;
}

type AuthView = 'signin' | 'signup' | 'otp' | 'forgot' | 'check-email' | 'update-password';

export const AuthModalV2: React.FC<AuthModalV2Props> = ({ isOpen, onClose, initialView }) => {
    const [view, setView] = useState<AuthView>(initialView || 'signin');

    useEffect(() => {
        if (initialView) {
            setView(initialView);
        }
    }, [initialView]);
    const [method, setMethod] = useState<'email' | 'phone'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('+234');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userType, setUserType] = useState<'user' | 'merchant'>('user');
    const [brandName, setBrandName] = useState('');
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>("684c03a5-a18d-4df9-b064-0aaeee2a5f01"); // Default Bingham
    const [checkEmailMessage, setCheckEmailMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setView('signin');
            setError('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Support phone-based alias login like V1
            let loginEmail = method === 'email' ? email.trim() : `${phone.replace(/\+/g, '')}@phone.unistore.local`;

            // Check if phone has a custom email in unique_visitors first (V1 logic)
            if (method === 'phone') {
                const { data: vData } = await supabase.from('unique_visitors').select('email, id').eq('phone_number', phone).single();
                if (vData?.email) loginEmail = vData.email;
            }

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: password
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Login failed');

            // Set IDs and tracking
            const { data: visitorData } = await supabase.from('unique_visitors').select('id').eq('auth_user_id', authData.user.id).single();
            setUserId(authData.user.id, visitorData?.id || '');
            setPhoneAuthenticated(true);

            toast.success('Successfully signed in');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setError('Valid email required');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const currentLocalUserId = await getUserId();
            console.log('Current local user ID for merge:', currentLocalUserId);
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        phone_number: phone,
                        user_type: userType,
                        school_id: selectedSchoolId,
                        ...(userType === 'merchant' && { brand_name: brandName })
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Signup failed');

            const newAuthUserId = authData.user.id;

            // Merge/Upsert visitor record like V1
            const finalRecordPayload = {
                user_id: newAuthUserId,
                auth_user_id: newAuthUserId,
                phone_number: phone,
                email: email.trim(),
                full_name: fullName,
                last_visit: new Date().toISOString(),
                visit_count: 1,
                user_type: userType,
                school_id: selectedSchoolId,
                ...(userType === 'merchant' && { brand_name: brandName })
            };

            const { data: upsertData } = await supabase
                .from('unique_visitors')
                .upsert(finalRecordPayload, { onConflict: 'auth_user_id' })
                .select('id')
                .single();

            setUserId(newAuthUserId, upsertData?.id || '');
            setPhoneAuthenticated(true);

            toast.success('Account created! Welcome.');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Signup failed');
            toast.error(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password: password });
            if (updateError) throw updateError;

            toast.success('Password updated successfully');
            setTimeout(() => {
                onClose();
                window.location.href = '/v2/hostel';
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
            toast.error(err.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/v2/update-password`
            });

            if (resetError) throw resetError;

            setCheckEmailMessage(`A password reset link was sent to ${email}. Check your email and follow the instructions.`);
            setView('check-email');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
            toast.error(err.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderSignIn = () => (
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 md:p-10 border border-primary/10 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-2xl">shopping_bag</span>
                    </div>
                    <span className="font-black text-2xl tracking-tighter">
                        <span className="text-primary">Uni</span>
                        <span className="text-[#0c6eed] dark:text-blue-400">Store</span>
                        <span className="text-primary">.</span>
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Sign In</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
                    Sign in to contact sellers and track your requests.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            {/* Toggle Segmented Control */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 mb-8 rounded-lg">
                <button
                    onClick={() => setMethod('email')}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-lg ${method === 'email' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                >
                    Use email
                </button>
                <button
                    onClick={() => setMethod('phone')}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all rounded-lg ${method === 'phone' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                >
                    Use phone
                </button>
            </div>

            {/* Sign In Form */}
            <form className="space-y-5" onSubmit={handleLogin}>
                {method === 'email' ? (
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Email</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">mail</span>
                            <input
                                className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                                placeholder="Enter your email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Phone Number</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">phone_iphone</span>
                            <input
                                className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                                placeholder="+234 812 345 6789"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                        <button
                            type="button"
                            onClick={() => setView('forgot')}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">lock</span>
                        <input
                            className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                            placeholder="Enter your password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <button
                        disabled={loading}
                        className="w-full h-14 bg-primary text-white font-bold hover:bg-primary/90 hover:scale-[0.99] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                    <button onClick={onClose} type="button" className="w-full h-14 bg-transparent text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-lg">
                        Cancel
                    </button>
                </div>
            </form>

            {/* Social Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-4 text-zinc-400 font-medium whitespace-nowrap">Or continue with</span>
                </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="flex items-center justify-center h-14 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all gap-3 rounded-xl active:scale-95 group">
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Google</span>
                </button>
                <button className="flex items-center justify-center h-14 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all gap-3 rounded-xl active:scale-95 group">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform fill-zinc-900 dark:fill-white" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-31.4-57.3-114.7-57.3-114.7v-.1zM232.1 35.6C239.1 16.4 260.8 4 282 4c2.1 0 4.2.1 6.3.4 3.1 24.5-8.1 52-20.4 68.3-14.4 17.9-38.1 30.8-62.7 30.8-2.1 0-4.2-.1-6.3-.4-3.1-25.5 8-52.5 19.3-68 3.5-4.9 8.2-10 13.9-15.5z" />
                    </svg>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Apple</span>
                </button>
            </div>

            <div className="text-center pb-2">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Don't have an account?
                    <button onClick={() => setView('signup')} className="text-primary font-bold hover:underline underline-offset-4 ml-1">Sign Up</button>
                </p>
            </div>
        </div>
    );

    const renderSignUp = () => (
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 md:p-10 border border-primary/10 animate-in slide-in-from-right duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-primary text-2xl">shopping_bag</span>
                        </div>
                        <span className="font-black text-2xl tracking-tighter">
                            <span className="text-primary">Uni</span>
                            <span className="text-[#0c6eed] dark:text-blue-400">Store</span>
                            <span className="text-primary">.</span>
                        </span>
                    </div>
                    <button onClick={() => setView('signin')} className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-1 group text-sm font-bold">
                        <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
                        Back
                    </button>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Create Account</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
                    Join our community to start shopping and selling.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            <div className="space-y-6 mb-8">
                <div>
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1 mb-2 block">University</label>
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setSelectedSchoolId("684c03a5-a18d-4df9-b064-0aaeee2a5f01")}
                            className={`flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${selectedSchoolId === "684c03a5-a18d-4df9-b064-0aaeee2a5f01" ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                        >
                            Bingham
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedSchoolId("a7741870-1798-466f-87d2-748446b404f2")}
                            className={`flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${selectedSchoolId === "a7741870-1798-466f-87d2-748446b404f2" ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                        >
                            Veritas
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1 mb-2 block">Account Type</label>
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setUserType('user')}
                            className={`flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${userType === 'user' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                        >
                            User
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType('merchant')}
                            className={`flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${userType === 'merchant' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                        >
                            Merchant
                        </button>
                    </div>
                </div>
            </div>

            <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Full Name</label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors font-light">person</span>
                        <input
                            className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                            placeholder="Enter your full name"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Email</label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors font-light">mail</span>
                        <input
                            className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                            placeholder="Enter your email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Phone Number</label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors font-light">phone_iphone</span>
                        <input
                            className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                            placeholder="Enter your phone number"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {userType === 'merchant' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Brand Name</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors font-light">store</span>
                            <input
                                className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                                placeholder="Enter your business name"
                                type="text"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Password</label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors font-light">lock</span>
                        <input
                            className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                            placeholder="Create a password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="pt-6 flex flex-col gap-3">
                    <button
                        disabled={loading}
                        className="w-full h-14 bg-primary text-white font-bold hover:bg-primary/90 hover:scale-[0.99] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                    <button onClick={onClose} type="button" className="w-full h-14 bg-transparent text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-lg">
                        Cancel
                    </button>
                </div>
            </form>

            <p className="text-center text-xs text-gray-500 mt-8 pb-4">
                By creating an account, you agree to our <br />
                <a className="text-primary font-medium hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-medium hover:underline" href="#">Privacy Policy</a>.
            </p>
        </div>
    );

    const renderOTP = () => (
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-primary/10 overflow-hidden animate-in fade-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center px-6 py-4 justify-between border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <button onClick={() => setView('signup')} className="text-zinc-600 dark:text-zinc-400 flex size-10 shrink-0 items-center hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors justify-center">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                        <span className="text-white text-[10px] font-black">U</span>
                    </div>
                    <h2 className="text-[#181311] dark:text-white text-lg font-black leading-tight tracking-tighter">UniStore.</h2>
                </div>
                <div className="size-10"></div>
            </div>

            <div className="px-6 py-10 md:px-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                        <span className="material-symbols-outlined text-primary text-3xl">sms</span>
                    </div>
                    <h2 className="text-[#181311] dark:text-white tracking-tight text-2xl md:text-3xl font-bold mb-3">Verify Your Phone</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                        Enter the 6-digit code sent to <span className="font-semibold text-[#181311] dark:text-white">+234 812 *** 4567</span>
                    </p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="flex gap-2 sm:gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <input
                                key={i}
                                className="flex h-12 w-10 sm:h-14 sm:w-12 text-center text-xl font-bold rounded-lg border-2 border-gray-200 dark:border-white/10 bg-transparent focus:border-primary focus:ring-0 transition-all dark:text-white outline-none"
                                maxLength={1}
                                type="text"
                                inputMode="numeric"
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <button onClick={onClose} className="flex w-full cursor-pointer items-center justify-center rounded-lg h-14 px-5 bg-primary hover:bg-primary/90 text-white text-base font-bold transition-all shadow-lg shadow-primary/20">
                        Verify & Continue
                    </button>
                    <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Didn't receive the code?
                            <button className="text-primary font-semibold hover:underline ml-1">Resend Code (0:59)</button>
                        </p>
                    </div>
                </div>

                <div className="mt-12 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl flex items-start gap-3 border border-primary/10 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">info</span>
                    <p className="text-xs md:text-sm text-primary/80 dark:text-primary/90 leading-relaxed font-medium">
                        Make sure you're using a phone number that can receive SMS. Carrier charges may apply.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderForgotPassword = () => (
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 md:p-10 border border-primary/10 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="mb-8">
                <button onClick={() => setView('signin')} className="mb-6 text-zinc-400 hover:text-primary transition-colors flex items-center gap-2 group">
                    <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Sign In</span>
                </button>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Reset Password</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
                    Enter your email address to receive a password reset link.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            <form className="space-y-6" onSubmit={handleResetPassword}>
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Email Address</label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">mail</span>
                        <input
                            className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                            placeholder="Enter your email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                    <button
                        disabled={loading}
                        className="w-full h-14 bg-primary text-white font-bold hover:bg-primary/90 hover:scale-[0.99] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                    <button onClick={() => setView('signin')} type="button" className="w-full h-14 bg-transparent text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-lg">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );

    const renderCheckEmail = () => (
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 md:p-10 border border-primary/10 animate-in fade-in zoom-in duration-300 text-center">
            <div className="mb-8 flex justify-center">
                <div className="inline-flex items-center justify-center bg-primary/10 p-4 rounded-full mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl">mark_email_read</span>
                </div>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Check your email</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                {checkEmailMessage || "We've sent a password reset link to your email."}
            </p>
            <button onClick={() => setView('signin')} className="w-full h-14 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all">
                Return to Sign In
            </button>
        </div>
    );

    const renderUpdatePassword = () => (
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 md:p-10 border border-primary/10 animate-in fade-in zoom-in duration-300">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center bg-primary/10 p-4 rounded-full mb-4">
                    <span className="material-symbols-outlined text-primary text-4xl">lock_reset</span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Set New Password</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Secure your account with a new password.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">{error}</p>
                </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">New Password</label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">lock</span>
                        <input
                            type="password"
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Confirm Password</label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">verified_user</span>
                        <input
                            type="password"
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 h-14 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-lg outline-none"
                        />
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <button
                        disabled={loading}
                        className="w-full h-14 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                    <button onClick={onClose} type="button" className="w-full h-14 bg-transparent text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-lg">
                        Not now
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px] transition-all animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative z-10 w-full flex justify-center items-center h-full">
                {view === 'signin' && renderSignIn()}
                {view === 'signup' && renderSignUp()}
                {view === 'otp' && renderOTP()}
                {view === 'forgot' && renderForgotPassword()}
                {view === 'check-email' && renderCheckEmail()}
                {view === 'update-password' && renderUpdatePassword()}
            </div>
        </div>
    );
};
