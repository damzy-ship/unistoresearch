import React from 'react';
import { Product, supabase } from '../lib/supabase';

interface ContactSellerLinkProps {
  product: Partial<Product>;
  className?: string;
  children?: React.ReactNode;
  onAfter?: () => void; // called after scheduling analytics
}

const ContactSellerLink: React.FC<ContactSellerLinkProps> = ({ product, className, children, onAfter }) => {
  const phone = product.phone_number ? product.phone_number.replace(/[^0-9]/g, '') : '';
  const message = `Hi! I'm looking for the following from ${product.school_short_name || ''} University: ${product.product_description || ''}`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const handleClick = async () => {
    // Fire-and-forget analytics insert to match ContactSellerButton behavior
    try {
      const userId = localStorage.getItem('unistore_user_id') || null;
      const insertPayload = {
        merchant_id: product.merchant_id ?? null,
        product_id: product.id ?? null,
        event_type: 'profile_contacted',
        user_id: userId,
      };

      // Do not await - schedule the insert and continue so navigation is not blocked
      supabase.from('merchant_analytics').insert([insertPayload]).then(({ error }) => {
        if (error) console.warn('Failed to insert merchant_analytics (link):', error);
      }).catch((err) => console.warn('Failed to insert merchant_analytics (link):', err));
    } catch (err) {
      console.warn('Error recording contact analytics (link):', err);
    } finally {
      if (onAfter) onAfter();
    }
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children || 'Get Now'}
    </a>
  );
};

export default ContactSellerLink;
