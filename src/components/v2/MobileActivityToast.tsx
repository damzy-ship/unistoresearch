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
    onClose: (wasManual?: boolean) => void;
    onClick: () => void;
}

export const MobileActivityToast: React.FC<MobileActivityToastProps> = ({
    activity,
    onClose,
    onClick
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const lastClickTime = React.useRef(0);

    const handleInteraction = (e: React.MouseEvent) => {
        e.stopPropagation();
        const now = Date.now();
        const delay = now - lastClickTime.current;

        if (delay < 300) {
            // Double tap - Navigate
            onClick();
        } else {
            // Single tap - Expand
            setIsExpanded(!isExpanded);
        }
        lastClickTime.current = now;
    };

    const handleDragEnd = (_e: any, info: PanInfo) => {
        const threshold = 30;
        const velocityThreshold = 300;

        const isSwipeLeft = info.offset.x < -threshold || info.velocity.x < -velocityThreshold;
        const isSwipeRight = info.offset.x > threshold || info.velocity.x > velocityThreshold;
        const isSwipeUp = info.offset.y < -threshold || info.velocity.y < -velocityThreshold;

        if (isSwipeLeft || isSwipeRight || isSwipeUp) {
            onClose(true);
        }
    };

    return (
        <motion.div
            layout
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
            className="fixed top-16 left-4 right-4 z-[101] lg:hidden cursor-grab active:cursor-grabbing"
        >
            {/* Close Button - Smaller and more precise */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose(true);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-zinc-900/90 dark:bg-zinc-800 shadow-md border border-white/20 z-[102] active:scale-90 transition-transform"
            >
                <span className="material-symbols-outlined text-[12px] text-white">close</span>
            </button>

            <motion.div
                layout
                onClick={handleInteraction}
                className={`relative overflow-hidden bg-white/95 dark:bg-black/80 backdrop-blur-3xl border border-zinc-200/50 dark:border-white/10 p-3 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex items-center gap-3.5 group active:scale-[0.99] transition-all duration-300 ${isExpanded ? 'min-h-[90px]' : ''}`}
            >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                {/* Avatar Area - Circular and perfectly aligned */}
                <div className="relative w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden border border-primary/5 flex items-center justify-center transition-all duration-300 shadow-sm">
                    {activity.unique_visitors?.profile_picture ? (
                        <img src={activity.unique_visitors.profile_picture} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <span className="text-primary font-bold uppercase text-sm">
                            {activity.unique_visitors?.full_name?.charAt(0)}
                        </span>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-extrabold text-[14px] text-zinc-900 dark:text-white leading-none">
                            {activity.unique_visitors?.brand_name || activity.unique_visitors?.full_name?.split(' ')[0]}
                        </span>

                        {!isExpanded && (
                            <div className="flex items-center gap-1 min-w-0">
                                <span className="text-zinc-500 font-medium text-[13px] whitespace-nowrap">{activity.post_type === 'request' ? 'needs' : 'listed'}</span>
                                <span className="font-bold text-primary italic text-[13px] truncate">
                                    "{activity.post_description}"
                                </span>
                            </div>
                        )}
                    </div>

                    {isExpanded && (
                        <div className="mt-0.5">
                            <span className="text-zinc-500 font-medium text-[13px]">{activity.post_type === 'request' ? 'is looking for' : 'just listed'}</span>
                            <span className="font-bold text-primary italic text-[13px] block mt-0.5 leading-tight">
                                "{activity.post_description}"
                            </span>
                        </div>
                    )}

                    {/* Timestamp below */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1 h-1 rounded-full ${activity.isHistory ? 'bg-zinc-300' : 'bg-primary animate-[pulse_2s_ease-in-out_infinite]'}`} />
                        <span className="text-[10px] font-bold text-zinc-400">
                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Interaction Icon */}
                <div className="w-6 h-6 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-300 group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">
                        {isExpanded ? 'expand_less' : 'chevron_right'}
                    </span>
                </div>
            </motion.div>

            {/* Subtle drag cue */}
            <div className="mt-1.5 flex justify-center opacity-[0.05]">
                <div className="w-6 h-1 bg-zinc-400 dark:bg-white rounded-full" />
            </div>
        </motion.div>
    );
};
