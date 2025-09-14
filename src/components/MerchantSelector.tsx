import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Store } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface Merchant {
    id?: number;
    auth_user_id?: string;
    full_name?: string;
    phone_number?: string;
    user_type?: string;
    [key: string]: any;
}

interface MerchantSelectorProps {
    merchants: Merchant[];
    loading: boolean;
    selectedMerchant: Merchant | null;
    onMerchantChange: (merchant: Merchant | null) => void;
}

export default function MerchantSelector({
    merchants,
    loading,
    selectedMerchant,
    onMerchantChange,
}: MerchantSelectorProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { currentTheme } = useTheme();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredMerchants = merchants.filter(merchant =>
        merchant.full_name.toLowerCase().includes(search.toLowerCase()) ||
        merchant.auth_user_id.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectMerchant = (merchant: Merchant) => {
        onMerchantChange(merchant);
        setIsDropdownOpen(false);
        setSearch('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <label htmlFor="merchant_id" className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>
                Select Merchant
            </label>
            <button
                type="button"
                id="merchant_id"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                    isDropdownOpen ? `border-orange-500 ring-4 ring-orange-100` : `border-gray-200 hover:border-gray-300`
                }`}
                style={{
                    backgroundColor: currentTheme.background,
                }}
            >
                <div className="flex items-center gap-2" style={{ color: currentTheme.text }}>
                    <Store className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">
                        {loading ? 'Loading...' : selectedMerchant ? selectedMerchant.full_name : 'Select Merchant'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
                <div
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-lg border z-10 max-h-80 overflow-hidden"
                    style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.primary + '20' }}
                >
                    {/* Search */}
                    <div className="p-3 border-b" style={{ borderColor: currentTheme.primary + '10' }}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: currentTheme.textSecondary }} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search merchants..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                style={{
                                    backgroundColor: currentTheme.background,
                                    borderColor: currentTheme.primary + '20',
                                    color: currentTheme.text
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Merchants List */}
                    <div className="max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center" style={{ color: currentTheme.textSecondary }}>
                                Loading merchants...
                            </div>
                        ) : filteredMerchants.length === 0 ? (
                            <div className="px-4 py-6 text-center" style={{ color: currentTheme.textSecondary }}>
                                <Store className="w-8 h-8 mx-auto mb-2" style={{ color: currentTheme.textSecondary + '40' }} />
                                <p className="text-sm">No merchants found</p>
                            </div>
                        ) : (
                            filteredMerchants.map(m => (
                                <button
                                    key={m.auth_user_id}
                                    type="button"
                                    onClick={() => handleSelectMerchant(m)}
                                    className={`w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 ${
                                        selectedMerchant?.auth_user_id === m.auth_user_id ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50'
                                    }`}
                                    style={{
                                        color: currentTheme.text,
                                        borderBottomColor: currentTheme.primary + '10'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium" style={{ color: selectedMerchant?.auth_user_id === m.auth_user_id ? 'inherit' : currentTheme.text }}>{m.full_name}</div>
                                            <div className="text-xs" style={{ color: selectedMerchant?.auth_user_id === m.auth_user_id ? 'inherit' : currentTheme.textSecondary }}>{m.phone_number || 'No phone'}</div>
                                        </div>
                                        <div className="text-xs" style={{ color: selectedMerchant?.auth_user_id === m.auth_user_id ? 'inherit' : currentTheme.textSecondary }}>{m.auth_user_id.slice(0, 6)}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop for closing dropdown on outside click */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}
        </div>
    );
}