import React, { useState, useEffect } from 'react';
import { isAuthenticated } from '../../hooks/useTracking';
import AuthModal from '../AuthModal';
import { RealTimeProduct } from '../../lib/realTimeService';
import { UserProfile } from '../ProfileModal';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

// Define the shape of the product data using a TypeScript interface

interface InvoiceDataProps {
    product_id: string;
    merchant_id: string;
    customer_id: string | null;
    payment_reference: string;
}

// Define the props for the BuyNowButton component.
interface BuyNowButtonProps {
    productData: RealTimeProduct;
    userData: UserProfile | null;
}

// The reusable BuyNowButton component
const BuyNowButton: React.FC<BuyNowButtonProps> = ({ productData, userData }) => {
    // State for controlling the modal's visibility.
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    // State for the user's email input.';
    const [email, setEmail] = useState<string>('');
    // State to track if the Paystack script is loaded.
    const [isPaystackLoaded, setIsPaystackLoaded] = useState<boolean>(false);
    // State for messages to the user.
    const [message, setMessage] = useState<string>('');

    const [showAuthModal, setShowAuthModal] = useState(false);

    const { currentTheme } = useTheme();

    // Use useEffect to dynamically load the Paystack inline script.
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = () => {
            setIsPaystackLoaded(true);
        };
        script.onerror = () => {
            console.error('Failed to load Paystack script.');
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);


    const handleAuthSuccess = () => {
        setIsModalOpen(true);
    };

    const handleAuthClose = () => {
        setShowAuthModal(false);
    };


    const isAuthenticatedBeforeTriggerModal = async () => {
        const userAuthenticated = await isAuthenticated();
        if (!userAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        setIsModalOpen(true);
    };

    // Function to handle the payment process after the user enters their email.
    const handlePayment = async () => {


        // Basic email validation.
        if (!email.trim() || !email.includes('@')) {
            setMessage('Please enter a valid email address.');
            return;
        }

        if (!isPaystackLoaded || !window.PaystackPop) {
            setMessage('Paystack script is not loaded yet. Please try again.');
            return;
        }


        // Initialize the Paystack payment handler.
        const handler = window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: email,
            name: userData?.full_name || 'Guest User',
            phone: userData?.phone_number || 'Not Provided',
            amount: productData.price * 100, // Paystack expects the amount in kobo (1 NGN = 100 kobo)
            currency: 'NGN',
            metadata: {
                custom_fields: [
                    {
                        display_name: 'Name',
                        variable_name: 'name',
                        value: userData?.full_name,
                    },
                    {
                        display_name: 'Phone',
                        variable_name: 'phone',
                        value: userData?.phone_number || 'Not Provided',
                    },
                    {
                        display_name: 'Description',
                        variable_name: 'description',
                        value: productData?.title,
                    },
                    {
                        display_name: 'Merchant',
                        variable_name: 'merchant',
                        value: productData?.merchant,
                    },
                ],
            },

            onClose: () => {
                setMessage("Payment modal closed. Please try again.");
            },
            callback: (response: any) => {
                const storeInvoiceData = async () => {

                    const invoiceData: InvoiceDataProps = {
                        product_id: productData?.id,
                        merchant_id: productData?.merchant_id,
                        customer_id: userData?.user_id || null,
                        payment_reference: response.reference,
                    };

                    const { data: newInvoice, error: insertError } = await supabase
                        .from('invoices')
                        .insert(invoiceData)
                        .select()
                        .single();

                    if (insertError) {
                        console.error('Error creating invoice record:', insertError);
                    } else if (newInvoice) {
                        console.log('Invoice record created:', newInvoice);
                    }

                    // Log the product data to the console only on a successful transaction.
                    console.log('Payment successful. Here is the product data:');
                    console.log(productData);
                    setMessage(`Payment successful! Reference: ${response.reference}`);
                    setIsModalOpen(false);
                }

                storeInvoiceData();
            },
        });

        // Open the Paystack payment modal.
        handler.openIframe();
    };

    return (
        // Main container for the button and modal.
        <div className="flex justify-center items-center">
            {/* The main Buy Now button with custom styling. */}
            <button
                onClick={isAuthenticatedBeforeTriggerModal}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg w-fit"
            >
                Buy Now
            </button>

            {/* The modal overlay and content. */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-8 shadow-2xl max-w-sm w-full relative">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Enter Your Email</h2>
                        <p className="text-sm text-gray-600 mb-6">A receipt will be sent to this email address.</p>

                        <input
                            type="email"
                            placeholder="e.g., jane.doe@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="focus:ring-2 focus:ring-${currentTheme.primaryTsFormat} focus:border-${currentTheme.primaryTsFormat} w-full mb-4 p-4 border-2 rounded-xl resize-none text-base transition-all duration-200 placeholder-gray-400"
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: currentTheme.primary,
                                color: currentTheme.text,

                                // focusBorderColor: currentTheme.primary,
                            }}
                        />

                        {message && (
                            <p className="text-red-500 text-sm mb-4">{message}</p>
                        )}

                        <button
                            onClick={handlePayment}
                            className="w-full bg-green-500 text-white p-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
                        >
                            Proceed to Payment
                        </button>

                        {/* Close button for the modal. */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                </div>

            )}
            <AuthModal
                isOpen={showAuthModal}
                onClose={handleAuthClose}
                onSuccess={handleAuthSuccess}
            />
        </div>
    );
};

export default BuyNowButton;