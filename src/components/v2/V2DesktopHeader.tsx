import React from 'react';
import { UniqueVisitor } from '../../lib/supabase';

interface V2DesktopHeaderProps {
    visitor: UniqueVisitor | null;
    onToggleTheme: () => void;
    isDark: boolean;
}

export const V2DesktopHeader: React.FC<V2DesktopHeaderProps> = ({
    visitor,
    onToggleTheme,
    isDark
}) => {
    return (
        <header className="h-16 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#221610]/80 backdrop-blur-md px-8 flex items-center justify-between z-10 sticky top-0">
            <div className="flex-1 max-w-2xl">
                <div className="relative group">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </span>
                    <input
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium placeholder:text-slate-400 transition-all outline-none text-slate-700 dark:text-zinc-200"
                        placeholder="Search for textbooks, snacks, or lab gear..."
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 ml-8">
                {/* Theme Toggle */}
                <button
                    onClick={onToggleTheme}
                    className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-zinc-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 active:scale-90"
                >
                    <span className="material-symbols-outlined text-[22px]">
                        {isDark ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-2"></div>

                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="text-right hidden xl:block">
                        <p className="text-xs font-black text-slate-700 dark:text-zinc-200 leading-none mb-0.5">{visitor?.full_name || 'Guest'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {visitor?.verification_status === 'verified' ? 'Verified Member' : (visitor ? 'Student Member' : 'Join Us')}
                        </p>
                    </div>
                    <div
                        className="size-10 rounded-full bg-slate-100 dark:bg-white/10 bg-cover bg-center border-2 border-primary/20 shadow-lg shadow-black/5 flex items-center justify-center"
                        style={{ backgroundImage: visitor?.profile_picture ? `url(${visitor.profile_picture})` : 'none' }}
                    >
                        {!visitor?.profile_picture && (
                            <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
