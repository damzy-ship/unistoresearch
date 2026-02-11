import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HostelsProductUpdates, supabase } from '../../lib/supabase';

interface EditProductUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    update: HostelsProductUpdates | null;
    onUpdateSuccess: (updatedItem: HostelsProductUpdates) => void;
}

export default function EditProductUpdateModal({ isOpen, onClose, update, onUpdateSuccess }: EditProductUpdateModalProps) {
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<string>('');
    const [discountPrice, setDiscountPrice] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (update) {
            setDescription(update.post_description || '');
            setPrice(update.price ? update.price.toString() : '');
            setDiscountPrice(update.discount_price ? update.discount_price.toString() : '');
            setError(null);
        }
    }, [update, isOpen]);

    const handleSave = async () => {
        if (!update) return;

        setIsSubmitting(true);
        setError(null);

        const numericPrice = price ? parseFloat(price) : null;
        const numericDiscount = discountPrice ? parseFloat(discountPrice) : null;

        // Basic validation
        if (numericDiscount && numericPrice && numericDiscount >= numericPrice) {
            setError('Discount price must be lower than the original price.');
            setIsSubmitting(false);
            return;
        }

        try {
            const { data, error: updateError } = await supabase
                .from('hostel_product_updates')
                .update({
                    post_description: description,
                    price: numericPrice,
                    discount_price: numericDiscount,
                })
                .eq('id', update.id)
                .select()
                .single();

            if (updateError) throw updateError;

            if (data) {
                onUpdateSuccess(data as HostelsProductUpdates);
                onClose();
            }
        } catch (err: any) {
            console.error('Error updating post:', err);
            setError(err.message || 'Failed to update post');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h2 className="text-lg font-bold text-white">Edit Update</h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                                    placeholder="What's this update about?"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        Price (₦)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign size={16} className="text-gray-500" />
                                        </div>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-emerald-400 mb-1">
                                        Discount Price (₦)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign size={16} className="text-emerald-500/70" />
                                        </div>
                                        <input
                                            type="number"
                                            value={discountPrice}
                                            onChange={(e) => setDiscountPrice(e.target.value)}
                                            className="w-full bg-emerald-900/20 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-3 text-emerald-300 placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
