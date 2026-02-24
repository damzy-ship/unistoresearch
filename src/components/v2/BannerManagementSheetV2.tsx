import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, School, UniqueVisitor } from '../../lib/supabase';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { sendSellerOfWeekEmail } from '../../lib/brevoService';

interface Banner {
    id: string;
    school_id: string;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    target_url: string | null;
    is_active: boolean;
    created_at: string;
}

interface BannerManagementSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
}

export const BannerManagementSheetV2: React.FC<BannerManagementSheetV2Props> = ({
    isOpen,
    onClose
}) => {
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Form states for new banner
    const [newTitle, setNewTitle] = useState('');
    const [newSubtitle, setNewSubtitle] = useState('');
    const [promotionType, setPromotionType] = useState<'none' | 'seller' | 'product'>('none');
    const [sellerSearchQuery, setSellerSearchQuery] = useState('');
    const [foundSellers, setFoundSellers] = useState<UniqueVisitor[]>([]);
    const [selectedSeller, setSelectedSeller] = useState<UniqueVisitor | null>(null);
    const [isSearchingSellers, setIsSearchingSellers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSchools();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedSchoolId) {
            fetchBanners(selectedSchoolId);
        }
    }, [selectedSchoolId]);

    // Seller search effect
    useEffect(() => {
        const searchSellers = async () => {
            if (sellerSearchQuery.length < 2) {
                setFoundSellers([]);
                return;
            }

            setIsSearchingSellers(true);
            try {
                const { data, error } = await supabase
                    .from('unique_visitors')
                    .select('*')
                    .eq('user_type', 'merchant')
                    .or(`full_name.ilike.%${sellerSearchQuery}%,brand_name.ilike.%${sellerSearchQuery}%,email.ilike.%${sellerSearchQuery}%`)
                    .limit(5);

                if (error) throw error;
                setFoundSellers(data || []);
            } catch (err) {
                console.error('Error searching sellers:', err);
            } finally {
                setIsSearchingSellers(false);
            }
        };

        const timer = setTimeout(searchSellers, 300);
        return () => clearTimeout(timer);
    }, [sellerSearchQuery]);

    const fetchSchools = async () => {
        try {
            const { data, error } = await supabase.from('schools').select('*').order('name');
            if (error) throw error;
            setSchools(data || []);
            if (data && data.length > 0) {
                setSelectedSchoolId(data[0].id);
            }
        } catch (error: any) {
            toast.error('Failed to load schools');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBanners = async (schoolId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('school_banners')
                .select('*')
                .eq('school_id', schoolId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBanners(data || []);
        } catch (error: any) {
            toast.error('Failed to load banners');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedSchoolId) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        setIsUploading(true);
        toast.loading('Uploading banner...', { id: 'upload-banner' });

        try {
            let fileToUpload: File | Blob = file;
            let fileExt = file.name.split('.').pop()?.toLowerCase() || 'webp';

            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    fileType: 'image/webp'
                };
                fileToUpload = await imageCompression(file, options);
                fileExt = 'webp';
            } catch (err) {
                console.error("Compression error:", err);
            }

            const fileName = `${selectedSchoolId}-${Date.now()}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            // Upload image using the post_images bucket
            const { error: uploadError } = await supabase.storage
                .from('post_images')
                .upload(filePath, fileToUpload);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('post_images')
                .getPublicUrl(filePath);

            const encodedSubtitle = promotionType !== 'none'
                ? `[PROMO:${promotionType}]${selectedSeller ? `[SELLER_ID:${selectedSeller.id}]` : ''}${newSubtitle}`
                : newSubtitle;

            // Create record
            const { error: insertError } = await supabase
                .from('school_banners')
                .insert({
                    school_id: selectedSchoolId,
                    image_url: publicUrl,
                    title: newTitle || null,
                    subtitle: encodedSubtitle || null,
                    is_active: true
                });

            if (insertError) throw insertError;

            // Trigger email if it's a seller of the week
            if (promotionType === 'seller' && selectedSeller && selectedSeller.email) {
                const school = schools.find(s => s.id === selectedSchoolId);
                sendSellerOfWeekEmail({
                    email: selectedSeller.email,
                    full_name: selectedSeller.full_name || 'Merchant',
                    school_name: school?.name || 'your University'
                });
                toast.success(`Notification sent to ${selectedSeller.full_name}`);
            }

            toast.success('Banner added successfully!', { id: 'upload-banner' });
            // Dispatch refresh event to update homepage
            window.dispatchEvent(new CustomEvent('hostel-feed-refresh'));
            setNewTitle('');
            setNewSubtitle('');
            setPromotionType('none');
            setSelectedSeller(null);
            setSellerSearchQuery('');
            fetchBanners(selectedSchoolId); // Refresh
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload banner', { id: 'upload-banner' });
        } finally {
            setIsUploading(false);
        }
    };

    const toggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('school_banners')
                .update({ is_active: !currentStatus })
                .eq('id', bannerId);

            if (error) throw error;

            const newStatus = !currentStatus;
            setBanners(banners.map(b => b.id === bannerId ? { ...b, is_active: newStatus } : b));
            // Dispatch refresh event to update homepage
            window.dispatchEvent(new CustomEvent('hostel-feed-refresh'));
            toast.success(`Banner ${newStatus ? 'activated' : 'deactivated'}`);
        } catch (error: any) {
            toast.error('Failed to update banner');
        }
    };

    const deleteBanner = async (bannerId: string) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;

        try {
            const { error } = await supabase
                .from('school_banners')
                .delete()
                .eq('id', bannerId);

            if (error) throw error;

            setBanners(banners.filter(b => b.id !== bannerId));
            // Dispatch refresh event to update homepage
            window.dispatchEvent(new CustomEvent('hostel-feed-refresh'));
            toast.success('Banner deleted');
        } catch (error: any) {
            toast.error('Failed to delete banner');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
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
                            <h2 className="text-xl font-bold text-[#1a2a40] dark:text-white">Manage Banners</h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors text-zinc-500 dark:text-zinc-400"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
                                {/* Left Column: Configuration */}
                                <div className="space-y-6 lg:sticky lg:top-0">
                                    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[2.5rem] p-6 space-y-6 shadow-sm">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined text-sm">school</span>
                                                </div>
                                                <h3 className="font-bold text-[#1a2a40] dark:text-white">University Context</h3>
                                            </div>
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

                                        <div className="h-px bg-zinc-100 dark:bg-white/5" />

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                    <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                                                </div>
                                                <h3 className="font-bold text-[#1a2a40] dark:text-white">Create New Banner</h3>
                                            </div>

                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Banner Title (Optional)"
                                                    value={newTitle}
                                                    onChange={(e) => setNewTitle(e.target.value)}
                                                    className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary transition-all shadow-inner"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Banner Subtitle (Optional)"
                                                    value={newSubtitle}
                                                    onChange={(e) => setNewSubtitle(e.target.value)}
                                                    className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary transition-all shadow-inner"
                                                />

                                                <div className="grid grid-cols-3 gap-2 py-1">
                                                    {(['none', 'seller', 'product'] as const).map((type) => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setPromotionType(type)}
                                                            className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${promotionType === type ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-zinc-50 dark:bg-black/20 text-zinc-400 border-black/5 dark:border-white/5 hover:border-primary/50'}`}
                                                        >
                                                            {type === 'none' ? 'Standard' : type === 'seller' ? 'Seller' : 'Product'}
                                                        </button>
                                                    ))}
                                                </div>

                                                {promotionType === 'seller' && (
                                                    <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                                                        <div className="flex items-center gap-2 px-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Tag Merchant (Seller of Week)</label>
                                                        </div>

                                                        {selectedSeller ? (
                                                            <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 shadow-inner">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs font-black ring-2 ring-white dark:ring-white/5">
                                                                        {selectedSeller.full_name?.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-[#1a2a40] dark:text-white truncate max-w-[150px]">{selectedSeller.full_name}</p>
                                                                        <p className="text-[9px] text-zinc-400">{selectedSeller.email}</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => setSelectedSeller(null)}
                                                                    className="w-7 h-7 rounded-full bg-white dark:bg-white/5 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:text-red-500 transition-colors shadow-sm"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                                                    <span className="material-symbols-outlined text-sm">search</span>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search merchant by name..."
                                                                    value={sellerSearchQuery}
                                                                    onChange={(e) => setSellerSearchQuery(e.target.value)}
                                                                    className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl pl-9 pr-4 py-3 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-emerald-500 transition-all"
                                                                />

                                                                {isSearchingSellers && (
                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                        <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                                    </div>
                                                                )}

                                                                {foundSellers.length > 0 && (
                                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a110c] border border-black/5 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                                                        {foundSellers.map(seller => (
                                                                            <button
                                                                                key={seller.id}
                                                                                onClick={() => {
                                                                                    setSelectedSeller(seller);
                                                                                    setFoundSellers([]);
                                                                                    setSellerSearchQuery('');
                                                                                }}
                                                                                className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 last:border-0 transition-colors"
                                                                            >
                                                                                <p className="text-xs font-bold text-[#1a2a40] dark:text-white">{seller.full_name}</p>
                                                                                <p className="text-[9px] text-zinc-400">{seller.email} • {seller.brand_name || 'No Brand'}</p>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="relative border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary transition-all cursor-pointer group bg-zinc-50/50 dark:bg-black/10">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    disabled={isUploading || !selectedSchoolId}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed z-20"
                                                />
                                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                    <span className="material-symbols-outlined text-2xl font-bold">cloud_upload</span>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-black text-[#1a2a40] dark:text-white uppercase tracking-widest mb-1">
                                                        {isUploading ? 'Uploading...' : 'Upload Image'}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-zinc-400">PNG, JPG or WebP (Max 1MB)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Active Banners */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-sm">grid_view</span>
                                            </div>
                                            <h3 className="font-bold text-[#1a2a40] dark:text-white">Active Banner Gallery</h3>
                                        </div>
                                        <span className="text-[10px] font-black bg-zinc-100 dark:bg-white/10 px-3 py-1 rounded-full text-zinc-500 uppercase tracking-widest">
                                            {banners.length} Banners
                                        </span>
                                    </div>

                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fetching Banners...</p>
                                        </div>
                                    ) : banners.length === 0 ? (
                                        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-sm border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[2.5rem] p-12 text-center">
                                            <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined text-3xl text-zinc-300 dark:text-zinc-700">no_photography</span>
                                            </div>
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No custom banners yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
                                            {banners.map(banner => (
                                                <div key={banner.id} className="group bg-white dark:bg-[#1a110c] border border-black/5 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500">
                                                    <div className="h-40 w-full relative overflow-hidden">
                                                        <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        {!banner.is_active && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                                <span className="bg-red-500 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">Hidden From Feed</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <button
                                                                onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                                                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg ${banner.is_active ? 'bg-white text-primary hover:bg-primary hover:text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                                                title={banner.is_active ? 'Hide Banner' : 'Show Banner'}
                                                            >
                                                                <span className="material-symbols-outlined text-sm">{banner.is_active ? 'visibility' : 'visibility_off'}</span>
                                                            </button>
                                                            <button
                                                                onClick={() => deleteBanner(banner.id)}
                                                                className="w-9 h-9 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
                                                                title="Delete"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <p className="font-black text-sm text-[#1a2a40] dark:text-white truncate">{banner.title || 'Untitled Banner'}</p>
                                                            {banner.subtitle?.includes('[PROMO:seller]') && (
                                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20 shadow-sm">Merchant Highlight</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-medium text-zinc-500 truncate leading-relaxed">
                                                            {banner.subtitle?.replace(/\[PROMO:(seller|product)\]/, '').replace(/\[SELLER_ID:[^\]]+\]/, '') || 'No description provided'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
