import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, School, SpecialCategory } from '../../lib/supabase';
import { toast } from 'sonner';

interface SpecialCategoryManagementSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
}

export const SpecialCategoryManagementSheetV2: React.FC<SpecialCategoryManagementSheetV2Props> = ({
    isOpen,
    onClose
}) => {
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [categories, setCategories] = useState<SpecialCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [ruleType, setRuleType] = useState<SpecialCategory['rule_type']>('ai');
    const [maxPrice, setMaxPrice] = useState('');
    const [keywords, setKeywords] = useState('');
    const [categoryValue, setCategoryValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSchools();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedSchoolId) {
            fetchCategories(selectedSchoolId);
        }
    }, [selectedSchoolId]);

    const fetchSchools = async () => {
        try {
            const { data, error } = await supabase.from('schools').select('*').order('name');
            if (error) throw error;
            setSchools(data || []);
            if (data && data.length > 0) {
                const storedSchool = localStorage.getItem('selectedSchoolId');
                setSelectedSchoolId(storedSchool || data[0].id);
            }
        } catch (error: any) {
            toast.error('Failed to load schools');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async (schoolId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('hostel_special_categories')
                .select('*')
                .eq('school_id', schoolId)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error: any) {
            toast.error('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchoolId || !title) return;

        setIsSaving(true);
        try {
            let parsedConfig: any = {};
            if (ruleType === 'price') {
                parsedConfig = { max: Number(maxPrice) };
            } else if (ruleType === 'keyword') {
                parsedConfig = { keywords: keywords.split(',').map(k => k.trim()) };
            } else if (ruleType === 'category') {
                parsedConfig = { category: categoryValue };
            } else if (ruleType === 'ai') {
                parsedConfig = { smart: true };
            }

            const { error } = await supabase
                .from('hostel_special_categories')
                .insert({
                    school_id: selectedSchoolId,
                    title,
                    subtitle: subtitle || null,
                    rule_type: ruleType,
                    rule_config: parsedConfig,
                    is_active: true
                });

            if (error) throw error;

            toast.success('Special Category created!');
            setTitle('');
            setSubtitle('');
            setMaxPrice('');
            setKeywords('');
            setCategoryValue('');
            fetchCategories(selectedSchoolId);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create category');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleCategoryStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('hostel_special_categories')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setCategories(categories.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
            toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'}`);
        } catch (error: any) {
            toast.error('Failed to update status');
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this special category?')) return;

        try {
            const { error } = await supabase
                .from('hostel_special_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCategories(categories.filter(c => c.id !== id));
            toast.success('Category deleted');
        } catch (error: any) {
            toast.error('Failed to delete category');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-end">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-4xl h-full bg-[#f8f6f5] dark:bg-[#110c0a] shadow-2xl flex flex-col z-10"
                >
                    <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#2a1a14]">
                        <h2 className="text-xl font-bold text-[#1a2a40] dark:text-white">Special Categories</h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors text-zinc-500 dark:text-zinc-400">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
                            {/* Configuration */}
                            <div className="space-y-6">
                                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[2.5rem] p-6 space-y-6 shadow-sm">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Target School</label>
                                        <select
                                            className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium text-[#1a2a40] dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            value={selectedSchoolId}
                                            onChange={(e) => setSelectedSchoolId(e.target.value)}
                                        >
                                            {schools.map(school => (
                                                <option key={school.id} value={school.id}>{school.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <form onSubmit={handleSave} className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-sm">stars</span>
                                            </div>
                                            <h3 className="font-bold text-[#1a2a40] dark:text-white">Create Category Row</h3>
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Display Title (e.g. Products under 5k)"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary transition-all shadow-inner"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Subtitle (Optional)"
                                            value={subtitle}
                                            onChange={(e) => setSubtitle(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary transition-all shadow-inner"
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            {(['ai', 'price', 'category', 'keyword'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setRuleType(type)}
                                                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${ruleType === type ? 'bg-primary text-white border-primary shadow-lg' : 'bg-zinc-50 dark:bg-black/20 text-zinc-400 border-black/5 dark:border-white/5 hover:border-primary/50'}`}
                                                >
                                                    {type === 'ai' ? 'Smart Tagging' : `${type} Mode`}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            {ruleType === 'ai' && (
                                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                                                    <p className="text-[10px] text-primary font-bold uppercase tracking-[0.1em] mb-1">How it works</p>
                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                        The AI will automatically scan product titles and descriptions to find matches for <strong>"{title || 'your title'}"</strong>.
                                                    </p>
                                                </div>
                                            )}

                                            {ruleType === 'price' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Maximum Price (₦)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 15000"
                                                        value={maxPrice}
                                                        onChange={(e) => setMaxPrice(e.target.value)}
                                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary transition-all shadow-inner"
                                                    />
                                                </div>
                                            )}

                                            {ruleType === 'keyword' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Keywords (Comma separated)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. vintage, baggy, denim"
                                                        value={keywords}
                                                        onChange={(e) => setKeywords(e.target.value)}
                                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary transition-all shadow-inner"
                                                    />
                                                </div>
                                            )}

                                            {ruleType === 'category' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Target Category</label>
                                                    <select
                                                        value={categoryValue}
                                                        onChange={(e) => setCategoryValue(e.target.value)}
                                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary transition-all shadow-inner"
                                                    >
                                                        <option value="">Select Category</option>
                                                        <option value="food & snacks">Food & Snacks</option>
                                                        <option value="clothing">Clothing</option>
                                                        <option value="shoes">Shoes</option>
                                                        <option value="gadgets">Gadgets</option>
                                                        <option value="phones">Phones</option>
                                                        <option value="jewelries">Jewelries</option>
                                                        <option value="beauty & skincare">Beauty & Skincare</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isSaving ? 'Creating...' : 'CREATE SPECIAL ROW'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Active Rows */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="font-bold text-[#1a2a40] dark:text-white">Defined Rows</h3>
                                    <span className="text-[10px] font-black bg-zinc-100 dark:bg-white/10 px-3 py-1 rounded-full text-zinc-500 uppercase tracking-widest">
                                        {categories.length} Active
                                    </span>
                                </div>

                                <div className="space-y-4 pb-20">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="bg-white dark:bg-[#1a110c] border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-black text-sm text-[#1a2a40] dark:text-white">{cat.title}</p>
                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${cat.rule_type === 'ai' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                            {cat.rule_type}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{cat.subtitle || 'No subtitle'}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleCategoryStatus(cat.id, cat.is_active)}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${cat.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">{cat.is_active ? 'visibility' : 'visibility_off'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCategory(cat.id)}
                                                        className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                                                <code className="text-[9px] text-zinc-400 block truncate">CONFIG: {JSON.stringify(cat.rule_config)}</code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
