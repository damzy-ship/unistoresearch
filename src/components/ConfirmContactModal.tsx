import React from 'react';
import { Product } from '../lib/supabase';
import ContactSellerLink from './ContactSellerLink';
import { AppDrawer } from './ui/Drawer';
import { Button } from './ui/Button';

interface ConfirmContactModalProps {
    isOpen: boolean;
    product?: Partial<Product> | null;
    onClose: () => void;
    onConfirm: (p: Partial<Product>) => void;
    className?: string;
    hostelMode?: boolean;
}

const ConfirmContactModal: React.FC<ConfirmContactModalProps> = ({ isOpen, product, onClose, onConfirm, hostelMode }) => {
    if (!product) return null;

    return (
        <AppDrawer
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            title="Confirm contact"
            description="Review the item details before contacting the seller."
        >
            <div className="flex flex-col h-full">
                <div className="flex-1 py-4">
                    {!hostelMode && (
                        <div className="flex gap-4">
                            {product.image_urls && product.image_urls[0] && (
                                <img
                                    src={product.image_urls[0]}
                                    alt={product.product_description}
                                    className="w-28 h-28 object-cover rounded-xl border border-gray-100 dark:border-gray-800"
                                />
                            )}
                            <div className="flex-1 space-y-2">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2">{product.product_description}</h4>
                                {product.full_name && <p className="text-sm text-gray-500 dark:text-gray-400">by {product.full_name}</p>}
                                <div className="mt-1">
                                    {product.discount_price ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-400 line-through">₦{product.product_price}</span>
                                            <span className="text-xl text-orange-600 font-bold">₦{product.discount_price}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xl text-orange-600 font-bold">₦{product.product_price}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {hostelMode && (
                        <div className="py-2 flex flex-col justify-center items-center text-center">
                            <h4 className="font-medium text-gray-600 dark:text-gray-300">Would you still like to get? </h4>
                            <span className="font-bold text-xl text-orange-600 mt-2">[{product.product_description}]</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            localStorage.removeItem('pending_contact_product');
                            onClose();
                        }}
                        className="flex-1"
                    >
                        Cancel
                    </Button>

                    <ContactSellerLink
                        product={product}
                        className="flex-1"
                        onAfter={() => {
                            if (product) onConfirm(product);
                            localStorage.removeItem('pending_contact_product');
                            onClose();
                        }}
                    >
                        <Button className="w-full pointer-events-none">Get Now</Button>
                    </ContactSellerLink>
                </div>
            </div>
        </AppDrawer>
    );
};

export default ConfirmContactModal;

