import React from 'react';

interface V2BottomBarProps {
    activeTab: 'home' | 'orders' | 'messages' | 'profile';
    onTabChange: (tab: 'home' | 'orders' | 'messages' | 'profile') => void;
    onPostClick: () => void;
    onCartClick: () => void;
}

export const V2BottomBar: React.FC<V2BottomBarProps> = ({
    activeTab,
    onTabChange,
    onPostClick,
    onCartClick,
}) => {
    return (
        <>
            {/* Quick Labels for FABs */}
            <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-50">
                <div className="flex gap-10">
                    <span className="text-[10px] font-bold text-accent-blue/60 bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm">Cart</span>
                    <span className="text-[10px] font-bold text-primary/60 bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm">Post</span>
                </div>
            </div>

            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-[440px] glass-premium rounded-full px-4 py-2 flex items-center justify-between shadow-2xl shadow-black/10 z-50 border-white/50">
                {/* Home */}
                <button
                    onClick={() => onTabChange('home')}
                    className={`flex flex-col items-center gap-0.5 px-3 transition-colors ${activeTab === 'home' ? 'text-primary' : 'text-zinc-600 dark:text-zinc-300 opacity-40'}`}
                >
                    <span className={`material-symbols-outlined ${activeTab === 'home' ? 'fill-1' : ''}`}>home</span>
                    <span className="text-[10px] font-bold">Home</span>
                </button>

                {/* Orders */}
                <button
                    onClick={() => onTabChange('orders')}
                    className={`flex flex-col items-center gap-0.5 px-3 transition-colors ${activeTab === 'orders' ? 'text-primary' : 'text-zinc-600 dark:text-zinc-300 opacity-40'}`}
                >
                    <span className={`material-symbols-outlined ${activeTab === 'orders' ? 'fill-1' : ''}`}>receipt_long</span>
                    <span className="text-[10px] font-medium">Orders</span>
                </button>

                {/* Center Primary Actions */}
                <div className="flex items-center gap-3 px-1">
                    {/* Cart FAB */}
                    <div className="relative -top-3">
                        <button
                            onClick={onCartClick}
                            className="bg-[#1e293b] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-zinc-900 active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-outlined text-2xl">add_shopping_cart</span>
                        </button>
                    </div>

                    {/* Post FAB */}
                    <div className="relative -top-3">
                        <button
                            onClick={onPostClick}
                            className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-zinc-900 active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-outlined text-2xl">post_add</span>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <button
                    onClick={() => onTabChange('messages')}
                    className={`flex flex-col items-center gap-0.5 px-3 transition-colors ${activeTab === 'messages' ? 'text-primary' : 'text-zinc-600 dark:text-zinc-300 opacity-40'}`}
                >
                    <span className={`material-symbols-outlined ${activeTab === 'messages' ? 'fill-1' : ''}`}>chat_bubble</span>
                    <span className="text-[10px] font-medium">Messages</span>
                </button>

                {/* Profile */}
                <button
                    onClick={() => onTabChange('profile')}
                    className={`flex flex-col items-center gap-0.5 px-3 transition-colors ${activeTab === 'profile' ? 'text-primary' : 'text-zinc-600 dark:text-zinc-300 opacity-40'}`}
                >
                    <span className={`material-symbols-outlined ${activeTab === 'profile' ? 'fill-1' : ''}`}>person</span>
                    <span className="text-[10px] font-medium">Profile</span>
                </button>
            </nav>
        </>
    );
};
