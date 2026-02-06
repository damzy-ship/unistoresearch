import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coupon, supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CouponGameModalProps {
    isOpen: boolean;
    onCouponClaimed: (coupon: Coupon) => void;
    schoolId: string;
    userId?: string;
    onClose: () => void;
}

export const CouponGameModal: React.FC<CouponGameModalProps> = ({ isOpen, onCouponClaimed, schoolId, userId, onClose }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

    // Check for pending coupon? Moving to purely DB driven for simplicity/consistency.
    // If we want to persist a "picked but not claimed" state, we'd need a DB field or local storage.
    // Given the request to move away from local storage, we'll reset on close/reopen unless claimed.

    useEffect(() => {
        if (isOpen && schoolId) {
            fetchCoupons();
        }
    }, [isOpen, schoolId]);

    const [cardPicked, setCardPicked] = useState(false);

    const fetchCoupons = async () => {
        if (!schoolId) return;
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('school_id', schoolId)
                .order('value', { ascending: false }); // Show big prizes? or shuffle?

            if (error) throw error;
            if (data) {
                // Sort: unclaimed first, then claimed? Or just mix?
                // "all coupons whether claimed or not ... only ones not claimed should be claimable"
                // Let's shuffle them but maybe keep claimed ones visually distinct.
                setCoupons(data as Coupon[]);
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCardClick = (coupon: Coupon) => {
        if (selectedCardId || cardPicked || coupon.claimed) return; // Prevent picking claimed/multiple
        setSelectedCardId(coupon.id);

        setActiveCoupon(coupon);
        setCardPicked(true);

        // Sequence: Flip (wait 600ms) -> Grow (setRevealed)
        setTimeout(() => {
            setRevealed(true);
        }, 800);
    };

    // const updateCouponStatus = async (id: string) => {
    //     // Optimistically update, but we really should sync with DB
    // };

    const handleContinue = async () => {
        if (!activeCoupon) return;
        try {
            // If user not signed in, we can't claim against their ID officially.
            // But we can mark it claimed=true?
            // "fetch from user's school id in local storage" implies guests can play.
            // If guest, maybe we just mark it claimed? But then who claimed it?
            // Supabase RLS might block if no auth.
            // Assuming RLS allows update if policy matches or if using public logic (risky but possible).
            // Let's try to update.
            const updates: any = { claimed: true, claimed_at: Date.now() };
            if (userId) updates.claimed_by = userId;

            const { error } = await supabase.from('coupons').update(updates).eq('id', activeCoupon.id);

            if (error) throw error;

            onCouponClaimed(activeCoupon);
        } catch (e) {
            console.error(e);
            toast.error("Failed to claim. Please try again or ensure you are logged in.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <AnimatePresence mode="sync">
                {/* Selection Phase - Hide if revealed OR if we loaded a pending coupon immediately */}
                {!revealed && !activeCoupon && (
                    <motion.div
                        className="w-full max-w-4xl p-4 md:p-6 text-center max-h-[95vh] flex flex-col items-center relative"
                        exit={{ opacity: 0 }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2 bg-gray-800/50 rounded-full hover:bg-gray-700 text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        <h2 className="text-2xl md:text-5xl font-bold text-white mb-2 shrink-0">
                            Unlock a Discount! 🎟️
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Pick a card to reveal your mystery coupon. <br />
                            <span className="text-emerald-400 font-mono text-sm">
                                {coupons.filter(c => !c.claimed).length} coupons remaining
                            </span>
                        </p>

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
                                            opacity: coupon.claimed ? 0.5 : 1, // Dim claimed
                                            filter: coupon.claimed ? 'grayscale(100%)' : 'none',
                                            transition: { delay: index * 0.05, duration: 0.5 }
                                        }}
                                        whileHover={!coupon.claimed ? {
                                            scale: 1.05,
                                            y: -5,
                                            boxShadow: "0px 0px 20px rgba(16, 185, 129, 0.4)" // Emerald glow
                                        } : {}}
                                        onClick={() => handleCardClick(coupon)}
                                        className={`relative w-full aspect-[2/3] md:w-56 md:h-80 transition-all duration-300 ${(selectedCardId && selectedCardId !== coupon.id) || (coupon.claimed && !selectedCardId)
                                                ? 'cursor-default' // Claimed or other selected
                                                : 'cursor-pointer'
                                            } ${selectedCardId && selectedCardId !== coupon.id ? 'opacity-0 scale-0 pointer-events-none' : ''
                                            }`}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Back of Card (Question Mark) - Initial View */}
                                        <div
                                            className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-800 to-gray-950 rounded-xl md:rounded-2xl border border-gray-700 shadow-2xl flex items-center justify-center overflow-hidden"
                                            style={{ backfaceVisibility: 'hidden' }}
                                        >
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                                            <div className={`text-3xl md:text-6xl ${coupon.claimed ? 'text-gray-600' : 'text-emerald-500 animate-pulse'}`}>
                                                {coupon.claimed ? '🔒' : '?'}
                                            </div>
                                            {coupon.claimed && (
                                                <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                    Claimed
                                                </div>
                                            )}
                                        </div>

                                        {/* Front of Card (Revealed during flip) */}
                                        <div
                                            className="absolute inset-0 w-full h-full bg-gray-900 rounded-xl md:rounded-2xl border-2 border-emerald-500 flex flex-col items-center justify-center p-2"
                                            style={{ transform: "rotateY(180deg)", backfaceVisibility: 'hidden' }}
                                        >
                                            <div className="text-xs text-emerald-400 uppercase tracking-widest mb-1">You Won</div>
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

                        className="fixed z-50 bg-gray-900 text-white p-6 md:p-8 rounded-3xl border border-gray-700 shadow-2xl max-w-sm w-[90%] md:w-[360px] text-center relative overflow-hidden flex flex-col items-center"
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
