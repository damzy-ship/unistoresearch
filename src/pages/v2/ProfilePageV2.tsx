import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { V2Layout } from '../../components/v2/V2Layout';
import { useTheme } from '../../hooks/useTheme';
import { supabase, UniqueVisitor } from '../../lib/supabase';
import { toast } from 'sonner';
import { useHostelFeed } from '../../hooks/hostel/useHostelFeed';
import EditBrandNameModal from '../../components/EditBrandNameModal';
import VerifyIDModal from '../../components/VerifyIdModal';
import EditEmailModal from '../../components/EditEmailModal';

export const ProfilePageV2: React.FC = () => {
    const navigate = useNavigate();
    const { currentTheme, changeTheme } = useTheme();
    const isDark = currentTheme.isDark;
    const [user, setUser] = useState<UniqueVisitor | null>(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    const { feed, loadFeed, setFeed } = useHostelFeed(null, 'all', 'all', true, user);

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!isMounted) return;

            if (!session) {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser && isMounted) {
                    toast.error('Please sign in to view your profile');
                    navigate('/v2/hostel');
                    return;
                }
            }

            const activeUser = session?.user || (await supabase.auth.getUser()).data.user;
            if (activeUser && isMounted) {
                const { data: visitor } = await supabase
                    .from('unique_visitors')
                    .select('*, hostels(*), schools(*)')
                    .eq('auth_user_id', activeUser.id)
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

    useEffect(() => {
        if (user) {
            loadFeed(user.schools?.id || user.hostels?.school_id);
        }
    }, [user, loadFeed]);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Signed out successfully');
            navigate('/v2/hostel');
        } catch (error) {
            toast.error('Error signing out');
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            setDeletingId(postId);
            const { error } = await supabase
                .from('hostel_product_updates')
                .delete()
                .eq('id', postId);

            if (error) throw error;

            toast.success('Post deleted');
            setFeed(prev => prev.filter(p => p.id !== postId));
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete post');
        } finally {
            setDeletingId(null);
        }
    };

    const handleUpdateBrandName = async (newBrandName: string | null) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('unique_visitors')
                .update({ brand_name: newBrandName })
                .eq('auth_user_id', user.auth_user_id);

            if (error) throw error;
            setUser({ ...user, brand_name: newBrandName || undefined });
            toast.success('Brand name updated');
            setIsBrandModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update brand name');
        }
    };

    const handleVerifyID = async (uploadedUrl: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('unique_visitors')
                .update({
                    verification_status: 'pending',
                    verification_id: uploadedUrl
                })
                .eq('auth_user_id', user.auth_user_id);

            if (error) throw error;
            setUser({ ...user, verification_status: 'pending', verification_id: uploadedUrl });
            toast.success('ID submitted for verification');
            setIsVerifyModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit verification');
        }
    };

    const handleUpdateEmail = async (newEmail: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('unique_visitors')
                .update({ email: newEmail })
                .eq('auth_user_id', user.auth_user_id);

            if (error) throw error;
            setUser({ ...user, email: newEmail });
            toast.success('Email updated internally');
            setIsEmailModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update email');
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
                        <div className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full border-4 border-[#f8f6f5] dark:border-[#221610] flex items-center justify-center cursor-pointer shadow-xl z-20 hover:scale-110 transition-all active:scale-90">
                            <span className="material-symbols-outlined text-sm">photo_camera</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h1 className="text-3xl font-black tracking-tight text-[#1a2a40] dark:text-white mb-0.5">{user?.full_name?.split(' ')[0] || 'User'}</h1>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500 tracking-wide">{user?.email || 'Welcome to your personalized space'}</p>
                    </div>

                    <div className="flex gap-4 mt-8 w-full max-w-[280px]">
                        <div className="flex-1 bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[2rem] py-3 shadow-sm">
                            <p className="text-lg font-black dark:text-white">{feed.length}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Posts</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-[2rem] py-3 shadow-sm">
                            <p className="text-lg font-black dark:text-white">₦0</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sales</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* My Posts Section */}
            <section className="px-6 mb-10">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-4 px-4 uppercase tracking-widest">My Posts & Requests</h3>
                <div className="space-y-4">
                    {feed.length > 0 ? (
                        feed.map((post) => (
                            <div key={post.id} className="bg-white dark:bg-white/5 rounded-[2rem] border border-zinc-100 dark:border-white/10 shadow-sm p-4 flex gap-4 items-center transition-all hover:border-primary/20">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                                    <img
                                        src={post.post_images?.[0] || '/v2/assets/portable_speaker_product_1771272581168.png'}
                                        alt="post"
                                        className="w-full h-full object-cover"
                                        onError={(e: any) => e.target.src = '/v2/assets/portable_speaker_product_1771272581168.png'}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${post.post_type === 'request' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {post.post_type}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold dark:text-white truncate">{post.post_description}</p>
                                    <p className="text-xs text-primary font-black mt-0.5">₦{post.price?.toLocaleString() || '0'}</p>
                                </div>
                                <button
                                    disabled={deletingId === post.id}
                                    onClick={() => handleDeletePost(post.id)}
                                    className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 shrink-0"
                                >
                                    {deletingId === post.id ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                    )}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-10 text-center border-2 border-dashed border-zinc-100 dark:border-white/10">
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl text-zinc-300 dark:text-zinc-600">post_add</span>
                            </div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No posts or requests found</p>
                        </div>
                    )}
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
                        <button
                            onClick={() => setIsEmailModalOpen(true)}
                            className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Change
                        </button>
                    </div>

                    {user?.user_type === 'merchant' && (
                        <>
                            <div className="flex items-center justify-between group pt-4 border-t border-zinc-50 dark:border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Brand Name</p>
                                    <p className="font-bold dark:text-white uppercase">{user.brand_name || 'Set your brand'}</p>
                                </div>
                                <button
                                    onClick={() => setIsBrandModalOpen(true)}
                                    className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Change
                                </button>
                            </div>

                            <div className="flex items-center justify-between group pt-4 border-t border-zinc-50 dark:border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Verification</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${user.verification_status === 'verified' ? 'bg-emerald-500' :
                                            user.verification_status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                                            }`} />
                                        <p className="font-bold dark:text-white uppercase text-xs">{user.verification_status || 'unverified'}</p>
                                    </div>
                                </div>
                                {user.verification_status !== 'verified' && (
                                    <button
                                        onClick={() => setIsVerifyModalOpen(true)}
                                        className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        {user.verification_status === 'pending' ? 'Update ID' : 'Verify Now'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    <div className="space-y-1 pt-4 border-t border-zinc-50 dark:border-white/5">
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

                {user?.is_admin && (
                    <div className="pt-4">
                        <h3 className="text-xs font-bold text-purple-500 dark:text-purple-400 mb-4 px-4 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">shield_person</span>
                            Admin Controls
                        </h3>
                        <div className="bg-purple-500/5 dark:bg-purple-500/10 rounded-[2.5rem] border border-purple-500/20 shadow-sm overflow-hidden">
                            <button
                                onClick={() => navigate('/admin-coupons')}
                                className="w-full flex items-center gap-4 p-5 hover:bg-purple-500/10 transition-colors group"
                            >
                                <div className="bg-purple-500/20 p-2.5 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-all duration-300">
                                    <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold dark:text-white text-base leading-none mb-1">Coupon Management</p>
                                    <p className="text-[11px] text-purple-400/70 font-medium">Create and manage viral coupons</p>
                                </div>
                                <span className="material-symbols-outlined text-purple-300 dark:text-purple-800 group-hover:translate-x-1 transition-transform">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}

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
            {isBrandModalOpen && (
                <EditBrandNameModal
                    currentBrandName={user?.brand_name || ''}
                    onClose={() => setIsBrandModalOpen(false)}
                    onSave={handleUpdateBrandName}
                    currentTheme={currentTheme}
                />
            )}

            {isVerifyModalOpen && (
                <VerifyIDModal
                    onClose={() => setIsVerifyModalOpen(false)}
                    onSave={handleVerifyID}
                    currentTheme={currentTheme}
                    uniqueId={user?.full_name || 'user'}
                    currentVerificationId={user?.verification_id}
                />
            )}

            {isEmailModalOpen && (
                <EditEmailModal
                    currentEmail={user?.email || ''}
                    onClose={() => setIsEmailModalOpen(false)}
                    onSave={handleUpdateEmail}
                    currentTheme={currentTheme}
                />
            )}
        </V2Layout>
    );
};
