import React, { useState, useEffect } from 'react';
// import { isAuthenticated } from '../../hooks/useTracking';
// import AuthModal from '../AuthModal';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

// Define the shape of the product data using a TypeScript interface



export interface InvoiceDataProps {
    merchant_name: string;
    merchant_number: string;
    merchant_id: string;
    customer_email?: string;
    customer_name: string;
    customer_number: string;
    customer_id: string;
    invoice_amount: number;
    invoice_status?: string;
    payment_reference?: string;
}

// The reusable BuyNowButton component
const BuyNowButton: React.FC<InvoiceDataProps> = (InvoiceData) => {
    // State for controlling the modal's visibility.
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    // State for the user's email input.';
    const [email, setEmail] = useState<string>('');
    // State to track if the Paystack script is loaded.
    const [isPaystackLoaded, setIsPaystackLoaded] = useState<boolean>(false);
    // State for messages to the user.
    const [message, setMessage] = useState<string>('');

    // const [showAuthModal, setShowAuthModal] = useState(false);

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


    // const handleAuthSuccess = () => {
    //     setIsModalOpen(true);
    // };

    // const handleAuthClose = () => {
    //     setShowAuthModal(false);
    // };


    // const isAuthenticatedBeforeTriggerModal = async () => {
    //     const userAuthenticated = await isAuthenticated();
    //     if (!userAuthenticated) {
    //         setShowAuthModal(true);
    //         return;
    //     }
    //     setIsModalOpen(true);
    // };

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
            name: InvoiceData?.customer_name || 'Guest User',
            phone: InvoiceData?.customer_number || 'Not Provided',
            amount: InvoiceData?.invoice_amount * 100, // Paystack expects the amount in kobo (1 NGN = 100 kobo)
            currency: 'NGN',
            metadata: {
                custom_fields: [
                    {
                        display_name: 'Name',
                        variable_name: 'name',
                        value: InvoiceData?.customer_name,
                    },
                    {
                        display_name: 'Phone',
                        variable_name: 'phone',
                        value: InvoiceData?.customer_number || 'Not Provided',
                    },
                    {
                        display_name: 'Merchant',
                        variable_name: 'merchant',
                        value: InvoiceData?.merchant_name,
                    },
                ],
            },

            onClose: () => {
                setMessage("Payment modal closed. Please try again.");
            },
            callback: (response: any) => {
                const storeInvoiceData = async () => {

                    const invoiceData: InvoiceDataProps = {
                        ...InvoiceData,
                        customer_email: email,
                        invoice_status: 'paid',
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

                    console.log('Payment successful. Here is the invoice data:');
                    console.log(newInvoice);
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
        <div className="w-full">
            {/* The main Buy Now button with improved responsive styling. */}
            <div className="w-full flex">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`w-full md:w-auto md:px-8 py-3 rounded-full text-sm md:text-base font-semibold bg-gradient-to-r ${currentTheme.buttonGradient} text-white shadow-md hover:shadow-xl transition transform active:scale-95`}
                    style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}
                >
                    Continue to Pay
                </button>
            </div>

            {/* The modal overlay and content. */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <div className="w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: currentTheme.surface }}>
                        <div className="px-6 py-5 border-b" style={{ borderColor: currentTheme.primary + '20' }}>
                            <h2 className="text-lg font-bold" style={{ color: currentTheme.text }}>Enter your email</h2>
                            <p className="text-xs mt-1" style={{ color: currentTheme.textSecondary }}>A receipt will be sent to this email address.</p>
                        </div>

                        <div className="p-6">
                            <input
                                type="email"
                                placeholder="e.g., jane.doe@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full mb-4 p-3 rounded-xl text-sm border"
                                style={{
                                    backgroundColor: currentTheme.background,
                                    borderColor: currentTheme.primary + '20',
                                    color: currentTheme.text
                                }}
                            />

                            {message && (
                                <p className="text-sm mb-4" style={{ color: '#E02424' }}>{message}</p>
                            )}

                            <button
                                onClick={handlePayment}
                                className={`w-full py-3 rounded-full text-sm font-semibold bg-gradient-to-r ${currentTheme.buttonGradient} text-white transition-all duration-200`}
                            >
                                Pay {InvoiceData?.invoice_amount ? `• ₦${InvoiceData.invoice_amount}` : ''}
                            </button>

                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="mt-3 w-full text-sm py-3 rounded-lg border"
                                style={{ color: currentTheme.text, borderColor: currentTheme.primary + '20', backgroundColor: currentTheme.background }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyNowButton;