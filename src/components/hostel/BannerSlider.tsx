import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Slide {
    id: string;
    image: string;
    title?: string;
    subtitle?: string;
}

interface BannerSliderProps {
    slides: Slide[];
    interval?: number;
}

export default function BannerSlider({ slides, interval = 5000 }: BannerSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, interval);

        return () => clearInterval(timer);
    }, [slides.length, interval]);

    if (!slides.length) return null;

    return (
        <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 my-4 group">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Background Image */}
                    <img
                        src={slides[currentIndex].image}
                        alt={slides[currentIndex].title || 'Banner'}
                        className="w-full h-full object-cover"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-2xl md:text-3xl font-bold mb-1"
                        >
                            {slides[currentIndex].title}
                        </motion.h2>
                        {slides[currentIndex].subtitle && (
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="text-sm md:text-base text-gray-200 font-medium"
                            >
                                {slides[currentIndex].subtitle}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-3 right-4 flex gap-2 z-10">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-white w-6'
                                : 'bg-white/40 hover:bg-white/60'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
