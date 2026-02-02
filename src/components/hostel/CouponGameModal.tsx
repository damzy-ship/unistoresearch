import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coupon, supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CouponGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCouponClaimed: (coupon: Coupon) => void;
}

export const CouponGameModal: React.FC<CouponGameModalProps> = ({ isOpen, onClose, onCouponClaimed }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

    // Check for pending coupon on mount
    useEffect(() => {
        if (isOpen) {
            const pending = localStorage.getItem('hostel_coupon_pending');
            if (pending) {
                try {
                    const parsed = JSON.parse(pending);
                    // Check expiry (1 hour from PICK time)
                    // We need to store pickTime. 
                    // Let's assume claimedAt logic handles expiry, but here we just prevent picking again.
                    // If it's pending, we show it.
                    // If it's effectively expired, we should probably clear it? 
                    // User said: "deleted after coupon is expired".

                    const oneHour = 60 * 60 * 1000;
                    if (Date.now() - parsed.claimedAt < oneHour) {
                        setActiveCoupon(parsed);
                        setRevealed(true);
                        setCardPicked(true);
                    } else {
                        localStorage.removeItem('hostel_coupon_pending');
                    }
                } catch (e) {
                    localStorage.removeItem('hostel_coupon_pending');
                }
            }
            fetchCoupons();
        }
    }, [isOpen]);

    const [cardPicked, setCardPicked] = useState(false);

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('claimed', false)
                .limit(9);
            if (error) throw error;
            if (data) setCoupons(data as Coupon[]);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCardClick = (coupon: Coupon) => {
        if (selectedCardId || cardPicked) return; // Prevent multiple clicks
        setSelectedCardId(coupon.id);

        // Save as pending immediately
        const couponWithTime = { ...coupon, claimedAt: Date.now() };
        setActiveCoupon(couponWithTime);
        localStorage.setItem('hostel_coupon_pending', JSON.stringify(couponWithTime));
        setCardPicked(true);

        // Sequence: Flip (wait 600ms) -> Grow (setRevealed)
        setTimeout(() => {
            setRevealed(true);
        }, 800);
    };

    const updateCouponStatus = async (id: string) => {
        // Optimistically update, but we really should sync with DB
    };

    const handleContinue = async () => {
        if (!activeCoupon) return;
        try {
            await supabase.from('coupons').update({ claimed: true }).eq('id', activeCoupon.id);
            // We keep pending in storage until expiry? Or clear it now that it's "Claimed" and moved to "Active"?
            // User: "store another variable ... which should be deleted after coupon is expired."
            // If we move to "Active Claimed" state in HomePage, we might rely on 'hostel_coupon'.
            // 'hostel_coupon_pending' is just to lock the selection.
            // We can keep it or sync it.
            // Let's keep it to prevent re-picking even after claiming (until expiry).
            onCouponClaimed(activeCoupon);
        } catch (e) {
            toast.error("Failed to claim. Please screenshot and contact support.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <AnimatePresence mode="sync">
                {/* Selection Phase - Hide if revealed OR if we loaded a pending coupon immediately */}
                {!revealed && !activeCoupon && (
                    <motion.div
                        className="w-full max-w-4xl p-4 md:p-6 text-center max-h-[95vh] flex flex-col items-center"
                        exit={{ opacity: 0 }}
                    >
                        <h2 className="text-2xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 md:mb-8 animate-pulse shrink-0">
                            Pick Your Mystery Gift! 🎁
                        </h2>

                        {loading ? (
                            <div className="text-white">Shuffling rewards...</div>
                        ) : (
                            <div
                                className={`grid ${coupons.length > 4 ? 'grid-cols-3 gap-2' : 'grid-cols-2 gap-3'} md:flex md:flex-wrap md:justify-center md:gap-6 overflow-y-auto px-2 pb-4 w-full justify-items-center`}
                                style={{ perspective: '1000px' }}
                            >
                                {coupons.map((coupon, index) => (
                                    <motion.div
                                        layoutId={cardPicked ? undefined : `coupon-${coupon.id}`}
                                        key={coupon.id}
                                        initial={{ rotateY: 0, scale: 0 }}
                                        animate={{
                                            rotateY: selectedCardId === coupon.id ? 180 : 0,
                                            scale: 1,
                                            transition: { delay: index * 0.05, duration: 0.5 }
                                        }}
                                        whileHover={{
                                            scale: 1.05,
                                            y: -5,
                                            boxShadow: "0px 0px 20px rgba(168, 85, 247, 0.4)"
                                        }}
                                        onClick={() => handleCardClick(coupon)}
                                        className={`relative w-full aspect-[2/3] md:w-56 md:h-80 cursor-pointer transition-all duration-300 ${selectedCardId && selectedCardId !== coupon.id ? 'opacity-0 scale-0 pointer-events-none' : ''
                                            }`}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Back of Card (Question Mark) - Initial View */}
                                        <div
                                            className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 rounded-xl md:rounded-2xl border border-purple-500/50 shadow-2xl flex items-center justify-center overflow-hidden"
                                            style={{ backfaceVisibility: 'hidden' }}
                                        >
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                                            <div className="text-3xl md:text-6xl animate-bounce">?</div>
                                        </div>

                                        {/* Front of Card (Revealed during flip) */}
                                        <div
                                            className="absolute inset-0 w-full h-full bg-gray-900 rounded-xl md:rounded-2xl border-2 border-purple-500 flex flex-col items-center justify-center p-2"
                                            style={{ transform: "rotateY(180deg)", backfaceVisibility: 'hidden' }}
                                        >
                                            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">You Won</div>
                                            <div className="text-xl md:text-2xl font-bold text-white mb-2">{coupon.code}</div>
                                            <div className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                                                -₦{coupon.value.toLocaleString()}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Revealed Phase - The Modal */}
                {revealed && activeCoupon && (
                    <motion.div
                        layoutId={`coupon-${activeCoupon.id}`}
                        initial={{ rotateY: 180, scale: 0.5, opacity: 0 }}
                        // Start matching the grid card state (flipped, smaller)

                        animate={{ rotateY: 360, scale: 1, opacity: 1 }}
                        // Rotate to 360 (flat) and scale up

                        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}

                        className="fixed z-50 bg-gray-900 text-white p-6 md:p-12 rounded-3xl border-4 border-purple-500 shadow-[0_0_100px_rgba(168,85,247,0.5)] max-w-lg w-[90%] md:w-full text-center relative overflow-hidden flex flex-col items-center"
                        style={{ perspective: 1000 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                            className="w-full flex flex-col items-center relative z-10"
                        >
                            {/* Confetti/Rays effects */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none -z-10"></div>

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-black text-2xl md:text-3xl py-2 px-6 rounded-full inline-block mb-6 shadow-xl"
                            >
                                YOU WON!
                            </motion.div>

                            <h3 className="text-xl text-gray-400 uppercase tracking-widest mb-2">Coupon Code</h3>
                            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-6 mb-6 w-full">
                                <code className="text-4xl md:text-5xl font-mono text-purple-400 font-bold tracking-wider break-all">
                                    {activeCoupon.code}
                                </code>
                            </div>

                            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-8">
                                -₦{activeCoupon.value.toLocaleString()}
                            </div>

                            <div className="bg-purple-900/30 p-4 rounded-xl border border-purple-500/30 mb-8 text-sm text-left space-y-2 w-full">
                                <p className="font-bold text-purple-300">📌 Instructions:</p>
                                <ol className="list-decimal pl-5 space-y-1 text-gray-300">
                                    <li>Take a screenshot of this card NOW. 📸</li>
                                    <li>Contact the vendor and show this screenshot.</li>
                                    <li>Use within 1 hour or it expires!</li>
                                </ol>
                            </div>

                            <button
                                onClick={handleContinue}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
                            >
                                Claim & Start Shopping →
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
