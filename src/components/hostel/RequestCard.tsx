import { motion } from 'framer-motion';
import { HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { Trash2, CheckCircle } from 'lucide-react';

const formatTimeAgo = (timestamp: string): string => {
    try {
        const date = new Date(timestamp);
        // Check if date is valid
        if (isNaN(date.getTime())) return 'Now';

        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d`;

        return date.toLocaleDateString();
    } catch (e) {
        return 'Recently';
    }
};

interface RequestCardProps {
    item: HostelsProductUpdates;
    onClick: () => void;
    currentVisitor?: UniqueVisitor | null;
    onContact: (type: 'merchant' | 'recommend', item: HostelsProductUpdates) => void;
    onDelete?: (item: HostelsProductUpdates) => void;
    onFulfill?: (item: HostelsProductUpdates) => void;
}

export default function RequestCard({ item, onClick, currentVisitor, onContact, onDelete, onFulfill }: RequestCardProps) {
    const { currentTheme } = useTheme();

    const visitor = item.unique_visitors as UniqueVisitor | undefined;
    const initials = String(visitor?.brand_name || visitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);
    const name = visitor?.brand_name || visitor?.full_name || 'User';
    const isFulfilled = item.fulfilled;

    // Check ownership or admin status
    // Assuming 'is_admin' might be on UniqueVisitor or just relying on ID match for now
    const isOwner = currentVisitor && (currentVisitor.id === item.actual_user_id || (currentVisitor as any).is_admin);

    // Design: Glassmorphism + Gradients
    // Active (Amber) vs Fulfilled (Emerald)
    const cardBg = isFulfilled
        ? 'bg-gradient-to-br from-emerald-900/40 to-gray-900/80 border-emerald-500/30 shadow-emerald-900/20'
        : 'bg-gradient-to-br from-amber-900/30 to-gray-900/80 border-amber-500/30 shadow-amber-900/20';

    const buttonGradient = isFulfilled
        ? 'from-emerald-600 to-teal-600'
        : currentTheme.buttonGradient;

    const handleAction = (e: React.MouseEvent, type: 'merchant' | 'recommend') => {
        e.stopPropagation();
        onContact(type, item);
    };

    const handleAdminAction = (e: React.MouseEvent, action: 'delete' | 'fulfill') => {
        e.stopPropagation();
        if (action === 'delete' && onDelete) onDelete(item);
        if (action === 'fulfill' && onFulfill) onFulfill(item);
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                relative flex flex-col justify-between
                min-w-[280px] max-w-[280px] h-[180px]
                p-5 rounded-2xl
                backdrop-blur-md border 
                shadow-xl
                snap-center cursor-pointer
                transition-all duration-300
                overflow-hidden
                ${cardBg}
            `}
        >
            {/* Background Decor */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${isFulfilled ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

            {/* Header: User & Time */}
            <div className="flex items-start justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-inner ${isFulfilled ? 'bg-emerald-800 text-emerald-100' : 'bg-amber-800/80 text-amber-100'}`}>
                        {visitor?.profile_picture ? (
                            <img src={visitor.profile_picture} alt="avatar" className="w-full h-full rounded-full object-cover" />
                        ) : initials}
                    </div>
                    <div>
                        <p className={`text-sm font-bold truncate max-w-[120px] ${isFulfilled ? 'text-emerald-100' : 'text-amber-50'}`}>
                            {name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                            {formatTimeAgo(item.created_at)} AGO
                        </p>
                    </div>
                </div>

                {/* Status Badge or Admin Controls */}
                <div className="flex items-center gap-2">
                    {isOwner && !isFulfilled && (
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => handleAdminAction(e, 'fulfill')}
                                className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                title="Mark as Fulfilled"
                            >
                                <CheckCircle size={14} />
                            </button>
                            <button
                                onClick={(e) => handleAdminAction(e, 'delete')}
                                className="p-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                title="Delete Request"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${isFulfilled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                        {isFulfilled ? 'Found' : 'Request'}
                    </div>
                </div>
            </div>

            {/* Content: Description */}
            <div className="z-10 mt-3 flex-grow">
                <p className={`text-sm font-medium leading-snug line-clamp-2 ${isFulfilled ? 'text-gray-300' : 'text-white'}`}>
                    {item.post_description}
                </p>
            </div>

            {/* Footer: Actions */}
            <div className="z-10 mt-4 flex gap-2">
                {!isFulfilled ? (
                    <>
                        <button
                            onClick={(e) => handleAction(e, 'merchant')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white shadow-lg bg-gradient-to-r ${buttonGradient} hover:brightness-110 active:scale-95 transition-all`}
                        >
                            I Have It
                        </button>
                        <button
                            onClick={(e) => handleAction(e, 'recommend')}
                            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-gray-300 bg-gray-700/50 border border-gray-600 hover:bg-gray-700 active:scale-95 transition-all"
                        >
                            Recommend
                        </button>
                    </>
                ) : (
                    <div className="w-full flex justify-between items-center">
                        <div className="text-xs font-medium text-emerald-400/80 italic">
                            Request fulfilled
                        </div>
                        {isOwner && (
                            <button
                                onClick={(e) => handleAdminAction(e, 'delete')}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
