import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const UpdatePasswordPageV2: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase will automatically handle the session from the hash fragments
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                console.log('Password recovery session detected:', session?.user?.id);
            }
        });

        return () => data.subscription.unsubscribe();
    }, []);

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
                navigate('/hostel', { replace: true });
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
            toast.error(err.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f6f5] dark:bg-[#1a110c] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -mr-64 -mt-64 blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full -ml-64 -mb-64 blur-[120px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-black/5 dark:border-white/5 relative z-10"
            >
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6 transform rotate-3">
                        <span className="material-symbols-outlined text-primary text-4xl">lock_reset</span>
                    </div>
                    <h1 className="text-3xl font-black text-[#1a2a40] dark:text-white mb-3 tracking-tight">Set New Password</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Create a secure password for your account.</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-center"
                    >
                        <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
                    </motion.div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">lock</span>
                            <input
                                type="password"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-14 pr-6 h-16 bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.03] dark:border-white/[0.03] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 font-bold rounded-2xl outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Confirm Password</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">verified_user</span>
                            <input
                                type="password"
                                placeholder="Repeat your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full pl-14 pr-6 h-16 bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.03] dark:border-white/[0.03] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 font-bold rounded-2xl outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={loading}
                            className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">key</span>
                                    Update Password
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/hostel')}
                            className="w-full h-16 mt-4 bg-transparent text-zinc-400 font-bold hover:text-primary transition-colors uppercase tracking-widest text-xs"
                        >
                            Cancel & Return
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
