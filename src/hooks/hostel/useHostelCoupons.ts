import { useState, useEffect } from 'react';
import { supabase, Coupon, UniqueVisitor } from '../../lib/supabase';
import { toast } from 'sonner';

/**
 * Hook to manage coupon fetching, active state, and expiry timer.
 */
export function useHostelCoupons(
    currentVisitor: UniqueVisitor | null,
    userIsAuthenticated: boolean,
    selectedSchoolId: string | null,
    loadingFeed: boolean
) {
    const [couponModalOpen, setCouponModalOpen] = useState(false);
    const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    /**
     * Fetches active coupon based on user ID or localStorage.
     */
    useEffect(() => {
        const fetchActiveCoupon = async () => {
            const localCouponId = localStorage.getItem('hostel_coupon_id');
            let couponToSet: Coupon | null = null;



            // 1. Check DB for auth user
            if (currentVisitor?.id) {
                const { data } = await supabase
                    .from('coupons')
                    .select('*')
                    .eq('claimed_by', currentVisitor.id)
                    .order('claimed_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    const oneHour = 60 * 60 * 1000;
                    if (Date.now() - new Date(data.claimed_at).getTime() < oneHour) {
                        couponToSet = data as Coupon;
                    }
                }
            }

            // 2. If nothing found yet, check localStorage
            if (!couponToSet && localCouponId) {
                // Determine if we should attempt a transfer (Auth user + local ID)
                if (currentVisitor?.id) {
                    // Try to claim/transfer ownership directly. 
                    // This handles RLS cases where we can't "see" the guest coupon but can "claim" it if we have the ID.
                    const { data: transferredCoupon, error: transferError } = await supabase
                        .from('coupons')
                        .update({ claimed_by: currentVisitor.id })
                        .eq('id', localCouponId)
                        .select()
                        .maybeSingle();

                    if (transferredCoupon) {
                        const claimedAt = new Date(transferredCoupon.claimed_at).getTime();
                        const oneHour = 60 * 60 * 1000;
                        if (Date.now() - claimedAt < oneHour) {
                            couponToSet = transferredCoupon as Coupon;
                            toast.success('Coupon linked to your account!');
                        } else {
                            localStorage.removeItem('hostel_coupon_id'); // Truly expired
                        }
                    } else {
                        // Transfer returned nothing. It might be invalid, or we don't have permission, or it doesn't exist.
                        // Fallback: Try to just READ it (maybe it's already ours or public?)
                        const { data } = await supabase
                            .from('coupons')
                            .select('*')
                            .eq('id', localCouponId)
                            .maybeSingle();

                        if (data) {
                            const claimedAt = new Date(data.claimed_at).getTime();
                            const oneHour = 60 * 60 * 1000;
                            if (Date.now() - claimedAt < oneHour) {
                                couponToSet = data as Coupon;
                            } else {
                                localStorage.removeItem('hostel_coupon_id');
                            }
                        } else {
                            // Only remove if we are sure we couldn't find it. 
                            // Note: If RLS hides it, data is null. We might lose it. 
                            // But usually blind update handles the transfer case.
                            // If blind update failed AND read failed, it's likely gone.
                            localStorage.removeItem('hostel_coupon_id');
                        }
                    }
                } else {
                    // Unauthenticated: Just read
                    const { data } = await supabase
                        .from('coupons')
                        .select('*')
                        .eq('id', localCouponId)
                        .maybeSingle();

                    if (data) {
                        const claimedAt = new Date(data.claimed_at).getTime();
                        const oneHour = 60 * 60 * 1000;
                        if (Date.now() - claimedAt < oneHour) {
                            couponToSet = data as Coupon;
                        } else {
                            localStorage.removeItem('hostel_coupon_id');
                        }
                    } else {
                        localStorage.removeItem('hostel_coupon_id');
                    }
                }
            }

            // Set final state
            setActiveCoupon(couponToSet);

            // Pop modal if no active coupon found
            if (!couponToSet && !loadingFeed && selectedSchoolId) {
                // Check if user played today
                const lastPlayed = localStorage.getItem('hostel_coupon_last_played');
                const today = new Date().toDateString();

                if (lastPlayed !== today) {
                    setCouponModalOpen(true);
                }
            }
        };

        fetchActiveCoupon();

    }, [currentVisitor?.id, userIsAuthenticated, loadingFeed, selectedSchoolId]);

    /**
     * Manages the countdown timer for the active coupon.
     */
    useEffect(() => {
        if (!activeCoupon?.claimed_at) {
            setTimeRemaining(null);
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            const claimedAt = new Date(activeCoupon.claimed_at!).getTime();
            const expiryTime = claimedAt + oneHour;
            const diff = expiryTime - now;

            if (diff <= 0) {
                // Expire
                setActiveCoupon(null);
                localStorage.removeItem('hostel_coupon_id');
                toast.info('Coupon expired');
                clearInterval(interval);
                setTimeRemaining(null);
            } else {
                setTimeRemaining(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeCoupon]);

    const handleGameCouponClaimed = (coupon: Coupon) => {
        const couponWithLimit: Coupon = { ...coupon, claimed_at: Date.now() }; // Store as timestamp
        setActiveCoupon(couponWithLimit);
        localStorage.setItem('hostel_coupon_last_played', new Date().toDateString());
        localStorage.setItem('hostel_coupon_id', coupon.id); // Valid for guest persistence if needed
        setCouponModalOpen(false);
        const msg = coupon.type === 'product' ? 'Gift Unlocked! 🎁' : 'Gift claimed! Prices slashed! 📉';
        toast.success(msg);
    };

    return {
        couponModalOpen,
        setCouponModalOpen,
        activeCoupon,
        setActiveCoupon,
        timeRemaining,
        handleGameCouponClaimed
    };
}
