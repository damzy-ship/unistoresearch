import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveRequestResponseSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    request: any;
}

export const LiveRequestResponseSheetV2: React.FC<LiveRequestResponseSheetV2Props> = ({
    isOpen,
    onClose,
    request
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
                        onClick={onClose}
                    />

                    {/* The Sheet */}
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative flex w-full flex-col rounded-t-[3rem] bg-[#f8f6f5] dark:bg-[#221610] shadow-2xl overflow-hidden border-t border-white/20 z-10 p-6 pb-12"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-6">
                            <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                        </div>

                        {/* Request Preview */}
                        <div className="flex gap-4 mb-8 p-4 bg-white dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 ring-4 ring-black/5 dark:ring-white/5">
                                <img className="w-full h-full object-cover" src={request?.img} alt="Request" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[#1a2a40] dark:text-white font-bold leading-tight mb-1 text-lg">{request?.text}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[10px] text-primary">schedule</span>
                                    </div>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{request?.time || 'Just now'}</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-[#1a2a40] dark:text-white mb-5 px-1">How would you like to respond?</h3>

                        <div className="space-y-4">
                            {/* Option 1: Sell */}
                            <button
                                onClick={onClose}
                                className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-2xl">storefront</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg leading-tight text-white">I have this item</p>
                                        <p className="text-white/80 text-xs mt-1">Contact requester to sell yours</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-xl">arrow_forward_ios</span>
                            </button>

                            {/* Option 2: Recommend */}
                            <button
                                onClick={onClose}
                                className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all text-left shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                                        <span className="material-symbols-outlined text-2xl">recommend</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg leading-tight text-[#1a2a40] dark:text-white">Recommend Product</p>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Suggest an existing product</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-zinc-400 text-xl">arrow_forward_ios</span>
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-8 w-full py-5 text-zinc-400 dark:text-zinc-500 font-bold hover:text-primary transition-colors text-sm uppercase tracking-widest"
                        >
                            Nevermind
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
