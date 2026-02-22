import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, School } from '../../lib/supabase';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

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

            // Create record
            const { error: insertError } = await supabase
                .from('school_banners')
                .insert({
                    school_id: selectedSchoolId,
                    image_url: publicUrl,
                    title: newTitle || null,
                    subtitle: newSubtitle || null,
                    is_active: true
                });

            if (insertError) throw insertError;

            toast.success('Banner added successfully', { id: 'upload-banner' });
            setNewTitle('');
            setNewSubtitle('');
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

            setBanners(banners.map(b => b.id === bannerId ? { ...b, is_active: !currentStatus } : b));
            toast.success('Banner updated');
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
                        className="relative w-full max-w-md h-full bg-[#f8f6f5] dark:bg-[#1a110c] shadow-2xl flex flex-col z-10"
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

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* School Selector */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Select University</label>
                                <select
                                    className="w-full bg-white dark:bg-[#2a1a14] border border-black/5 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-medium text-[#1a2a40] dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
                                    value={selectedSchoolId}
                                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                                >
                                    {schools.map(school => (
                                        <option key={school.id} value={school.id}>{school.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Upload New Banner */}
                            <div className="bg-white dark:bg-[#2a1a14] border border-black/5 dark:border-white/10 rounded-[2rem] p-6 space-y-4 shadow-sm">
                                <h3 className="font-bold text-[#1a2a40] dark:text-white">Add New Banner</h3>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Banner Title (Optional)"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-4 py-2 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Banner Subtitle (Optional)"
                                        value={newSubtitle}
                                        onChange={(e) => setNewSubtitle(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl px-4 py-2 text-sm text-[#1a2a40] dark:text-white outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="relative border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors cursor-pointer group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isUploading || !selectedSchoolId}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-xl">upload</span>
                                    </div>
                                    <p className="text-xs font-bold text-zinc-500 text-center">
                                        {isUploading ? 'Uploading...' : 'Tap to upload an image'}
                                    </p>
                                </div>
                            </div>

                            {/* Existing Banners */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-[#1a2a40] dark:text-white">Active Banners for School</h3>

                                {isLoading ? (
                                    <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                                ) : banners.length === 0 ? (
                                    <p className="text-sm text-zinc-400 text-center py-8">No custom banners yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {banners.map(banner => (
                                            <div key={banner.id} className="bg-white dark:bg-[#2a1a14] border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                                                <div className="h-32 w-full relative">
                                                    <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
                                                    {!banner.is_active && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                                            <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Hidden</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 flex items-center justify-between">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <p className="font-bold text-sm text-[#1a2a40] dark:text-white truncate">{banner.title || 'Untitled Banner'}</p>
                                                        <p className="text-xs text-zinc-500 truncate">{banner.subtitle}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${banner.is_active ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}
                                                            title={banner.is_active ? 'Hide Banner' : 'Show Banner'}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">{banner.is_active ? 'visibility' : 'visibility_off'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteBanner(banner.id)}
                                                            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 hover:bg-red-500 hover:text-white transition-colors"
                                                            title="Delete"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
