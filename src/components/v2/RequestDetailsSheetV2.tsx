import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RequestDetailsSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    request: any;
}

export const RequestDetailsSheetV2: React.FC<RequestDetailsSheetV2Props> = ({
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
                        className="relative flex w-full flex-col rounded-t-[2.5rem] bg-white dark:bg-[#221610] shadow-2xl overflow-hidden border-t border-white/20 z-10 p-6 pb-12 h-[75vh]"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-8">
                            <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h1 className="text-2xl font-black dark:text-white leading-tight">Request Summary</h1>
                                <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Request Type */}
                                <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex items-center gap-5">
                                    <div className="bg-primary/20 p-4 rounded-2xl text-primary">
                                        <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Item Requested</p>
                                        <p className="text-2xl font-bold dark:text-white leading-tight">"{request?.request_text || 'Nike shoes'}"</p>
                                    </div>
                                </div>

                                {/* Status Grid */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-3xl p-5 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                                            <span className="material-symbols-outlined text-zinc-500">location_on</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Campus Location</p>
                                            <p className="font-bold dark:text-white">{request?.university || 'Veritas University'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 rounded-3xl p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                                                <span className="material-symbols-outlined text-zinc-500">group</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Seller Matches</p>
                                                <p className="font-bold dark:text-white">0 Sellers matched</p>
                                            </div>
                                        </div>
                                        <span className="bg-zinc-200 dark:bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold dark:text-zinc-400">PENDING</span>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="px-4 py-4">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Activity Timeline</h3>
                                    <div className="space-y-8 relative">
                                        <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-zinc-100 dark:bg-white/5"></div>

                                        <div className="flex gap-6 relative">
                                            <div className="w-5 h-5 rounded-full bg-primary border-4 border-white dark:border-[#221610] shadow-lg shadow-primary/30 z-10"></div>
                                            <div>
                                                <p className="font-bold dark:text-white leading-none mb-1">Request Created</p>
                                                <p className="text-[11px] text-zinc-400">Successfully posted to the marketplace feed.</p>
                                                <p className="text-[10px] font-bold text-zinc-300 mt-2">Just now</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-6 relative opacity-50">
                                            <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-white dark:border-[#221610] z-10"></div>
                                            <div>
                                                <p className="font-bold dark:text-white leading-none mb-1">Marketplace Matching</p>
                                                <p className="text-[11px] text-zinc-400">Scanning for available sellers near you.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-8 flex gap-4">
                            <button className="flex-1 h-16 rounded-[2rem] bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-white font-black text-sm active:scale-95 transition-all border border-zinc-200 dark:border-white/10">
                                Cancel Request
                            </button>
                            <button className="flex-2 h-16 px-10 rounded-[2rem] bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">refresh</span>
                                BUMP REQUEST
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
