import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, UniqueVisitor } from '../../lib/supabase';

interface V2SidebarProps {
    activeTab: 'home' | 'orders' | 'activity' | 'profile';
    hostelMode: boolean;
    setHostelMode: (mode: boolean) => void;
    onActionClick: (mode: 'request' | 'post') => void;
    onTabChange: (tab: 'home' | 'orders' | 'activity' | 'profile') => void;
    visitor?: UniqueVisitor | null;
    isAuthenticated?: boolean;
    selectedCategory?: string;
    onCategorySelect?: (category: string) => void;
}

export const V2Sidebar: React.FC<V2SidebarProps> = ({
    activeTab,
    hostelMode,
    setHostelMode,
    onActionClick,
    onTabChange,
    visitor,
    isAuthenticated,
    selectedCategory,
    onCategorySelect
}) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: 'grid_view' },
        { id: 'activity', label: 'Activity', icon: 'notifications' },
        { id: 'orders', label: 'Orders', icon: 'shopping_cart' },
        { id: 'profile', label: 'Profile', icon: 'person' },
    ];

    return (
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#221610]/50 flex flex-col fixed h-full z-20">
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div
                    onClick={() => onTabChange('home')}
                    className="flex items-center gap-2 text-xl font-bold tracking-tight mb-8 cursor-pointer group"
                >
                    <div className="bg-primary size-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
                        <span className="material-symbols-outlined text-xl">storefront</span>
                    </div>
                    <div>
                        <span className="text-primary font-black">Uni</span>
                        <span className="text-[#0c6eed] dark:text-blue-400 font-black">Store</span>
                        <span className="text-primary font-black">.</span>
                    </div>
                </div>

                {/* School Info / Hostel Mode Toggle */}
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-4 rounded-2xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary">University info</span>
                                <span className="text-xs font-black text-slate-700 dark:text-zinc-200 mt-0.5 truncate max-w-[120px]">
                                    {visitor?.schools?.name || 'Connecting...'}
                                </span>
                            </div>
                            <div
                                onClick={() => setHostelMode(!hostelMode)}
                                className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors duration-300 ${hostelMode ? 'bg-primary' : 'bg-slate-300 dark:bg-zinc-700'}`}
                            >
                                <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-transform duration-300 ${hostelMode ? 'right-0.5' : 'left-0.5'}`}></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-bold">
                            Hostel mode is <span className={hostelMode ? 'text-primary' : ''}>{hostelMode ? 'ACTIVE' : 'OFF'}</span>
                        </p>
                    </div>
                </div>

                <nav className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Dashboard</p>
                    {navItems.map((item) => (
                        <motion.button
                            key={item.id}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onTabChange(item.id as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative group ${activeTab === item.id ? 'text-primary' : 'text-slate-600 dark:text-zinc-400 hover:text-primary'}`}
                        >
                            {activeTab === item.id && (
                                <motion.div
                                    layoutId="active-nav"
                                    className="absolute inset-0 bg-primary/10 rounded-xl"
                                />
                            )}
                            <span className={`material-symbols-outlined text-[20px] relative z-10 ${activeTab === item.id ? 'fill-1' : 'group-hover:scale-110 transition-transform'}`}>
                                {item.icon}
                            </span>
                            <span className="relative z-10">{item.label}</span>
                        </motion.button>
                    ))}
                </nav>

                <nav className="mt-8 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Categories</p>
                    {[
                        { icon: 'restaurant', label: 'Food & Snacks', id: 'food & snacks' },
                        { icon: 'apparel', label: 'Clothing', id: 'clothing' },
                        { icon: 'hiking', label: 'Shoes', id: 'shoes' },
                        { icon: 'sports_baseball', label: 'Caps', id: 'caps' },
                        { icon: 'devices', label: 'Gadgets', id: 'gadgets' },
                        { icon: 'smartphone', label: 'Phones', id: 'phones' },
                        { icon: 'diamond', label: 'Jewelry', id: 'jeweleries' },
                        { icon: 'shopping_bag', label: 'Bags', id: 'bags' },
                        { icon: 'local_florist', label: 'Fragrances', id: 'fragrances' },
                        { icon: 'face', label: 'Beauty & Skincare', id: 'beauty & skincare' },
                        { icon: 'content_cut', label: 'Hair Accessories', id: 'hair accessories' },
                        { icon: 'more_horiz', label: 'Others', id: 'others' }
                    ].map((cat) => (
                        <motion.button
                            key={cat.id}
                            whileHover={{ x: 4 }}
                            onClick={() => onCategorySelect && onCategorySelect(cat.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all text-left relative group ${selectedCategory === cat.id ? 'text-primary bg-primary/5' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${selectedCategory === cat.id ? 'fill-1' : ''}`}>{cat.icon}</span>
                            <span className="truncate">{cat.label}</span>
                        </motion.button>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800">
                <AnimatePresence mode="wait">
                    {!isAuthenticated ? (
                        <motion.div
                            key="guest-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center group"
                        >
                            <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">rocket_launch</span>
                            </div>
                            <p className="text-xs font-black text-slate-700 dark:text-white mb-1 leading-none">Join the community</p>
                            <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-tighter">Reach fellow students</p>
                            <button
                                onClick={() => onTabChange('profile')}
                                className="w-full bg-primary text-white text-[10px] font-black py-2.5 rounded-xl transition-all shadow-md hover:shadow-primary/20 active:scale-95 uppercase tracking-widest"
                            >
                                Sign In / Join
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            <motion.button
                                key="auth-button"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onActionClick('post')}
                                className="w-full bg-primary text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                Post an Item
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    window.location.reload();
                                }}
                                className="w-full bg-white dark:bg-white/5 text-red-500 font-extrabold py-3 rounded-xl border border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Logout
                            </motion.button>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </aside>
    );
};
