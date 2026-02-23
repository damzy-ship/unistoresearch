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
        if (info.offset.y > 50 || Math.abs(info.offset.x) > 100) {
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            drag
            dragConstraints={{ top: 0, bottom: 100, left: -100, right: 100 }}
            onDragEnd={handleDragEnd}
            onClick={onClick}
            className="fixed bottom-28 left-4 right-4 z-[100] lg:hidden"
        >
            <div className="bg-white/95 dark:bg-[#2a1a14]/95 backdrop-blur-xl border border-primary/20 p-4 rounded-3xl shadow-2xl flex items-center gap-4 active:scale-95 transition-transform">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex-shrink-0 overflow-hidden border border-primary/20">
                    {activity.unique_visitors?.profile_picture ? (
                        <img src={activity.unique_visitors.profile_picture} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-black uppercase">
                            {activity.unique_visitors?.full_name?.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">New Activity</span>
                        <span className="text-[9px] font-bold text-zinc-400">Just Now</span>
                    </div>
                    <p className="text-xs font-bold text-[#1a2a40] dark:text-white leading-tight truncate">
                        <span className="text-primary mr-1">
                            {activity.unique_visitors?.brand_name || activity.unique_visitors?.full_name?.split(' ')[0]}
                        </span>
                        {activity.post_type === 'request' ? 'is looking for' : 'just listed'} "{activity.post_description}"
                    </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-zinc-400">chevron_right</span>
                </div>
            </div>
        </motion.div>
    );
};
