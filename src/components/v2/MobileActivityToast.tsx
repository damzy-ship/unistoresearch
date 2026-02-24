import React from 'react';
import { motion, PanInfo } from 'framer-motion';

interface MobileActivityToastProps {
    activity: {
        id: string;
        post_description: string;
        post_type: 'request' | 'update';
        unique_visitors: {
            full_name: string;
            profile_picture: string;
            brand_name: string | null;
        };
        created_at: string;
        isHistory?: boolean;
    };
    onClose: () => void;
    onClick: () => void;
}

export const MobileActivityToast: React.FC<MobileActivityToastProps> = ({
    activity,
    onClose,
    onClick
}) => {
    const handleDragEnd = (_e: any, info: PanInfo) => {
        // More sensitive swipe detection (offset or flick velocity)
        const threshold = 30; // Further lowered for better responsiveness
        const velocityThreshold = 300;

        const isSwipeLeft = info.offset.x < -threshold || info.velocity.x < -velocityThreshold;
        const isSwipeRight = info.offset.x > threshold || info.velocity.x > velocityThreshold;
        const isSwipeUp = info.offset.y < -threshold || info.velocity.y < -velocityThreshold;

        if (isSwipeLeft || isSwipeRight || isSwipeUp) {
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ y: -120, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -120, opacity: 0, scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8
            }}
            drag={true}
            dragConstraints={{ top: -200, bottom: 0, left: -300, right: 300 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="fixed top-20 left-4 right-4 z-[101] lg:hidden cursor-grab active:cursor-grabbing"
        >
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                className="relative overflow-hidden bg-white/70 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 group active:scale-[0.98] transition-all duration-300"
            >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0 overflow-hidden border border-primary/20 shadow-inner">
                    {activity.unique_visitors?.profile_picture ? (
                        <img src={activity.unique_visitors.profile_picture} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-black uppercase text-xl">
                            {activity.unique_visitors?.full_name?.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${activity.isHistory ? 'bg-zinc-400' : 'bg-primary animate-pulse'}`} />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400/80">
                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-tight">
                        <span className="font-black text-[#1a2a40] dark:text-white mr-1">
                            {activity.unique_visitors?.brand_name || activity.unique_visitors?.full_name?.split(' ')[0]}
                        </span>
                        {activity.post_type === 'request' ? 'is looking for' : 'just listed'}
                        <span className="font-bold text-primary italic ml-1 line-clamp-1 block mt-0.5">
                            "{activity.post_description}"
                        </span>
                    </p>
                </div>

                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                </div>
            </div>

            {/* Drag Handle Indicator */}
            <div className="mt-2 flex justify-center opacity-30">
                <div className="w-10 h-1 bg-zinc-400 dark:bg-white/20 rounded-full" />
            </div>
        </motion.div>
    );
};
