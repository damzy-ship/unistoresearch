import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import BuyNowButton from '../components/Payment/BuyNowButton';

interface Merchant {
    id?: number;
    auth_user_id?: string;
    full_name?: string;
    phone_number?: string;
    user_type?: string;
    [key: string]: any;
}

export default function PayMerchantPage() {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
    const [search, setSearch] = useState('');
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [sessionUser, setSessionUser] = useState<any>(null);
    const [currentUserData, setCurrentUserData] = useState<any>(null);

    const [formData, setFormData] = useState({
        phoneNumber: '',
        amount: ''
    });

    const [errors, setErrors] = useState({
        phoneNumber: '',
        amount: ''
    });

    useEffect(() => {
        fetchMerchants();
        checkSession();
    }, []);

    useEffect(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            setFilteredMerchants(merchants);
        } else {
            setFilteredMerchants(
                merchants.filter(m =>
                    (m.full_name || '').toLowerCase().includes(q) ||
                    (m.phone_number || '').toLowerCase().includes(q) ||
                    (m.auth_user_id || '').toLowerCase().includes(q)
                )
            );
        }
    }, [search, merchants]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.user);
        setSessionUser(session?.user || null);

        if (session?.user) {
            const { data: userData } = await supabase
                .from('unique_visitors')
                .select('*')
                .eq('auth_user_id', session.user.id)
                .single();

            if (userData) setCurrentUserData(userData);
        }
    };

    const fetchMerchants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('unique_visitors')
                .select('*')
                .eq('user_type', 'merchant')
                .order('full_name', { ascending: true });

            if (error) {
                console.error('Error fetching merchants:', error);
                setMerchants([]);
                setFilteredMerchants([]);
            } else {
                setMerchants(data || []);
                setFilteredMerchants(data || []);
            }
        } catch (err) {
            console.error('Fetch merchants error:', err);
            setMerchants([]);
            setFilteredMerchants([]);
        } finally {
            setLoading(false);
        }
    };

    const validatePhoneNumber = (phone: string) => {
        const phoneRegex = /^(?:\+?234|0)[789][01]\d{8}$/;
        return phoneRegex.test(phone);
    };

    const validateAmount = (amount: string) => {
        const numAmount = Number(amount);
        return !isNaN(numAmount) && numAmount >= 100;
    };

    return (
        <div className="min-h-screen py-12 px-4 transition-colors duration-300" style={{ backgroundColor: currentTheme.background }}>
            <div className="max-w-md mx-auto">
                <div className="flex flex-col items-center justify-center mb-8">
                    <h1 className="text-5xl md:text-6xl text-center font-bold mb-2">
                        <span style={{ color: currentTheme.primary }}>uni</span>
                        <span style={{ color: currentTheme.secondary }}>store.</span>
                    </h1>
                    <h3 className="text-lg font-bold mb-6" style={{ color: currentTheme.text }}>
                        Pay a merchant
                    </h3>
                </div>

                <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: currentTheme.surface }}>
                    <div className="space-y-4">
                        {/* The new custom dropdown component, inspired by the select tag */}
                        <div className="relative" ref={dropdownRef}>
                            <label htmlFor="merchant_id" className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                                Select Merchant
                            </label>
                            <button
                                type="button"
                                id="merchant_id"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full px-4 py-2 border rounded-lg shadow-sm text-left flex justify-between items-center transition-colors duration-200
                  ${isDropdownOpen ? 'ring-2 ring-orange-500 border-orange-500' : ''}`}
                                style={{
                                    backgroundColor: currentTheme.background,
                                    borderColor: currentTheme.primary + '20',
                                    color: currentTheme.text,
                                }}
                            >
                                {selectedMerchant ? (
                                    <span className="font-medium">{selectedMerchant.full_name}</span>
                                ) : (
                                    <span style={{ color: currentTheme.textSecondary }}>Search or select a merchant...</span>
                                )}
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div
                                    className="absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-44 overflow-auto"
                                    style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.primary + '20' }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Search merchants..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full px-4 py-2 border-b"
                                        style={{
                                            backgroundColor: currentTheme.surface,
                                            borderColor: currentTheme.primary + '20',
                                            color: currentTheme.text
                                        }}
                                        key="search-input"
                                        autoFocus
                                    />
                                    {loading ? (
                                        <div className="p-4 text-center" style={{ color: currentTheme.textSecondary }}>
                                            Loading merchants...
                                        </div>
                                    ) : filteredMerchants.length === 0 ? (
                                        <div className="p-4 text-center" style={{ color: currentTheme.textSecondary }}>
                                            No merchants found
                                        </div>
                                    ) : (
                                        filteredMerchants.map(m => (
                                            <button
                                                key={m.auth_user_id || m.id}
                                                onClick={() => {
                                                    setSelectedMerchant(m);
                                                    setSearch('');
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-gray-200 focus:bg-gray-200 transition-colors`}
                                                style={{
                                                    color: currentTheme.text,
                                                    borderBottom: `1px solid ${currentTheme.primary + '10'}`
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium" style={{ color: currentTheme.text }}>{m.full_name}</div>
                                                        <div className="text-xs" style={{ color: currentTheme.textSecondary }}>{m.phone_number || 'No phone'}</div>
                                                    </div>
                                                    <div className="text-xs" style={{ color: currentTheme.textSecondary }}>{m.auth_user_id?.slice?.(0, 6) || ''}</div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">

                            {!isAuthenticated && (
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData(prev => ({ ...prev, phoneNumber: value }));
                                            if (!validatePhoneNumber(value) && value !== '') {
                                                setErrors(prev => ({ ...prev, phoneNumber: 'Please enter a valid Nigerian phone number' }));
                                            } else { 
                                                setErrors(prev => ({ ...prev, phoneNumber: '' }));
                                            }
                                        }}
                                        className={`w-full px-4 py-2 border rounded-lg ${errors.phoneNumber ? 'border-red-500' : ''}`}
                                        style={{
                                            backgroundColor: currentTheme.background,
                                            borderColor: currentTheme.primary + '20',
                                            color: currentTheme.text
                                        }}
                                        required
                                    />
                                    {errors.phoneNumber && <div className="text-xs text-red-500 mt-1">{errors.phoneNumber}</div>}
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                                    Amount To Pay
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg text-center font-bold"
                                    style={{
                                        backgroundColor: currentTheme.background,
                                        borderColor: currentTheme.primary + '20',
                                        color: currentTheme.text
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                {selectedMerchant && validateAmount(formData.amount) && (isAuthenticated || validatePhoneNumber(formData.phoneNumber)) ? (
                                    <BuyNowButton
                                        merchant_name={selectedMerchant.full_name || ''}
                                        merchant_number={selectedMerchant.phone_number || ''}
                                        merchant_id={selectedMerchant.auth_user_id || ''}
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
                                            : !selectedMerchant
                                                ? 'Select a merchant'
                                                : 'Please enter a valid phone number'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}