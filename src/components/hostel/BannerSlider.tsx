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
        <div className="relative w-full h-48 md:h-[320px] rounded-2xl overflow-hidden shadow-2xl my-4 group bg-gray-900">
            <AnimatePresence mode='popLayout'>
                <motion.div
                    key={currentIndex}
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-100%", opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Background Image */}
                    <img
                        src={slides[currentIndex].image}
                        alt={slides[currentIndex].title || 'Banner'}
                        className="w-full h-full object-cover"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 w-full h-full p-8 md:p-12 flex flex-col justify-center">
                        <div className="max-w-xl">
                            {slides[currentIndex].subtitle && (
                                <motion.span
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="inline-block px-3 py-1 mb-4 rounded-full bg-orange-600 text-white text-xs font-bold tracking-wider uppercase"
                                >
                                    Hostel Special
                                </motion.span>
                            )}

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg"
                            >
                                {slides[currentIndex].title}
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-sm md:text-lg text-gray-200 font-medium mb-8 max-w-md drop-shadow-md"
                            >
                                {slides[currentIndex].subtitle}
                            </motion.p>

                            {/* Desktop Buttons - Hidden on Mobile */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="hidden md:flex items-center gap-4"
                            >
                                <button className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold transition-transform hover:scale-105 shadow-lg">
                                    Order Now
                                </button>
                                <button className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full font-bold transition-all shadow-lg">
                                    View Menu
                                </button>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-orange-500 w-8'
                                : 'bg-white/30 hover:bg-white/50 w-4'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );

}
