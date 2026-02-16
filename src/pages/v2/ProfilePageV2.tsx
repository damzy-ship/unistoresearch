import React from 'react';
import { V2Layout } from '../../components/v2/V2Layout';
import { useTheme } from '../../hooks/useTheme';

export const ProfilePageV2: React.FC = () => {
    const { currentTheme, changeTheme } = useTheme();
    const isDark = currentTheme.isDark;

    return (
        <V2Layout activeTab="profile">
            {/* User Profile Header */}
            <section className="p-8 pt-10 dark:bg-transparent">
                <div className="flex flex-col items-center text-center">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors duration-500"></div>
                        <div
                            className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 ring-4 ring-white dark:ring-white/10 shadow-2xl z-10"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBxYrayywMKFI2J2UmGYIf9WBy1ITaR_H8lTWts9cUmZGHkdt2oH2FHY71an4PPssSt_ik-sTZfwk5tZ6gkGsqPwW3sc9G23Yu7_gfuItV9AC5ELGOyiHEDt033LYu6qBmTvsuH6f1i4KJicNBaDfDZCnm5Ft5DaytoWIAtirhDajHdIdXlZV8y3TAfy6KQJSXrFdAzYQ2wwN5kAlVFzBA2_mrFj2L8lrJwMEladheEBAxBOaawD8eHnNXyRqJF-mLYpv4V3G65BXU")' }}
                        >
                        </div>
                        <div className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full border-4 border-white dark:border-[#221610] flex items-center justify-center cursor-pointer shadow-xl z-20 hover:scale-110 transition-all active:scale-90">
                            <span className="material-symbols-outlined text-sm">photo_camera</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h1 className="text-3xl font-black tracking-tight dark:text-white mb-1">Tunde Oladapo</h1>
                        <div className="flex items-center justify-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                            <span className="material-symbols-outlined text-lg text-primary fill-1">location_on</span>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.1em]">Hall 4 • Room 302</p>
                        </div>
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

            {/* Account Settings */}
            <section className="px-6 py-4 space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-4 px-4">Account Activities</h3>
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-white/10 shadow-sm transition-all duration-300">
                        {[
                            { icon: 'receipt_long', label: 'My Orders', desc: 'Track your recent purchases' },
                            { icon: 'favorite', label: 'Saved Items', desc: 'Things you want to buy later' },
                            { icon: 'notifications', label: 'Notifications', desc: 'Alerts and updates' }
                        ].map((item, i) => (
                            <button key={i} className="w-full flex items-center gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border-b border-zinc-50 dark:border-white/5 last:border-0 group">
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
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-4 px-4">Preferences</h3>
                    <div className="bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-white/10 shadow-sm p-5 space-y-5">
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

                        <button className="w-full flex items-center justify-between group">
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

                {/* Sell Section */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative overflow-hidden flex flex-col items-stretch justify-start rounded-[2.5rem] bg-zinc-900 border border-white/10 text-white shadow-2xl">
                        <div className="absolute -right-8 -top-8 text-white/5 transform rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <span className="material-symbols-outlined text-[160px] fill-1">storefront</span>
                        </div>
                        <div className="flex w-full flex-col items-start justify-center gap-2 p-8 z-10">
                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Merchant Program</span>
                            <h3 className="text-2xl font-black leading-tight">Become a Merchant</h3>
                            <p className="text-white/60 text-sm font-medium leading-relaxed mb-6 max-w-[200px]">Turn your items into cash and start earning from your hostel today.</p>
                            <button className="w-full h-14 bg-white text-zinc-900 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all hover:bg-zinc-100 border-b-4 border-zinc-300 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-xl">rocket_launch</span>
                                JOIN NOW
                            </button>
                        </div>
                    </div>
                </div>

                <div className="py-8">
                    <button className="w-full h-16 bg-red-500/10 dark:bg-red-500/5 flex items-center gap-4 px-6 rounded-[2rem] border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm active:scale-[0.98] group">
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
                    <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-widest">Bingham • Veritas • Nile</p>
                </div>
            </section>
        </V2Layout>
    );
};
