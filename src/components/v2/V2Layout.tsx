import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthModalV2 } from './AuthModalV2';
import { CreateActionSheetV2 } from './CreateActionSheetV2';
import { V2Sidebar } from './V2Sidebar';
import { V2DesktopHeader } from './V2DesktopHeader';
import { V2ActivitySidebar } from './V2ActivitySidebar';
import { useTheme } from '../../hooks/useTheme.tsx';
import { supabase, UniqueVisitor, getSafeSession } from '../../lib/supabase';

interface V2LayoutProps {
    children: React.ReactNode;
    activeTab?: 'home' | 'orders' | 'messages' | 'profile';
    hideBottomNav?: boolean;
    selectedCategory?: string;
    onCategorySelect?: (category: string) => void;
}

export const V2Layout: React.FC<V2LayoutProps> = ({
    children,
    activeTab = 'home',
    hideBottomNav = false,
    selectedCategory,
    onCategorySelect
}) => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authInitialView, setAuthInitialView] = useState<'signin' | 'signup' | 'otp' | 'forgot' | 'check-email' | 'update-password'>('signin');
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [actionMode, setActionMode] = useState<'request' | 'post'>('request');
    const [currentVisitor, setCurrentVisitor] = useState<UniqueVisitor | null>(null);
    const [userIsAuthenticated, setUserIsAuthenticated] = useState<boolean | null>(() => {
        try {
            return localStorage.getItem('unistore_auth_token') ? null : false;
        } catch {
            return false;
        }
    });
    const [hostelMode, setHostelMode] = useState(true);
    const navigate = useNavigate();
    const [isFabOpen, setIsFabOpen] = useState(false);
    const { currentTheme, changeTheme } = useTheme();

    const isDark = currentTheme.isDark;

    useEffect(() => {
        let isInitialCheckDone = false;

        const syncUser = async (session: any) => {
            const userId = session?.user?.id;
            if (!userId) {
                setCurrentVisitor(null);
                setUserIsAuthenticated(false);
                window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { session: null, visitor: null } }));
                if (activeTab === 'profile' || activeTab === 'orders' || activeTab === 'messages') {
                    navigate('/v2/hostel');
                }
                return;
            }

            try {
                setUserIsAuthenticated(true);

                // Fetch visitor with timeout to prevent hanging the app if DB is slow
                const visitorPromise = supabase
                    .from('unique_visitors')
                    .select('*, hostels(*), schools(*)')
                    .eq('auth_user_id', userId)
                    .maybeSingle();

                const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) =>
                    setTimeout(() => reject(new Error('Visitor sync timeout')), 4000)
                );

                const { data: visitor, error } = await Promise.race([visitorPromise, timeoutPromise]) as any;

                if (error) throw error;

                if (visitor) {
                    setCurrentVisitor(visitor as unknown as UniqueVisitor);
                } else {
                    console.warn('[V2Layout] No visitor record found for auth user:', userId);
                }

                // ALWAYS DISPATCH to unblock children, even if visitor is null
                window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { session, visitor: visitor || null } }));
            } catch (err) {
                console.warn('[V2Layout] visitor sync failed or timed out:', err);
                // Dispatch failure state to unblock children
                window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { session, visitor: null } }));
            }
        };

        const initUser = async () => {
            try {
                const { data: { session } } = await getSafeSession();
                if (session && !isInitialCheckDone) {
                    await syncUser(session);
                } else if (!session) {
                    setUserIsAuthenticated(false);
                }
            } catch (err) {
                console.warn('[V2Layout] initUser failed:', err);
                setUserIsAuthenticated(false);
            } finally {
                isInitialCheckDone = true;
            }
        };

        initUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[V2Layout] onAuthStateChange:', event);
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                await syncUser(session);
            } else if (event === 'SIGNED_OUT') {
                await syncUser(null);
            }
        });

        const handleTriggerAction = (e: any) => {
            const { mode } = e.detail || { mode: 'request' };
            handleActionClick(mode);
        };

        window.addEventListener('trigger-v2-action', handleTriggerAction);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('trigger-v2-action', handleTriggerAction);
        };
    }, [userIsAuthenticated]);

    const toggleTheme = () => {
        changeTheme(isDark ? 'default' : 'dark');
    };

    const handleActionClick = (mode: 'request' | 'post') => {
        if (userIsAuthenticated === false) {
            setIsAuthOpen(true);
            return;
        }
        if (userIsAuthenticated === null) return;

        setActionMode(mode);
        setIsActionOpen(true);
    };

    // Handle initial auth mode from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const authMode = params.get('auth_mode');

        // Also check for supabase recovery flow in the hash
        const hash = window.location.hash;

        if (authMode === 'signup') {
            setAuthInitialView('signup');
            setIsAuthOpen(true);
        } else if (authMode === 'signin') {
            setAuthInitialView('signin');
            setIsAuthOpen(true);
        } else if (authMode === 'reset' || hash.includes('type=recovery')) {
            setAuthInitialView('update-password');
            setIsAuthOpen(true);
        }
    }, []);

    const handleTabChange = (tab: 'home' | 'orders' | 'messages' | 'profile') => {
        if (tab === 'home') {
            navigate('/v2/hostel');
            return;
        }

        if (userIsAuthenticated === false) {
            setIsAuthOpen(true);
            return;
        }

        if (userIsAuthenticated === null) return;

        if (tab === 'profile') navigate('/v2/profile');
        if (tab === 'orders' || tab === 'messages') navigate('/v2/orders');
    };

    return (
        <div className="flex min-h-screen transition-colors duration-500 selection:bg-primary/20 bg-[#f8f6f5] dark:bg-[#221610] text-[#1a2a40] dark:text-white">

            {/* Desktop Left Sidebar (Visible for all, but internal states handled by component) */}
            <div className="hidden lg:block">
                <V2Sidebar
                    activeTab={activeTab}
                    hostelMode={hostelMode}
                    setHostelMode={setHostelMode}
                    onActionClick={handleActionClick}
                    onTabChange={handleTabChange}
                    visitor={currentVisitor}
                    isAuthenticated={!!userIsAuthenticated}
                    selectedCategory={selectedCategory}
                    onCategorySelect={onCategorySelect}
                />
            </div>

            {/* Application Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64 xl:mr-80">

                {/* Mobile Header (Hidden on LG and above) */}
                <header className="lg:hidden sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-primary/5 bg-[#f8f6f5]/80 dark:bg-[#221610]/80 backdrop-blur-xl transition-colors duration-500">
                    <div onClick={() => navigate('/v2/hostel')} className="cursor-pointer flex items-center gap-3 group">
                        <div className="bg-primary w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl font-bold">storefront</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight dark:text-white leading-none">Unistore</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:scale-110 transition-all text-zinc-500 dark:text-zinc-400"
                        >
                            <span className="material-symbols-outlined text-xl fill-0">
                                {isDark ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>

                        <div
                            onClick={() => setHostelMode(!hostelMode)}
                            className="flex items-center gap-3 bg-zinc-100 dark:bg-white/5 pl-4 pr-1.5 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 cursor-pointer hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Hostel</span>
                            <div className={`w-11 h-6 rounded-full relative flex items-center px-1 transition-colors duration-300 ${hostelMode ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${hostelMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Desktop Top Header (Hidden on Mobile) */}
                <div className="hidden lg:block">
                    <V2DesktopHeader
                        visitor={currentVisitor}
                        onToggleTheme={toggleTheme}
                        isDark={!!isDark}
                    />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 w-full max-w-7xl mx-auto">
                    {children}
                </main>

                {/* Mobile Bottom Nav (Hidden on LG and above) */}
                {!hideBottomNav && (
                    <>
                        {/* Mobile FAB Menu */}
                        <div className="lg:hidden fixed bottom-28 right-6 z-[60] flex flex-col items-end gap-3">
                            <AnimatePresence>
                                {isFabOpen && (
                                    <>
                                        <motion.button
                                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                            onClick={() => {
                                                handleActionClick('post');
                                                setIsFabOpen(false);
                                            }}
                                            className="flex items-center gap-3 bg-white dark:bg-[#2a1a14] px-5 py-3 rounded-2xl shadow-xl border border-black/5 dark:border-white/10 active:scale-95 translate-all"
                                        >
                                            <span className="text-xs font-black uppercase tracking-widest text-[#1a2a40] dark:text-white">Post Product</span>
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                                            </div>
                                        </motion.button>

                                        <motion.button
                                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                            transition={{ delay: 0.05 }}
                                            onClick={() => {
                                                handleActionClick('request');
                                                setIsFabOpen(false);
                                            }}
                                            className="flex items-center gap-3 bg-white dark:bg-[#2a1a14] px-5 py-3 rounded-2xl shadow-xl border border-black/5 dark:border-white/10 active:scale-95 translate-all"
                                        >
                                            <span className="text-xs font-black uppercase tracking-widest text-[#1a2a40] dark:text-white">Make Request</span>
                                            <div className="w-10 h-10 rounded-xl bg-[#1e293b]/10 flex items-center justify-center text-[#1e293b] dark:text-accent-blue">
                                                <span className="material-symbols-outlined text-xl">campaign</span>
                                            </div>
                                        </motion.button>
                                    </>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={() => setIsFabOpen(!isFabOpen)}
                                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isFabOpen ? 'bg-[#1e293b] text-white rotate-45' : 'bg-primary text-white'}`}
                            >
                                <span className="material-symbols-outlined text-3xl font-bold">add</span>
                            </button>
                        </div>

                        <div className="lg:hidden fixed bottom-8 left-0 right-0 z-50 px-6 pointer-events-none">
                            <div className="bg-white/95 dark:bg-[#1a110c]/95 backdrop-blur-3xl max-w-lg mx-auto rounded-[2.5rem] py-3 px-4 flex items-center justify-around shadow-2xl border border-black/5 dark:border-white/10 ring-1 ring-black/5 pointer-events-auto">
                                <button
                                    onClick={() => handleTabChange('home')}
                                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500 hover:text-primary'}`}
                                >
                                    <span className={`material-symbols-outlined text-2xl ${activeTab === 'home' ? 'fill-1 scale-110' : ''}`}>home</span>
                                    <span className="text-[10px] font-bold">Home</span>
                                </button>

                                <button
                                    onClick={() => handleTabChange('orders')}
                                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'orders' ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500 hover:text-primary'}`}
                                >
                                    <span className={`material-symbols-outlined text-2xl ${activeTab === 'orders' ? 'fill-1 scale-110' : ''}`}>receipt_long</span>
                                    <span className="text-[10px] font-bold">Orders</span>
                                </button>

                                <button
                                    onClick={() => handleTabChange('messages')}
                                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'messages' ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500 hover:text-primary'}`}
                                >
                                    <span className={`material-symbols-outlined text-2xl ${activeTab === 'messages' ? 'fill-1 scale-110' : ''}`}>forum</span>
                                    <span className="text-[10px] font-bold">Inbox</span>
                                </button>

                                <button
                                    onClick={() => handleTabChange('profile')}
                                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500 hover:text-primary'}`}
                                >
                                    <span className={`material-symbols-outlined text-2xl ${activeTab === 'profile' ? 'fill-1 scale-110' : ''}`}>person</span>
                                    <span className="text-[10px] font-bold">Profile</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Desktop Right Activity Sidebar */}
            <div className="hidden xl:block">
                <V2ActivitySidebar />
            </div>

            {/* Shared Components */}
            {isAuthOpen && (
                <AuthModalV2
                    isOpen={isAuthOpen}
                    onClose={() => setIsAuthOpen(false)}
                    initialView={authInitialView}
                />
            )}

            <CreateActionSheetV2
                isOpen={isActionOpen}
                onClose={() => setIsActionOpen(false)}
                mode={actionMode}
                currentVisitor={currentVisitor}
                onSuccess={() => {
                    window.dispatchEvent(new CustomEvent('hostel-feed-refresh'));
                }}
            />
        </div>
    );
};
