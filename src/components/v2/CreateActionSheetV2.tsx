import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHostelPosting } from '../../hooks/hostel/useHostelPosting';
import { UniqueVisitor } from '../../lib/supabase';
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
            await handlePost(text, images, mode === 'request');
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
                <div className="fixed inset-0 z-[120] flex items-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
                        onClick={!isPosting ? onClose : undefined}
                    />

                    {/* The Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative flex w-full flex-col rounded-t-[2.5rem] bg-[#f8f6f5] dark:bg-[#221610] shadow-2xl overflow-hidden border-t border-white/20 z-10 p-6 pb-12 min-h-[60vh] max-h-[90vh]"
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
