import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { UniqueVisitor, supabase } from '../../lib/supabase';
import { PostDrawer } from '../ui/PostDrawer';
import { Button } from '../ui/Button';
import BecomeMerchantDrawer from './BecomeMerchantDrawer';

interface PostComposerProps {
    currentVisitor: UniqueVisitor | null;
    userIsHostelMerchant: boolean;
    isSearchView: boolean; // Kept for prop compatibility, but likely internal state now
    onToggleView: (isSearch: boolean) => void;
    onPost: (text: string, images: File[], request: boolean, merchantId?: string) => Promise<void>;
    onSearch: (text: string) => Promise<void>; // Legacy?
    posting: boolean;
    onImageSearchPrompt: () => void;
    userIsAuthenticated: boolean;
    setShowAuthModal: (showAuthModal: boolean) => void;
}

export default function PostComposerVuna({
    currentVisitor,
    userIsHostelMerchant,
    // isSearchView: propIsSearchView, // We might manage this internally now or respect prop
    onToggleView,
    onPost,
    posting,
    userIsAuthenticated,
    setShowAuthModal
}: PostComposerProps) {
    const [composerText, setComposerText] = useState<string>('');
    const [composerImages, setComposerImages] = useState<File[]>([]);
    const [showBecomeMerchantModal, setShowBecomeMerchantModal] = useState(false);

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'request' | 'product'>('request'); // 'request' or 'product'

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

        if (isAdmin && isDrawerOpen) {
            fetchMerchants();
        }
    }, [isAdmin, isDrawerOpen, currentVisitor?.schools?.id]);

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


    const onSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setComposerImages((prev) => [...prev, ...files].slice(0, 4));
        e.target.value = ''; // Reset
    };

    const removeComposerImage = (index: number) => {
        setComposerImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (userIsAuthenticated) {
            const isRequest = activeTab === 'request';
            await onPost(composerText, composerImages, isRequest, selectedMerchant?.id);
            setComposerText('');
            setComposerImages([]);
            setIsDrawerOpen(false);
            setSelectedMerchant(null);
            setMerchantSearchTerm('');
        } else {
            setShowAuthModal(true);
            setIsDrawerOpen(false);
        }
    };

    const handleOpenDrawer = (tab: 'request' | 'product') => {
        if (tab === 'product' && !userIsHostelMerchant && !isAdmin) {
            setShowBecomeMerchantModal(true);
            return;
        }
        setActiveTab(tab);
        setIsDrawerOpen(true);
        // Sync parent state if needed, though we are capturing logic here
        onToggleView(tab === 'request');
    };

    return (
        <>
            {/* TRIGGER AREA - Clean Bar */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-30">
                <div className="flex gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                            {currentVisitor?.profile_picture ? (
                                <img src={currentVisitor.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-gray-400">
                                    {String(currentVisitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => handleOpenDrawer('request')}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-left px-4 rounded-full flex items-center text-gray-500 dark:text-gray-400 text-sm transition-colors border border-transparent dark:border-gray-700"
                    >
                        What are you looking for?
                    </button>

                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full flex-shrink-0"
                        onClick={() => handleOpenDrawer('product')}
                    >
                        <Icon icon="mdi:plus" width={18} height={18} />
                    </Button>
                </div>
            </div>

            {/* DRAWER COMPOSER */}
            <PostDrawer
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
            >
                <div className="flex flex-col h-full">
                    {/* Header with Tabs */}
                    <div className="flex items-center justify-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-center">
                        <button
                            onClick={() => setActiveTab('request')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'request' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Request Item
                        </button>
                        <button
                            onClick={() => setActiveTab('product')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'product' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Post Product
                        </button>
                    </div>

                    {/* Admin Merchant Selector */}
                    {isAdmin && activeTab === 'product' && (
                        <div className="mb-4 relative z-50">
                            <button
                                onClick={() => setShowMerchantDropdown(!showMerchantDropdown)}
                                className="w-full flex items-center justify-between gap-2 text-sm font-medium text-orange-400 bg-orange-900/10 dark:bg-orange-400/10 px-4 py-3 rounded-xl hover:bg-orange-900/20 dark:hover:bg-orange-400/20 transition-colors border border-orange-500/20"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-gray-500">Posting as:</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{selectedMerchant ? (selectedMerchant.brand_name || selectedMerchant.full_name) : 'Myself'}</span>
                                </span>
                                <Icon icon="mdi:chevron-down" className={`w-4 h-4 transition-transform ${showMerchantDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showMerchantDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 flex flex-col max-h-60 overflow-hidden">
                                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                        <input
                                            type="text"
                                            value={merchantSearchTerm}
                                            onChange={(e) => setMerchantSearchTerm(e.target.value)}
                                            placeholder="Search merchants..."
                                            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:border-orange-500 outline-none"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="overflow-y-auto flex-1">
                                        <button
                                            onClick={() => {
                                                setSelectedMerchant(null);
                                                setShowMerchantDropdown(false);
                                            }}
                                            className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 flex items-center justify-between group"
                                        >
                                            <span className="font-medium text-gray-900 dark:text-white group-hover:text-orange-500">Myself</span>
                                            {!selectedMerchant && <Icon icon="mdi:check-circle" width={16} className="text-orange-500" />}
                                        </button>
                                        {loadingMerchants && (
                                            <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                                        )}
                                        {filteredMerchants.map(merchant => (
                                            <button
                                                key={merchant.id}
                                                onClick={() => {
                                                    setSelectedMerchant(merchant);
                                                    setShowMerchantDropdown(false);
                                                }}
                                                className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                                        {merchant.profile_picture && <img src={merchant.profile_picture} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white group-hover:text-orange-500">{merchant.brand_name || merchant.full_name}</span>
                                                </div>
                                                {selectedMerchant?.id === merchant.id && <Icon icon="mdi:check-circle" width={16} className="text-orange-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Text Input */}
                    <textarea
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        placeholder={activeTab === 'request' ? "I'm looking for..." : "What are you selling today?"}
                        className="w-full bg-transparent text-gray-900 dark:text-white text-2xl placeholder-gray-400 outline-none resize-none flex-1 min-h-[150px]"
                        autoFocus
                    />

                    {/* Image Preview Grid */}
                    {composerImages.length > 0 && (
                        <div className="mb-4 grid grid-cols-2 gap-3">
                            {composerImages.map((file, idx) => (
                                <div key={idx} className="relative rounded-xl overflow-hidden aspect-video group">
                                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeComposerImage(idx)}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Icon icon="mdi:close-circle" width={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="mt-auto pt-4 pb-8 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={onSelectImages}
                                    className="hidden"
                                    id="drawer-image-upload"
                                />
                                <Button
                                    variant="secondary"
                                    onClick={() => document.getElementById('drawer-image-upload')?.click()}
                                    className="h-12 w-12 rounded-xl p-0"
                                >
                                    <Icon icon="mdi:image-outline" width={24} height={24} className="text-orange-600 dark:text-orange-400" />
                                </Button>
                                {/* <Button variant="ghost" className="h-12 w-12 rounded-xl p-0">
                                    <Camera />
                                </Button> */}
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={posting || (!composerText.trim() && composerImages.length === 0)}
                                className={`flex-1 h-12 text-lg rounded-xl font-bold ${activeTab === 'product' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                                variant={activeTab === 'product' ? 'primary' : 'primary'} // Visual preference
                            >
                                {posting ? 'Posting...' : (activeTab === 'request' ? 'Post Request' : 'Post Product')}
                            </Button>
                        </div>
                    </div>
                </div>
            </PostDrawer >

            {/* Become Merchant Drawer */}
            < BecomeMerchantDrawer
                isOpen={showBecomeMerchantModal}
                onClose={() => setShowBecomeMerchantModal(false)
                }
            />
        </>
    );
}
