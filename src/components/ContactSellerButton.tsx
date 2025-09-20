import React, { useState } from 'react';
import { isAuthenticated } from '../hooks/useTracking';
import AuthModal from './AuthModal';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/supabase';



interface ContactSellerButtonProps {
    product: Partial<Product>;
    className?: string;
    children?: React.ReactNode;
}

const ContactSellerButton: React.FC<ContactSellerButtonProps> = ({ product, className, children }) => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingProduct, setPendingProduct] = useState<Partial<Product> | null>(null);
    const { currentTheme } = useTheme();

    const contactSeller = async (p: Partial<Product>) => {
        if (!p.phone_number) return;
        const message = `Hi! I'm looking for the following from ${p.school_short_name || ''} University: ${p.product_description || ''}`;
        const whatsappUrl = `https://wa.me/${p.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        // Open WhatsApp link
        window.open(whatsappUrl, '_blank');

        // Record analytics (best-effort)
        try {
            // Try to get the authenticated user id if available
            // const { data: userData } = await supabase.auth.getUser();
            const userId = localStorage.getItem('unistore_user_id') || null;

            type AnalyticsRow = {
                merchant_id: string | null;
                product_id: string | null;
                event_type: 'profile_contacted';
                user_id: string | null;
                created_at?: string;
            };

            const insertPayload: AnalyticsRow = {
                merchant_id: p.merchant_id ?? null,
                product_id: p.id ?? null,
                event_type: 'profile_contacted',
                user_id: userId,
            };

            const { error: insertError } = await supabase
                .from('merchant_analytics')
                .insert([insertPayload]);

            if (insertError) {
                console.warn('Failed to insert merchant_analytics:', insertError);
            }
        } catch (err) {
            console.warn('Error recording contact analytics:', err);
        }
    };

    const handleClick = async () => {
        const userAuthenticated = await isAuthenticated();
        if (!userAuthenticated) {
            setPendingProduct(product);
            setShowAuthModal(true);
            return;
        }
        contactSeller(product);
    };

    const handleAuthSuccess = () => {
        if (pendingProduct) {
            contactSeller(pendingProduct);
            setPendingProduct(null);
        }
        setShowAuthModal(false);
    };

    const handleAuthClose = () => {
        setShowAuthModal(false);
        setPendingProduct(null);
    };

    return (
        <>
            <button onClick={handleClick} className={className || `flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}>
                {children || 'Get Now'}
            </button>

            <AuthModal isOpen={showAuthModal} onClose={handleAuthClose} onSuccess={handleAuthSuccess} />
        </>
    );
};

export default ContactSellerButton;
