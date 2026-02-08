import { Icon } from '@iconify/react';


interface ImageModalProps {
    isOpen: boolean;
    images: string[];
    activeIndex: number;
    onClose: () => void;
    onIndexChange: (index: number) => void;
    description?: string;
}

export default function ImageModal({ isOpen, images, activeIndex, onClose, onIndexChange, description }: ImageModalProps) {
    if (!isOpen) return null;

    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        onIndexChange(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        onIndexChange(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
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
                <Icon icon="mdi:close-circle" width={32} height={32} />
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={stopPropagation}>
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-4 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
                            aria-label="Previous image"
                        >
                            <Icon icon="mdi:arrow-left" width={32} height={32} />
                        </button>

                        <button
                            onClick={handleNext}
                            className="absolute right-4 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-3"
                            aria-label="Next image"
                        >
                            <Icon icon="mdi:arrow-right" width={32} height={32} />
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
                                    onIndexChange(index);
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${index === activeIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                                    }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
                {description && (
                    <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                        <div className="inline-block bg-black/70 backdrop-blur-sm px-6 py-3 rounded-xl max-w-2xl mx-4 pointer-events-auto">
                            <p className="text-white text-sm md:text-base font-medium leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
