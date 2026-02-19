import { useState, useEffect } from 'react';
import { Camera, Search, Upload, X, ChevronDown, Check } from 'lucide-react';
import { UniqueVisitor, supabase } from '../../lib/supabase';

interface PostComposerProps {
    currentVisitor: UniqueVisitor | null;
    userIsHostelMerchant: boolean;
    isSearchView: boolean;
    onToggleView: (isSearch: boolean) => void;
    onPost: (text: string, images: File[], request: boolean, merchantId?: string) => Promise<void>;
    onSearch: (text: string) => Promise<void>;
    posting: boolean;
    onImageSearchPrompt: () => void;
    userIsAuthenticated: boolean;
    setShowAuthModal: (showAuthModal: boolean) => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

export default function PostComposerVuna({
    currentVisitor,
    userIsHostelMerchant,
    isSearchView,
    onToggleView,
    onPost,
    posting,
    userIsAuthenticated,
    setShowAuthModal,
    isExpanded,
    setIsExpanded
}: PostComposerProps) {
    const [composerText, setComposerText] = useState<string>('');
    const [composerImages, setComposerImages] = useState<File[]>([]);
    const [showBecomeMerchantModal, setShowBecomeMerchantModal] = useState(false);
    // Removed local isExpanded state

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

        if (isAdmin && isExpanded && !isSearchView) { // Only fetch when expanding post view
            fetchMerchants();
        }
    }, [isAdmin, isExpanded, isSearchView, currentVisitor?.schools?.id]);

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
        e.target.value = '';
    };

    const removeComposerImage = (index: number) => {
        setComposerImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (userIsAuthenticated) {
            await onPost(composerText, composerImages, isSearchView, selectedMerchant?.id);
            setComposerText('');
            setComposerImages([]);
            setIsExpanded(false);
            setSelectedMerchant(null);
            setMerchantSearchTerm('');
        } else {
            setShowAuthModal(true)
        }
    };

    const resetComposer = () => {
        setComposerText('');
        setComposerImages([]);
        setSelectedMerchant(null);
        setMerchantSearchTerm('');
    };

    if (!isExpanded) {
        return (
            <>
                <div className="p-4 border-b border-gray-800 flex gap-4">
                    <button
                        onClick={() => {
                            onToggleView(true);
                            setIsExpanded(true);
                        }}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Search className="w-5 h-5 text-gray-400" />
                        <span>Make Request</span>
                    </button>
                    <button
                        onClick={() => {
                            if (userIsHostelMerchant || isAdmin) {
                                onToggleView(false);
                                setIsExpanded(true);
                            } else {
                                setShowBecomeMerchantModal(true);
                            }
                        }}
                        className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Upload className="w-5 h-5" />
                        <span>Post Product</span>
                    </button>
                </div>

                {showBecomeMerchantModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity"
                        onClick={() => setShowBecomeMerchantModal(false)}
                    >
                        <div
                            className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-sm mx-4 transform transition-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-2">
                                {userIsAuthenticated ? 'Become a hostel merchant' : 'Sign in required'}
                            </h3>
                            <p className="text-gray-400 mb-6 text-sm">
                                {userIsAuthenticated
                                    ? `Hi ${currentVisitor?.full_name || 'User'}, you need to become a hostel merchant to be able to post products.`
                                    : 'Sign in to be able to post product'}
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowBecomeMerchantModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (userIsAuthenticated) {
                                            const whatsappUrl = `https://wa.me/2349082753819?text=${encodeURIComponent('hi, dami, i want to become a hostel merchant.')}`;
                                            window.open(whatsappUrl, '_blank');
                                        } else {
                                            setShowBecomeMerchantModal(false);
                                            setShowAuthModal(true);
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 transition-colors"
                                >
                                    {userIsAuthenticated ? 'Continue' : 'Sign In'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )
    }

    return (
        <div className="p-4 border-b border-gray-800 flex gap-3">
            <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#253341] flex items-center justify-center overflow-hidden">
                    {currentVisitor?.profile_picture ? (
                        <img src={currentVisitor.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm font-semibold text-[#8b98a5]">
                            {String(currentVisitor?.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex-1">
                {/* Admin Merchant Selector */}
                {isAdmin && !isSearchView && (
                    <div className="mb-3 relative">
                        <button
                            onClick={() => setShowMerchantDropdown(!showMerchantDropdown)}
                            className="flex items-center gap-2 text-sm font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg hover:bg-emerald-400/20 transition-colors"
                        >
                            <span>Posting as: <span className="text-white">{selectedMerchant ? (selectedMerchant.brand_name || selectedMerchant.full_name) : 'Myself'}</span></span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showMerchantDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showMerchantDropdown && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMerchantDropdown(false)} />
                                <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 flex flex-col max-h-80">
                                    <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800 rounded-t-xl z-30">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                value={merchantSearchTerm}
                                                onChange={(e) => setMerchantSearchTerm(e.target.value)}
                                                placeholder="Search merchants..."
                                                className="w-full bg-gray-900 text-white text-sm py-2 pl-9 pr-3 rounded-lg border border-gray-700 focus:border-emerald-500 outline-none"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                                        <button
                                            onClick={() => {
                                                setSelectedMerchant(null);
                                                setShowMerchantDropdown(false);
                                            }}
                                            className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors ${!selectedMerchant ? 'bg-emerald-500/10' : ''}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {currentVisitor?.profile_picture ? (
                                                    <img src={currentVisitor.profile_picture} alt="me" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-400">ME</span>
                                                )}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <div className="text-white text-sm font-medium truncate">Myself</div>
                                                <div className="text-gray-500 text-xs truncate">Post as Admin</div>
                                            </div>
                                            {!selectedMerchant && <Check className="w-4 h-4 text-emerald-500" />}
                                        </button>

                                        {loadingMerchants && (
                                            <div className="p-4 text-center text-gray-500 text-sm">Loading merchants...</div>
                                        )}

                                        {!loadingMerchants && filteredMerchants.length === 0 && (
                                            <div className="p-4 text-center text-gray-500 text-sm">No merchants found</div>
                                        )}

                                        {filteredMerchants.map((merchant) => (
                                            <button
                                                key={merchant.id}
                                                onClick={() => {
                                                    setSelectedMerchant(merchant);
                                                    setShowMerchantDropdown(false);
                                                }}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors ${selectedMerchant?.id === merchant.id ? 'bg-emerald-500/10' : ''}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {merchant.profile_picture ? (
                                                        <img src={merchant.profile_picture} alt={merchant.brand_name || 'merchant'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-gray-400">
                                                            {(merchant.brand_name || merchant.full_name || 'M')[0].toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <div className="text-white text-sm font-medium truncate">{merchant.brand_name || merchant.full_name}</div>
                                                    <div className="text-gray-500 text-xs truncate">{merchant.phone_number || merchant.email || 'No contact info'}</div>
                                                </div>
                                                {selectedMerchant?.id === merchant.id && <Check className="w-4 h-4 text-emerald-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="flex items-start justify-between">
                    <textarea
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        placeholder={isSearchView ? 'Who sells tote bags in hostel?' : 'What are you selling?'}
                        className="w-full bg-transparent text-white text-xl placeholder-gray-500 outline-none resize-none"
                        rows={2}
                    />
                    <div className="ml-3">
                        <button
                            onClick={() => {
                                resetComposer();
                                setIsExpanded(false);
                            }}
                            className="text-gray-400 hover:text-white p-2 rounded-full"
                            aria-label="Cancel"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {composerImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {composerImages.map((file, idx) => (
                            <div key={idx} className="relative rounded-2xl overflow-hidden">
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-48 object-cover" />
                                <button
                                    onClick={() => removeComposerImage(idx)}
                                    className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full p-2 transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onSelectImages}
                            className="hidden"
                            id="image-upload"
                        />
                        <button
                            onClick={() => {
                                document.getElementById('image-upload')?.click();
                            }}
                            className="text-emerald-300 bg-emerald-600/10 hover:bg-emerald-500/10 p-3 rounded-full transition-colors cursor-pointer"
                            aria-label="Add images"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={posting || (!composerText.trim() && composerImages.length === 0 && !isSearchView)}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors"
                    >
                        {isSearchView ? (posting ? 'Posting request...' : 'Request') : (posting ? 'Posting...' : 'Post')}
                    </button>
                </div>
            </div>
        </div>
    );
}
