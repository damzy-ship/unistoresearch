import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { V2Layout } from '../../components/v2/V2Layout';
import { useTheme } from '../../hooks/useTheme';
import { supabase, UniqueVisitor } from '../../lib/supabase';
import { toast } from 'sonner';

export const ProfilePageV2: React.FC = () => {
    const navigate = useNavigate();
    const { currentTheme, changeTheme } = useTheme();
    const isDark = currentTheme.isDark;
    const [user, setUser] = useState<UniqueVisitor | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!isMounted) return;

            if (!session) {
                // Give it one more tiny chance or check if we are actually intentionally signed out
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser && isMounted) {
                    toast.error('Please sign in to view your profile');
                    navigate('/v2/hostel');
                    return;
                }
            }

            if (session?.user?.id || (await supabase.auth.getUser()).data.user?.id) {
                const userId = session?.user?.id || (await supabase.auth.getUser()).data.user?.id;
                const { data: visitor } = await supabase
                    .from('unique_visitors')
                    .select('*, hostels(*), schools(*)')
                    .eq('auth_user_id', userId)
                    .single();

                if (isMounted) {
                    setUser(visitor as unknown as UniqueVisitor);
                    setLoading(false);
                }
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session && isMounted) {
                navigate('/v2/hostel');
            } else if (session && isMounted) {
                checkAuth();
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [navigate]);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Signed out successfully');
            navigate('/v2/hostel');
        } catch (error) {
            toast.error('Error signing out');
        }
    };

    if (loading) {
        return (
            <V2Layout activeTab="profile">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="mt-4 text-zinc-400 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
                </div>
            </V2Layout>
        );
    }

    return (
        <V2Layout activeTab="profile">
            {/* User Profile Header */}
            <section className="p-8 pt-10 dark:bg-transparent">
                <div className="flex flex-col items-center text-center">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors duration-500"></div>
                        <div
                            className="relative flex items-center justify-center bg-primary rounded-full h-28 w-28 ring-4 ring-white dark:ring-white/10 shadow-2xl z-10 text-white text-5xl font-black overflow-hidden"
                        >
                            {user?.profile_picture ? (
                                <img src={user.profile_picture} alt="profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.full_name?.charAt(0) || 'U'
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full border-4 border-background-light dark:border-[#221610] flex items-center justify-center cursor-pointer shadow-xl z-20 hover:scale-110 transition-all active:scale-90">
                            <span className="material-symbols-outlined text-sm">photo_camera</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h1 className="text-3xl font-black tracking-tight text-[#1a2a40] dark:text-white mb-0.5">{user?.full_name?.split(' ')[0] || 'User'}</h1>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500 tracking-wide">{user?.email || 'Welcome to your personalized space'}</p>
                    </div>

                    <div className="flex gap-4 mt-8 w-full max-w-[280px]">
                        <div className="flex-1 bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[2rem] py-3 shadow-sm">
                            <p className="text-lg font-black dark:text-white">12</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Orders</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[2rem] py-3 shadow-sm">
                            <p className="text-lg font-black dark:text-white">₦24k</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Spent</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Personal Information */}
            <section className="px-6 mb-10">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-4 px-4 uppercase tracking-widest">Personal Information</h3>
                <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-zinc-100 dark:border-white/10 shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Email Address</p>
                            <p className="font-bold dark:text-white">{user?.email || 'N/A'}</p>
                        </div>
                        <button className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest active:scale-95 transition-all">Change</button>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Full Name</p>
                        <p className="font-bold dark:text-white">{user?.full_name || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Phone Number</p>
                        <p className="font-bold dark:text-white">{user?.phone_number || 'N/A'}</p>
                    </div>

                    <div className="pt-4 grid grid-cols-2 gap-4 border-t border-zinc-50 dark:border-white/5">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Member Since</p>
                            <p className="text-sm font-bold dark:text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">University</p>
                            <p className="text-sm font-bold dark:text-white">{user?.schools?.name || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Account Settings */}
            <section className="px-6 py-4 space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-4 px-4 uppercase tracking-widest">Account Activities</h3>
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-white/10 shadow-sm transition-all duration-300">
                        {[
                            { icon: 'receipt_long', label: 'My Orders', desc: 'Track your recent purchases', path: '/v2/orders' },
                            { icon: 'payments', label: 'Transactions', desc: 'Billing and payment history', path: '/v2/payments' },
                            { icon: 'history', label: 'Past Requests', desc: 'View your product searches', path: '/v2/orders' },
                            { icon: 'notifications', label: 'Notifications', desc: 'Alerts and updates', path: '/v2/profile' }
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(item.path)}
                                className="w-full flex items-center gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border-b border-zinc-50 dark:border-white/5 last:border-0 group"
                            >
                                <div className="bg-primary/10 p-2.5 rounded-xl text-primary group-hover:scale-110 transition-all duration-300">
                                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold dark:text-white text-base leading-none mb-1">{item.label}</p>
                                    <p className="text-[11px] text-zinc-400 font-medium">{item.desc}</p>
                                </div>
                                <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-4 px-4 uppercase tracking-widest">Preferences</h3>
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-white/10 shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                                    <span className="material-symbols-outlined text-2xl">palette</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold dark:text-white text-base leading-none mb-1">Display Theme</p>
                                    <p className="text-[11px] text-zinc-400 font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                                </div>
                            </div>
                            <div className="flex bg-zinc-100 dark:bg-white/10 p-1 rounded-full border border-zinc-200 dark:border-white/10">
                                <button
                                    onClick={() => changeTheme('default')}
                                    className={`p-2 rounded-full transition-all ${!isDark ? 'bg-white shadow-sm text-primary' : 'text-zinc-400'}`}
                                >
                                    <span className="material-symbols-outlined text-lg fill-0">light_mode</span>
                                </button>
                                <button
                                    onClick={() => changeTheme('dark')}
                                    className={`p-2 rounded-full transition-all ${isDark ? 'bg-zinc-800 shadow-sm text-primary' : 'text-zinc-400'}`}
                                >
                                    <span className="material-symbols-outlined text-lg fill-0">dark_mode</span>
                                </button>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-between group pt-4 border-t border-zinc-50 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                                    <span className="material-symbols-outlined text-2xl">language</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold dark:text-white text-base leading-none mb-1">Language</p>
                                    <p className="text-[11px] text-zinc-400 font-medium">English (Nigeria)</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
                        </button>
                    </div>
                </div>

                <div className="pt-8">
                    <button
                        onClick={handleSignOut}
                        className="w-full h-16 bg-red-500/10 dark:bg-red-500/5 flex items-center gap-4 px-6 rounded-[2.5rem] border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-500 shadow-sm active:scale-[0.98] group"
                    >
                        <div className="bg-red-500/20 p-2.5 rounded-xl group-hover:bg-white/20 transition-colors">
                            <span className="material-symbols-outlined text-2xl font-bold">logout</span>
                        </div>
                        <span className="font-bold text-base tracking-wide">Logout Account</span>
                    </button>
                </div>
            </section>

            <section className="p-8 text-center pb-40">
                <div className="w-12 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full mx-auto mb-6"></div>
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 tracking-wider">UniStore Platform</p>
                    <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">V 2.5.0 Premium</p>
                    <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-widest">Bingham • Veritas</p>
                </div>
            </section>
        </V2Layout>
    );
};
