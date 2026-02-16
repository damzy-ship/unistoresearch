import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModalV2 } from './AuthModalV2';
import { useTheme } from '../../hooks/useTheme';

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
    const [hostelMode, setHostelMode] = useState(true);
    const navigate = useNavigate();
    const { currentTheme, changeTheme } = useTheme();

    const isDark = currentTheme.isDark;

    const toggleTheme = () => {
        changeTheme(isDark ? 'default' : 'dark');
    };

    const handleTabChange = (tab: 'home' | 'orders' | 'messages' | 'profile') => {
        if (tab === 'home') navigate('/v2/hostel');
        if (tab === 'profile') navigate('/v2/profile');
        if (tab === 'orders') navigate('/v2/orders');
        if (tab === 'messages') setIsAuthOpen(true);
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 selection:bg-primary/20 ${isDark ? 'dark bg-[#221610] text-white' : 'bg-[#f8fafc] text-[#1a2a40]'}`}>
            {/* Header Section */}
            <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-primary/5 bg-white/70 dark:bg-[#221610]/70 backdrop-blur-xl">
                <div onClick={() => navigate('/v2/hostel')} className="cursor-pointer flex items-center gap-2.5 group">
                    <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">storefront</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold tracking-tight dark:text-white leading-none">Unistore</h1>
                        <span className="inline-block mt-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md self-start border border-primary/20">V2 Beta</span>
                    </div>
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
                        <div className="bg-white/90 backdrop-blur-2xl dark:bg-[#1a110c]/90 max-w-lg mx-auto rounded-[2.5rem] py-3 px-8 flex items-center justify-between shadow-2xl border border-zinc-100 dark:border-white/10 ring-1 ring-black/5">
                            <button
                                onClick={() => handleTabChange('home')}
                                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-primary scale-110' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                            >
                                <span className={`material-symbols-outlined text-2xl ${activeTab === 'home' ? 'fill-1' : ''}`}>home</span>
                                <span className="text-[10px] font-bold">Home</span>
                            </button>

                            <button
                                onClick={() => handleTabChange('orders')}
                                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'orders' ? 'text-primary scale-110' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                            >
                                <span className="material-symbols-outlined text-2xl">receipt_long</span>
                                <span className="text-[10px] font-bold">Orders</span>
                            </button>

                            {/* Center Primary Actions */}
                            <div className="flex gap-3 -mt-12 mb-2">
                                <div className="flex flex-col items-center gap-1.5">
                                    <button
                                        onClick={() => setIsAuthOpen(true)}
                                        className="bg-[#1a2a40] dark:bg-zinc-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transform active:scale-90 transition-all border-4 border-[#f8fafc] dark:border-[#1a110c] hover:shadow-primary/20"
                                    >
                                        <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                                    </button>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-navy/40 dark:text-white/40 bg-zinc-100/50 dark:bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">Buy</span>
                                </div>
                                <div className="flex flex-col items-center gap-1.5">
                                    <button
                                        onClick={() => setIsAuthOpen(true)}
                                        className="bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transform active:scale-90 transition-all border-4 border-[#f8fafc] dark:border-[#1a110c] hover:shadow-primary/40"
                                    >
                                        <span className="material-symbols-outlined text-2xl">add</span>
                                    </button>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full backdrop-blur-sm">Sell</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleTabChange('messages')}
                                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'messages' ? 'text-primary scale-110' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                            >
                                <span className="material-symbols-outlined text-2xl">forum</span>
                                <span className="text-[10px] font-bold">Inbox</span>
                            </button>

                            <button
                                onClick={() => handleTabChange('profile')}
                                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-primary scale-110' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                            >
                                <span className={`material-symbols-outlined text-2xl ${activeTab === 'profile' ? 'fill-1' : ''}`}>person</span>
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
        </div>
    );
};
