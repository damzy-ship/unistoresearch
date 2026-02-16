import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveSchools } from '../../lib/schoolService';
import { School } from '../../lib/supabase';

interface SchoolSelectionModalV2Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (schoolId: string) => void;
    currentSchoolId: string | null;
}

export const SchoolSelectionModalV2: React.FC<SchoolSelectionModalV2Props> = ({
    isOpen,
    onClose,
    onSelect,
    currentSchoolId
}) => {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchSchools = async () => {
            setLoading(true);
            const data = await getActiveSchools();
            setSchools(data || []);
            setLoading(false);
        };
        if (isOpen) {
            fetchSchools();
        }
    }, [isOpen]);

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.short_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-lg bg-[#f8f6f5] dark:bg-[#1a1a1a] rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border-t border-white/20 dark:border-white/5"
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-[#1a2a40] dark:text-white tracking-tight">Select University</h2>
                                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Showing active campuses</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-primary transition-colors border border-black/5 dark:border-white/10"
                                >
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative mb-6">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                                <input
                                    type="text"
                                    placeholder="Search your university..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-zinc-300 transition-all"
                                />
                            </div>

                            {/* School List */}
                            <div className="max-h-[40vh] overflow-y-auto no-scrollbar space-y-3 pb-4">
                                {loading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="h-20 bg-white/50 dark:bg-white/5 animate-pulse rounded-[2rem]" />
                                    ))
                                ) : filteredSchools.length > 0 ? (
                                    filteredSchools.map((school) => (
                                        <button
                                            key={school.id}
                                            onClick={() => onSelect(school.id)}
                                            className={`w-full p-4 rounded-[2rem] flex items-center gap-4 transition-all active:scale-98 ${currentSchoolId === school.id
                                                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-102 ring-4 ring-primary/10'
                                                    : 'bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-[#1a2a40] dark:text-white hover:bg-zinc-50 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${currentSchoolId === school.id ? 'bg-white/20' : 'bg-primary/10'}`}>
                                                <span className={`material-symbols-outlined ${currentSchoolId === school.id ? 'text-white' : 'text-primary'}`}>account_balance</span>
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold tracking-tight">{school.name}</h4>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${currentSchoolId === school.id ? 'text-white/60' : 'text-zinc-400'}`}>
                                                    {school.short_name}
                                                </p>
                                            </div>
                                            {currentSchoolId === school.id && (
                                                <span className="material-symbols-outlined ml-auto text-white">check_circle</span>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-12 text-center">
                                        <span className="material-symbols-outlined text-4xl text-zinc-300 mb-4">sentiment_dissatisfied</span>
                                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No matching university</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Note */}
                            <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest text-center">
                                    Don't see your school? Contact support
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
