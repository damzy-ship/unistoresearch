import { useState } from 'react';
import { Search, Upload } from 'lucide-react';
import { UniqueVisitor } from '../../lib/supabase';

interface PostComposerProps {
    currentVisitor: UniqueVisitor | null;
    userIsHostelMerchant: boolean;
    isSearchView: boolean;
    onToggleView: (isSearch: boolean) => void;
    onPost: (text: string, images: File[]) => Promise<void>;
    onSearch: (text: string) => Promise<void>;
    posting: boolean;
    onImageSearchPrompt: () => void;
    userIsAuthenticated: boolean;
    setShowAuthModal: (showAuthModal: boolean) => void;
}

export default function PostComposer({
    currentVisitor,
    userIsHostelMerchant,
    isSearchView,
    onToggleView,
    onPost,
    onSearch,
    posting,
    onImageSearchPrompt,
    userIsAuthenticated,
    setShowAuthModal
}: PostComposerProps) {
    const [composerText, setComposerText] = useState<string>('');
    const [composerImages, setComposerImages] = useState<File[]>([]);


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
        if (isSearchView) {
            await onSearch(composerText);
        } else {
            if(userIsAuthenticated){
                await onPost(composerText, composerImages);
                setComposerText('');
                setComposerImages([]);
                onToggleView(true);
            }else{
                setShowAuthModal(true)
            }
        }
    };

    const resetComposer = () => {
        setComposerText('');
        setComposerImages([]);
    };



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
                <div className="flex items-start justify-between">
                    <textarea
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        placeholder={isSearchView ? 'What are you looking for?' : userIsHostelMerchant? 'What are you selling?' : 'Who sells tote bags in hostel?'}
                        className="w-full bg-transparent text-white text-xl placeholder-gray-500 outline-none resize-none"
                        rows={2}
                    />
                    <div className="ml-3">
                        {
                            !isSearchView ? (
                                <button
                                    onClick={() => {
                                        resetComposer();
                                        onToggleView(true);
                                    }}
                                    className="text-gray-400 hover:text-white p-2 rounded-full"
                                    aria-label="Search mode"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        resetComposer();
                                        onToggleView(false);
                                    }}
                                    className="text-gray-400 hover:text-white p-2 rounded-full"
                                    aria-label="Post mode"
                                >
                                    <Upload className="w-5 h-5" />
                                </button>
                            )
                        }
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
                                if (isSearchView) onImageSearchPrompt();
                                else document.getElementById('image-upload')?.click();
                            }}
                            className="text-emerald-500 hover:bg-emerald-500/10 p-2 rounded-full transition-colors cursor-pointer"
                            aria-label="Add images"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
                                <path fill="currentColor" d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2M8.5 12.5l2.5 3l3.5-4.5L19 17H5m3-7a2 2 0 1 1 2-2a2 2 0 0 1-2 2Z" />
                            </svg>
                        </button>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={posting || (!composerText.trim() && composerImages.length === 0 && !isSearchView)}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-full transition-colors"
                    >
                        {isSearchView ? (posting ? 'Searching...' : 'Search') : userIsHostelMerchant ? (posting ? 'Posting...' : 'Post') : (posting ? 'Posting request...' : 'Request')}
                    </button>
                </div>
            </div>
        </div>
    );
}
