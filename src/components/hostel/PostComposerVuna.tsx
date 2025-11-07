import { useState } from 'react';
import { Camera, Search, Upload } from 'lucide-react';
import { UniqueVisitor } from '../../lib/supabase';

interface PostComposerProps {
    currentVisitor: UniqueVisitor | null;
    userIsHostelMerchant: boolean;
    isSearchView: boolean;
    onToggleView: (isSearch: boolean) => void;
    onPost: (text: string, images: File[], request: boolean) => Promise<void>;
    onSearch: (text: string) => Promise<void>;
    posting: boolean;
    onImageSearchPrompt: () => void;
    userIsAuthenticated: boolean;
    setShowAuthModal: (showAuthModal: boolean) => void;
}

export default function PostComposerVuna({
    currentVisitor,
    userIsHostelMerchant,
    isSearchView,
    onToggleView,
    onPost,
    posting,
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
        if (userIsAuthenticated) {
            await onPost(composerText, composerImages, true);
            setComposerText('');
            setComposerImages([]);
            onToggleView(true);
        } else {
            setShowAuthModal(true)
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
                        placeholder={isSearchView ? 'Who sells tote bags in hostel?' : 'What are you selling?'}
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
                            ) : userIsHostelMerchant ? (
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
                            ) : <></>
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
