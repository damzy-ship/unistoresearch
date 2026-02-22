import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHostelPosting } from '../../hooks/hostel/useHostelPosting';
import { supabase, UniqueVisitor } from '../../lib/supabase';
import { toast } from 'sonner';

interface CreateActionSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    mode: 'request' | 'post';
    currentVisitor: UniqueVisitor | null;
    onSuccess?: () => void;
}

export const CreateActionSheetV2: React.FC<CreateActionSheetV2Props> = ({
    isOpen,
    onClose,
    mode,
    currentVisitor,
    onSuccess
}) => {
    const [text, setText] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Admin Merchant Selection State
    const [merchants, setMerchants] = useState<UniqueVisitor[]>([]);
    const [filteredMerchants, setFilteredMerchants] = useState<UniqueVisitor[]>([]);
    const [selectedMerchant, setSelectedMerchant] = useState<UniqueVisitor | null>(null);
    const [merchantSearchTerm, setMerchantSearchTerm] = useState('');
    const [showMerchantDropdown, setShowMerchantDropdown] = useState(false);
    const [loadingMerchants, setLoadingMerchants] = useState(false);

    const isAdmin = currentVisitor?.is_admin === true;

    // Fetch merchants for admin
    useEffect(() => {
        const fetchMerchants = async () => {
            if (!isAdmin || !currentVisitor?.schools?.id) return;

            try {
                setLoadingMerchants(true);
                const { data, error } = await supabase
                    .from('unique_visitors')
                    .select('id, full_name, brand_name, phone_number, email, profile_picture, school_id')
                    .eq('is_hostel_merchant', true)
                    .eq('school_id', currentVisitor.schools.id);

                if (error) throw error;

                if (data) {
                    setMerchants(data as UniqueVisitor[]);
                    setFilteredMerchants(data as UniqueVisitor[]);
                }
            } catch (err) {
                console.error('Error fetching merchants:', err);
            } finally {
                setLoadingMerchants(false);
            }
        };

        if (isAdmin && isOpen) {
            fetchMerchants();
        }
    }, [isAdmin, isOpen, currentVisitor?.schools?.id]);

    // Filter merchants based on search
    useEffect(() => {
        if (!merchantSearchTerm.trim()) {
            setFilteredMerchants(merchants);
            return;
        }

        const term = merchantSearchTerm.toLowerCase();
        const filtered = merchants.filter(merchant =>
            (merchant.full_name?.toLowerCase() || '').includes(term) ||
            (merchant.brand_name?.toLowerCase() || '').includes(term) ||
            (merchant.phone_number?.toLowerCase() || '').includes(term) ||
            (merchant.email?.toLowerCase() || '').includes(term)
        );
        setFilteredMerchants(filtered);
    }, [merchantSearchTerm, merchants]);

    // Mock reload for now, the hook needs it but we might want to trigger global refresh
    const { handlePost } = useHostelPosting(currentVisitor, async () => {
        if (onSuccess) onSuccess();
    });

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Limit to 4 images
        const newImages = [...images, ...files].slice(0, 4);
        setImages(newImages);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!text.trim() && images.length === 0 && mode === 'post') {
            toast.error('Please add some details or an image');
            return;
        }
        if (!text.trim() && mode === 'request') {
            toast.error('Please describe what you need');
            return;
        }

        try {
            setIsPosting(true);
            await handlePost(text, images, mode === 'request', selectedMerchant?.id);
            toast.success(mode === 'request' ? 'Request posted successfully!' : 'Product posted successfully!');
            setText('');
            setImages([]);
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsPosting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-end lg:items-center lg:justify-center p-0 lg:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
                        onClick={!isPosting ? onClose : undefined}
                    />

                    {/* The Modal/Sheet */}
                    <motion.div
                        initial={window.innerWidth >= 1024 ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
                        animate={window.innerWidth >= 1024 ? { opacity: 1, scale: 1 } : { y: 0 }}
                        exit={window.innerWidth >= 1024 ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative flex w-full lg:max-w-xl flex-col rounded-t-[2.5rem] lg:rounded-[2.5rem] bg-[#f8f6f5] dark:bg-[#221610] shadow-2xl overflow-hidden border-t lg:border border-white/20 z-10 p-6 pb-12 lg:pb-8 min-h-[60vh] lg:min-h-0 max-h-[90vh]"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-6">
                            <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-black dark:text-white leading-tight">
                                    {mode === 'request' ? 'Make a Request' : 'Post a Product'}
                                </h2>
                                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1">
                                    {mode === 'request'
                                        ? 'Tell students what you are looking for'
                                        : 'Share what you have with others'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isPosting}
                                className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                            {/* Admin Merchant Selector */}
                            {isAdmin && (
                                <div className="mb-2 relative z-50">
                                    <button
                                        onClick={() => setShowMerchantDropdown(!showMerchantDropdown)}
                                        className="flex items-center justify-between w-full p-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 text-sm font-black text-primary">
                                            <span className="material-symbols-outlined text-lg">supervisor_account</span>
                                            Posting as: <span className="text-zinc-800 dark:text-zinc-200">{selectedMerchant ? (selectedMerchant.brand_name || selectedMerchant.full_name) : 'Myself (Admin)'}</span>
                                        </div>
                                        <span className={`material-symbols-outlined text-zinc-400 transition-transform ${showMerchantDropdown ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>

                                    {showMerchantDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowMerchantDropdown(false)} />
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a110c] border border-black/5 dark:border-white/10 rounded-2xl shadow-xl z-50 flex flex-col max-h-80 overflow-hidden">
                                                <div className="p-3 border-b border-black/5 dark:border-white/5 sticky top-0 bg-white/90 dark:bg-[#1a110c]/90 backdrop-blur-md z-30">
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">search</span>
                                                        <input
                                                            type="text"
                                                            value={merchantSearchTerm}
                                                            onChange={(e) => setMerchantSearchTerm(e.target.value)}
                                                            placeholder="Search merchants..."
                                                            className="w-full bg-[#f8f6f5] dark:bg-white/5 text-zinc-800 dark:text-white text-sm py-2 pl-10 pr-3 rounded-xl border border-transparent focus:border-primary outline-none transition-colors"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>

                                                <div className="overflow-y-auto flex-1 p-2 custom-scrollbar space-y-1">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMerchant(null);
                                                            setShowMerchantDropdown(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${!selectedMerchant ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                                                                {currentVisitor?.profile_picture ? (
                                                                    <img src={currentVisitor.profile_picture} alt="me" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-xs font-black text-primary">ME</span>
                                                                )}
                                                            </div>
                                                            <div className="text-left min-w-0">
                                                                <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">Myself</div>
                                                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest truncate">Post as Admin</div>
                                                            </div>
                                                        </div>
                                                        {!selectedMerchant && <span className="material-symbols-outlined text-primary text-xl">check_circle</span>}
                                                    </button>

                                                    {loadingMerchants && (
                                                        <div className="p-4 text-center text-zinc-500 text-sm font-bold">Loading merchants...</div>
                                                    )}

                                                    {!loadingMerchants && filteredMerchants.length === 0 && (
                                                        <div className="p-4 text-center text-zinc-500 text-sm font-bold">No merchants found</div>
                                                    )}

                                                    {filteredMerchants.map((merchant) => (
                                                        <button
                                                            key={merchant.id}
                                                            onClick={() => {
                                                                setSelectedMerchant(merchant);
                                                                setShowMerchantDropdown(false);
                                                            }}
                                                            className={`w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${selectedMerchant?.id === merchant.id ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                                                                    {merchant.profile_picture ? (
                                                                        <img src={merchant.profile_picture} alt={merchant.brand_name || 'merchant'} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-xs font-black text-zinc-400">
                                                                            {(merchant.brand_name || merchant.full_name || 'M')[0].toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-left min-w-0">
                                                                    <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">{merchant.brand_name || merchant.full_name}</div>
                                                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest truncate">{merchant.phone_number || merchant.email || 'No contact info'}</div>
                                                                </div>
                                                            </div>
                                                            {selectedMerchant?.id === merchant.id && <span className="material-symbols-outlined text-primary text-xl">check_circle</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="bg-white dark:bg-white/5 rounded-[2rem] p-5 border border-black/5 dark:border-white/5 shadow-sm">
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder={mode === 'request' ? "e.g. Who sells fresh yogurt in CICL?" : "What are you selling? Describe it here..."}
                                    className="w-full bg-transparent text-lg font-medium dark:text-white placeholder-zinc-400 outline-none resize-none min-h-[120px]"
                                    autoFocus
                                />
                            </div>

                            {/* Image Grid */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {images.map((file, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-3xl overflow-hidden shadow-md group">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    ))}
                                    {images.length < 4 && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square rounded-3xl border-2 border-dashed border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-primary hover:border-primary/30 transition-all bg-white dark:bg-white/5"
                                        >
                                            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Add Image</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {images.length === 0 && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-8 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 text-zinc-400 hover:text-primary hover:border-primary/30 transition-all bg-white dark:bg-white/5 shadow-sm"
                                >
                                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold dark:text-white">Add images</p>
                                        <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-black">Up to 4 photos</p>
                                    </div>
                                </button>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="mt-8">
                            <button
                                onClick={handleSubmit}
                                disabled={isPosting || (!text.trim() && images.length === 0)}
                                className="w-full h-16 rounded-[2rem] bg-primary text-white font-black text-lg shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isPosting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>POSTING...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">send</span>
                                        <span>{mode === 'request' ? 'SUBMIT REQUEST' : 'POST PRODUCT'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
