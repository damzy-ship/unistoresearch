import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ImageModalProps {
    isOpen: boolean;
    images: string[];
    initialIndex?: number;
    onClose: () => void;
}

export default function ImageModal({ isOpen, images, initialIndex = 0, onClose }: ImageModalProps) {
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    if (!isOpen) return null;

    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const stopPropagation = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                aria-label="Close"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={stopPropagation}>
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-4 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>

                        <button
                            onClick={handleNext}
                            className="absolute right-4 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    </>
                )}

                <div className="max-w-6xl max-h-full">
                    <img
                        src={images[activeIndex]}
                        alt={`Image ${activeIndex + 1}`}
                        className="max-w-full max-h-[90vh] object-contain"
                    />
                </div>

                {images.length > 1 && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full">
                        <span className="text-white font-medium">
                            {activeIndex + 1} / {images.length}
                        </span>
                    </div>
                )}

                {images.length > 1 && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveIndex(index);
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    index === activeIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                                }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
