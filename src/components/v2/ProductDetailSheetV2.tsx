import React, { useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface ProductDetailSheetV2Props {
    isOpen: boolean;
    onClose: () => void;
    product?: any;
}

export const ProductDetailSheetV2: React.FC<ProductDetailSheetV2Props> = ({
    isOpen,
    onClose,
    product
}) => {
    const controls = useAnimation();

    useEffect(() => {
        if (isOpen) {
            controls.start({ y: 0 });
        }
    }, [isOpen, controls]);

    if (!isOpen) return null;

    const displayProduct = product || {
        name: 'Fresh Homemade Sourdough',
        price: '2,500',
        oldPrice: '3,000',
        category: 'Bakery & Snacks',
        seller: 'Tunde Oladapo',
        loc: 'Hall 4, Room 302',
        rating: '4.9',
        description: 'Experience the authentic taste of slow-fermented artisanal sourdough. Baked fresh every morning in my dorm kitchen using organic flour and a 3-year-old starter. Perfect for sandwiches or just with some butter.',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9FoQAzLiZu-WiNdyOdE6qLxAQrxj3k_H6vpgo1evE9wD70PSMmkduAK7E54ROK3WJu3_Bs9627RigBOvuLPqxZhGGj0p6gOFSL4PgjHzGzuCIu_AOV1rnM9lE80JMQ0IFXEHJgqRF1y7OlG3nRL5jIRfzVzNJCwblq7TR1lslI-IMblYTCw3HaqLMuh-uizNgxTSLadA-iPOEHATsLimQAfIX95fG-GlkEixnmtpVPL_bPXkup8kiH0sVhmhKiPMY2tZJuifehSQ'
    };

    // Use product images if available, otherwise mock a few
    const images = product?.images?.length > 0
        ? product.images
        : [displayProduct.img, displayProduct.img, displayProduct.img];

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        } else {
            controls.start({ y: 0 });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
                        onClick={onClose}
                    />

                    {/* The Sheet */}
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        initial={{ y: '100%' }}
                        animate={controls}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative flex h-[85vh] w-full flex-col rounded-t-[3rem] bg-white dark:bg-[#221610] shadow-2xl overflow-hidden border-t border-white/20 z-10"
                    >
                        {/* Handle Bar Area - Explicitly for dragging */}
                        <div className="flex h-12 w-full items-center justify-center pt-2 cursor-grab active:cursor-grabbing shrink-0">
                            <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                            {/* Image Carousel Section */}
                            <div className="px-4">
                                <Swiper
                                    modules={[Autoplay, Pagination]}
                                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                                    pagination={{ dynamicBullets: true, clickable: true }}
                                    spaceBetween={12}
                                    loop={true}
                                    className="w-full aspect-[4/5] rounded-3xl !pb-8"
                                >
                                    {images.map((img: string, i: number) => (
                                        <SwiperSlide key={i}>
                                            <div
                                                className="w-full h-full bg-cover bg-center rounded-3xl shadow-md border border-zinc-100 dark:border-zinc-800"
                                                style={{ backgroundImage: `url('${img}')` }}
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>

                            {/* Product Info */}
                            <div className="px-6 pt-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">{displayProduct.name}</h1>
                                        <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium mt-1 tracking-wide">{displayProduct.category || 'Bakery & Snacks'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">₦{displayProduct.price}</p>
                                        {displayProduct.oldPrice && <p className="text-sm text-zinc-400 line-through">₦{displayProduct.oldPrice}</p>}
                                    </div>
                                </div>

                                {/* Seller Card */}
                                <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-12 w-12 rounded-full border-2 border-white dark:border-zinc-600 shadow-sm bg-cover bg-center bg-zinc-200"
                                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAOkQXxLVWEgdGx319Xuk5fzA2_nEMJ_3OBr70yTUgxpib1V2L6gOg-1nn1O6-nOyqwLsWGF0VYtRCx-CQ2YbNTXwtu6KTfNNU3b_2_ujhDNS6QtwcF79HW9kqV7ecAyKnvk1jQzTw_TBz8_137kfwTa0BU0EPm7c_nIiHOFXxTy8AdJtxpFnrUwjwXJYReYBFjSFyygNd8I-BmtYPirk0xRAfySocJ-pSvuVJ-r4kWvgzPZoh43l9Tc8qnl5Tc1O8f3U83mAkRUYE')" }}
                                        ></div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{displayProduct.seller}</p>
                                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                <span className="material-symbols-outlined text-xs">location_on</span>
                                                <span>{displayProduct.loc}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-700 px-2.5 py-1 rounded-full shadow-sm">
                                        <span className="material-symbols-outlined text-primary text-sm fill-1">star</span>
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{displayProduct.rating || '4.9'}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mt-8">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">Description</h3>
                                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                                        {displayProduct.description}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-700">Artisanal</span>
                                        <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-700">Dorm-baked</span>
                                        <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-700">Organic</span>
                                    </div>
                                </div>

                                {/* Campus Map Snippet */}
                                <div className="mt-8">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">Pickup Location</h3>
                                    <div className="h-40 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-700">
                                        <img className="w-full h-full object-cover opacity-60 dark:opacity-40" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7-GaqwsyUCErSKiAV_I5Lukji5va4cNJ1JBu4D2Sa_6jXMtHElAPLX9eMQxKWDeN48PDZ8b3feacGUd7rxyHz1jl-Ioj9SAreYctYUrcGu90oQlU60AQqrs1NZaMBlaRe5Z48sxNJ-5sOHVSTX137QUg-QKzIuLJJOvIlROzsrHDS_FX2Wn477tNbgebn-ssisbIdGBZlAlT2FhGJxGjN00Z-AzVx36kWTS1dLyLVf8vY8V013_BanRlZGOSv1tlsIIuMTZW1C4I" alt="Map" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-xl">
                                                <span className="material-symbols-outlined text-white text-base">location_on</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Bottom Action Bar */}
                        <div className="p-6 bg-white dark:bg-[#221610] border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shrink-0">
                            <button className="h-14 w-14 rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-primary transition-colors hover:border-primary/20">
                                <span className="material-symbols-outlined text-[28px]">favorite</span>
                            </button>
                            <button className="flex-1 h-14 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95">
                                <span className="material-symbols-outlined">chat</span>
                                Contact Seller
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
