import { HostelsProductUpdates, UniqueVisitor } from '../../lib/supabase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import RequestCard from './RequestCard';
import { motion } from 'framer-motion';

interface RequestsCarouselProps {
    requests: HostelsProductUpdates[];
    onItemClick: (item: HostelsProductUpdates) => void;
    onContact: (type: 'merchant' | 'recommend', item: HostelsProductUpdates) => void;
    currentVisitor?: UniqueVisitor | null;
    onDelete?: (item: HostelsProductUpdates) => void;
    onFulfill?: (item: HostelsProductUpdates) => void;
}

export default function RequestsCarousel({ requests, onItemClick, onContact, currentVisitor, onDelete, onFulfill }: RequestsCarouselProps) {
    if (!requests || requests.length === 0) return null;

    return (
        <div className="py-4">
            <div className="px-4 mb-3 flex items-center justify-between">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Live Requests
                </h3>
                <span className="text-xs text-gray-500 font-medium">{requests.length} active</span>
            </div>

            <Swiper
                modules={[FreeMode]}
                spaceBetween={16}
                slidesPerView="auto"
                freeMode={{
                    enabled: true,
                    momentum: true,
                    momentumRatio: 0.5
                }}
                className="px-4 !pl-4 pb-2"
                slidesOffsetAfter={16}
            >
                {requests.map((item, idx) => (
                    <SwiperSlide key={item.id} className="!w-auto">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                        >
                            <RequestCard
                                item={item}
                                onClick={() => onItemClick(item)}
                                currentVisitor={currentVisitor}
                                onContact={onContact}
                                onDelete={onDelete}
                                onFulfill={onFulfill}
                            />
                        </motion.div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
