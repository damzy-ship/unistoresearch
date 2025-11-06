import { X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface FilterBarProps {
    hostels: Array<{ id: string; name: string }>;
    selectedHostel: string;
    onSelectHostel: (hostelId: string) => void;
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    showMyProducts: boolean;
    myProductsActive: boolean;
    onToggleMyProducts: () => void;
    selectedPostType: string;
    onSelectPostType: (postType: string) => void;
    searchTerm: string | null;
    onClearSearch: () => void;
}

export default function FilterBar({
    hostels,
    selectedHostel,
    onSelectHostel,
    categories,
    selectedCategory,
    onSelectCategory,
    showMyProducts,
    myProductsActive,
    onToggleMyProducts,
    selectedPostType,
    onSelectPostType,
    searchTerm,
    onClearSearch,
}: FilterBarProps) {
    const { currentTheme } = useTheme();

    if (searchTerm) {
        return (
            <div className="px-4 pt-3 pb-3">
                <div className="flex gap-2 items-center">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${currentTheme.buttonGradient} text-white`}>
                        <span className="text-sm font-medium">Search: {searchTerm}</span>
                        <button
                            onClick={onClearSearch}
                            className="hover:bg-white/20 rounded-full p-1 transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 pt-3">
            <div className="flex gap-2 sm:gap-3 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => onSelectHostel('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedHostel === 'all'
                            ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    All Hostels
                </button>
                {hostels.map((hostel) => (
                    <button
                        key={hostel.id}
                        onClick={() => onSelectHostel(hostel.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedHostel === hostel.id
                                ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {hostel.name}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => onSelectCategory('all')}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === 'all'
                            ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => onSelectPostType('request')}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedPostType === 'request'
                            ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Requests
                </button>
                {showMyProducts && (
                    <button
                        onClick={onToggleMyProducts}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                            myProductsActive
                                ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        My Products
                    </button>
                )}
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => onSelectCategory(category)}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedCategory === category
                                ? `bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white rounded-full shadow-md transition-all duration-200`
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
    );
}
