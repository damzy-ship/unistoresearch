import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import BuyNowButton from '../components/Payment/BuyNowButton';


interface UserData {
    full_name: string;
    auth_user_id: string;
    phone_number: string;
    // Add other fields as needed
}

export interface InvoiceData {
    merchant_name: string;
    merchant_number: string;
    merchant_Id: string;
    customer_email: string;
    customer_name: string;
    customer_number: string;
    customer_Id: string;
    invoice_amount: string;
    invoice_status: string;
}

export default function PaymentPage() {
    const { merchantId } = useParams();
    const [merchantData, setMerchantData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
    const { currentTheme } = useTheme();

    const validatePhoneNumber = (phone: string) => {
        const phoneRegex = /^(?:\+?234|0)[789][01]\d{8}$/;
        return phoneRegex.test(phone);
    };

    const validateAmount = (amount: string) => {
        const numAmount = Number(amount);
        return !isNaN(numAmount) && numAmount >= 100;
    };
    const [formData, setFormData] = useState({
        email: '',
        receiptEmail: '',
        phoneNumber: '',
        amount: ''
    });
    const [errors, setErrors] = useState({
        phoneNumber: '',
        amount: ''
    });

    useEffect(() => {
        fetchMerchantData();
        checkAuthentication();
    }, [merchantId]);

    const checkAuthentication = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);

        if (session?.user) {
            const { data: userData } = await supabase
                .from('unique_visitors')
                .select('*')
                .eq('auth_user_id', session.user.id)
                .single();

            if (userData) {
                setCurrentUserData(userData);
            }
        }
    };

    const fetchMerchantData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('unique_visitors')
                .select('*')
                .eq('auth_user_id', merchantId)
                .single();

            if (error) {
                console.error('Error fetching merchant:', error);
            } else if (data) {
                setMerchantData(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, phoneNumber: value }));
        
        if (!validatePhoneNumber(value) && value !== '') {
            setErrors(prev => ({ 
                ...prev, 
                phoneNumber: 'Please enter a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)' 
            }));
        } else {
            setErrors(prev => ({ ...prev, phoneNumber: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate fields before submission
        if (!validateAmount(formData.amount)) {
            setErrors(prev => ({ ...prev, amount: 'Amount must be at least ₦100' }));
            return;
        }

        if (!isAuthenticated && !validatePhoneNumber(formData.phoneNumber)) {
            setErrors(prev => ({ 
                ...prev, 
                phoneNumber: 'Please enter a valid Nigerian phone number' 
            }));
            return;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: currentTheme.background }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
            </div>
        );
    }

    if (!merchantData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: currentTheme.background }}>
                <div className="text-center">
                    <h1 className="text-5xl md:text-6xl text-center font-bold mb-4">
                        <span style={{ color: currentTheme.primary }}>uni</span>
                        <span style={{ color: currentTheme.secondary }}>store.</span>
                    </h1>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: currentTheme.text }}>Merchant Not Found</h1>
                    <p style={{ color: currentTheme.textSecondary }}>The merchant you're trying to pay could not be found.</p>
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen py-12 px-4 transition-colors duration-300" style={{ backgroundColor: currentTheme.background }}>
            <div className="max-w-md mx-auto">
                <div className="flex flex-col items-center justify-center mb-8">
                    <h1 className="text-5xl md:text-6xl text-center font-bold mb-2">
                        <span style={{ color: currentTheme.primary }}>uni</span>
                        <span style={{ color: currentTheme.secondary }}>store.</span>
                    </h1>
                    <h3 className="text-lg font-bold mb-6 bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
                        Payment to {merchantData.full_name.toLocaleUpperCase()}
                        
                    </h3>
                </div>

                <div
                    className="rounded-xl shadow-lg p-8"
                    style={{ backgroundColor: currentTheme.surface }}
                >
                    

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isAuthenticated ? (
                            <>
                                <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                                        Amount To Pay
                                    </label>
                                    <input
                                        type="number"
                                        id="amount"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center font-bold"
                                        style={{
                                            backgroundColor: currentTheme.background,
                                            borderColor: currentTheme.primary + '20',
                                            color: currentTheme.text
                                        }}
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handlePhoneNumberChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                            errors.phoneNumber ? 'border-red-500' : ''
                                        }`}
                                        style={{
                                            backgroundColor: currentTheme.background,
                                            borderColor: currentTheme.primary + '20',
                                            color: currentTheme.text
                                        }}
                                        required
                                    />
                                </div>
                                 <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                                        Amount To Pay
                                    </label>
                                    <input
                                        type="number"
                                        id="amount"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center font-bold"
                                        style={{
                                            backgroundColor: currentTheme.background,
                                            borderColor: currentTheme.primary + '20',
                                            color: currentTheme.text
                                        }}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {Number(formData.amount) >= 100 && (isAuthenticated || validatePhoneNumber(formData.phoneNumber)) ? (
                            <BuyNowButton
                                merchant_name={merchantData?.full_name}
                                merchant_number={merchantData?.phone_number}
                                merchant_id={merchantData?.auth_user_id}
                                customer_name={currentUserData?.full_name || ''}
                                customer_number={isAuthenticated ? currentUserData?.phone_number || '' : formData.phoneNumber}
                                customer_id={currentUserData?.auth_user_id || ''}
                                invoice_amount={Number(formData.amount)}
                            />
                        ) : (
                            <button
                                type="button"
                                className={`w-full py-3 px-4 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed`}
                                disabled
                            >
                                {!validateAmount(formData.amount) 
                                    ? 'Amount must be at least ₦100'
                                    : 'Please enter a valid phone number'}
                            </button>
                        )}

                        {/* <button
                            type="submit"
                            className={`w-full py-3 px-4 rounded-lg font-medium bg-gradient-to-r ${currentTheme.buttonGradient} text-white transition-all duration-200 hover:shadow-lg`}
                        >
                            Continue to Payment
                        </button> */}
                    </form>
                </div>
            </div>
        </div>
    );

}
