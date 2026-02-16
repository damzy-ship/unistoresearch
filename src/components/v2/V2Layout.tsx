import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModalV2 } from './AuthModalV2';
import { CreateActionSheetV2 } from './CreateActionSheetV2';
import { useTheme } from '../../hooks/useTheme.tsx';
import { supabase, UniqueVisitor } from '../../lib/supabase';

interface V2LayoutProps {
    children: React.ReactNode;
    activeTab?: 'home' | 'orders' | 'messages' | 'profile';
    hideBottomNav?: boolean;
}

export const V2Layout: React.FC<V2LayoutProps> = ({
    children,
    activeTab = 'home',
    hideBottomNav = false,
}) => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [actionMode, setActionMode] = useState<'request' | 'post'>('request');
    const [currentVisitor, setCurrentVisitor] = useState<UniqueVisitor | null>(null);
    const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
    const [hostelMode, setHostelMode] = useState(true);
    const navigate = useNavigate();
    const { currentTheme, changeTheme } = useTheme();

    const isDark = currentTheme.isDark;

    useEffect(() => {
        const initUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUserIsAuthenticated(!!session);

            if (session?.user?.id) {
                const { data: visitor } = await supabase
                    .from('unique_visitors')
                    .select('*, hostels(*), schools(*)')
                    .eq('auth_user_id', session.user.id)
                    .single();
                setCurrentVisitor(visitor as unknown as UniqueVisitor);
            }
        };

        initUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUserIsAuthenticated(!!session);
            if (session?.user?.id) {
                const { data: visitor } = await supabase
                    .from('unique_visitors')
                    .select('*, hostels(*), schools(*)')
                    .eq('auth_user_id', session.user.id)
                    .single();
                setCurrentVisitor(visitor as unknown as UniqueVisitor);
            } else {
                setCurrentVisitor(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const toggleTheme = () => {
        changeTheme(isDark ? 'default' : 'dark');
    };

    const handleActionClick = (mode: 'request' | 'post') => {
        if (!userIsAuthenticated) {
            setIsAuthOpen(true);
            return;
        }
        setActionMode(mode);
        setIsActionOpen(true);
    };

    const handleTabChange = (tab: 'home' | 'orders' | 'messages' | 'profile') => {
        if (tab === 'home') {
            navigate('/v2/hostel');
            return;
        }

        if (!userIsAuthenticated) {
            setIsAuthOpen(true);
            return;
        }

        if (tab === 'profile') navigate('/v2/profile');
        if (tab === 'orders') navigate('/v2/orders');
    };

    return (
        <div className="min-h-screen transition-colors duration-500 selection:bg-primary/20 bg-[#f8f6f5] dark:bg-[#221610] text-[#1a2a40] dark:text-white">
            {/* Header Section */}
            <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-primary/5 bg-[#f8f6f5]/80 dark:bg-[#221610]/80 backdrop-blur-xl transition-colors duration-500">
                <div onClick={() => navigate('/v2/hostel')} className="cursor-pointer flex items-center gap-3 group">
                    <div className="bg-primary w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform flex-shrink-0">
                        <span className="material-symbols-outlined text-2xl font-bold">storefront</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight dark:text-white leading-none">Unistore</h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:scale-110 transition-all text-zinc-500 dark:text-zinc-400"
                    >
                        <span className="material-symbols-outlined text-xl fill-0">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    {/* Hostel Mode Toggle */}
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

            {/* Main Content */}
            <main className="max-w-md mx-auto">
                {children}
            </main>

            {/* Floating Actions & Navigation */}
            {!hideBottomNav && (
                <>
                    <div className="fixed bottom-8 left-0 right-0 z-50 px-6">
                        <div className="bg-white/95 dark:bg-[#1a110c]/95 backdrop-blur-3xl max-w-lg mx-auto rounded-[2.5rem] py-3 px-4 flex items-center justify-around shadow-2xl border border-black/5 dark:border-white/10 ring-1 ring-black/5">
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
                                onClick={() => handleActionClick('request')}
                                className="flex flex-col items-center gap-1 text-zinc-400 dark:text-zinc-500 hover:text-primary transition-all"
                            >
                                <span className="material-symbols-outlined text-2xl">pending_actions</span>
                                <span className="text-[10px] font-bold">Request</span>
                            </button>

                            <button
                                onClick={() => handleActionClick('post')}
                                className="flex flex-col items-center gap-1 text-zinc-400 dark:text-zinc-500 hover:text-primary transition-all"
                            >
                                <span className="material-symbols-outlined text-2xl">add_circle</span>
                                <span className="text-[10px] font-bold">Post</span>
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

            {/* Auth Modal Container */}
            <AuthModalV2
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
            />

            {/* Create Action Sheet */}
            <CreateActionSheetV2
                isOpen={isActionOpen}
                onClose={() => setIsActionOpen(false)}
                mode={actionMode}
                currentVisitor={currentVisitor}
                onSuccess={() => {
                    // Refresh feed if needed, though V2 pages usually handle their own state
                    // or use a shared state / event bus
                    window.dispatchEvent(new CustomEvent('hostel-feed-refresh'));
                }}
            />
        </div>
    );
};
