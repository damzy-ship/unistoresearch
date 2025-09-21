import React from 'react';
import { Product } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import ContactSellerLink from './ContactSellerLink';

interface ConfirmContactModalProps {
    isOpen: boolean;
    product?: Partial<Product> | null;
    onClose: () => void;
    onConfirm: (p: Partial<Product>) => void;
    className?: string;
}

const ConfirmContactModal: React.FC<ConfirmContactModalProps> = ({ isOpen, product, onClose, onConfirm }) => {
    const { currentTheme } = useTheme();
    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-11/12 max-w-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Confirm contact</h3>

                <div className="flex gap-4">
                    {product.image_urls && product.image_urls[0] && (
                        <img src={product.image_urls[0]} alt={product.product_description} className="w-28 h-28 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                        <h4 className="font-bold">{product.product_description}</h4>
                        {product.full_name && <p className="text-sm text-gray-600">by {product.full_name}</p>}
                        <div className="mt-2">
                            {product.discount_price ? (
                                <div>
                                    <div className="text-sm text-gray-500 line-through">₦{product.product_price}</div>
                                    <div className="text-xl text-indigo-600 font-extrabold">₦{product.discount_price}</div>
                                </div>
                            ) : (
                                <div className="text-xl text-indigo-600 font-extrabold">₦{product.product_price}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                    <button onClick={() => { localStorage.removeItem('pending_contact_product'); onClose(); }} className="px-4 py-2 rounded-lg border w-full">Cancel</button>

                    <ContactSellerLink
                        product={product}
                        className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-lg shadow-md transition-all duration-200 font-medium w-full`}
                        onAfter={() => {
                            if (product) onConfirm(product);
                            localStorage.removeItem('pending_contact_product');
                        }}
                    >
                        Contact Seller
                    </ContactSellerLink>
                </div>
            </div>
        </div>
    );
};

export default ConfirmContactModal;
