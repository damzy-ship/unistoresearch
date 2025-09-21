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

const ContactSellerButton: React.FC<ContactSellerButtonProps> = ({ product, children }) => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingProduct, setPendingProduct] = useState<Partial<Product> | null>(null);
    const { currentTheme } = useTheme();


    const message = `Hi! I'm looking for the following from ${product.school_short_name || ''} University: ${product.product_description || ''}`;
    const contactSeller = async (p: Partial<Product>) => {
        if (!p.phone_number) return;
        const whatsappUrl = `https://wa.me/${p.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        // open in new tab
        window.open(whatsappUrl, '_blank');

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
            // store pending product in localStorage so other components can access it
            try {
                localStorage.setItem('pending_contact_product', JSON.stringify(product || {}));
            } catch (e) {
                console.warn('Failed to store pending product', e);
            }
            setPendingProduct(product);
            setShowAuthModal(true);
            return;
        }
        contactSeller(product);
    };

    const handleAuthSuccess = () => {
        // After successful auth, parent components will pick up pending product from localStorage
        if (pendingProduct) {
            try {
                const ev = new CustomEvent('pending-contact-available', { detail: pendingProduct });
                window.dispatchEvent(ev);
            } catch (e) {
                console.warn('Failed to dispatch pending-contact event', e);
            }
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
            <button onClick={handleClick} className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}>
                {children || 'Get Now'}
            </button>

            <AuthModal isOpen={showAuthModal} onClose={handleAuthClose} onSuccess={handleAuthSuccess} />
        </>
    );
};

export default ContactSellerButton;
