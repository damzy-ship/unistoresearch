import { Icon } from '@iconify/react';
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
                            <Icon icon="mdi:close-circle" className="w-4 h-4" />
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
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 border ${selectedHostel === 'all'
                        ? 'bg-orange-500/90 border-orange-400 text-white shadow-lg shadow-orange-500/20 backdrop-blur-sm'
                        : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/10'
                        }`}
                >
                    All Hostels
                </button>
                {hostels.map((hostel) => (
                    <button
                        key={hostel.id}
                        onClick={() => onSelectHostel(hostel.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 border ${selectedHostel === hostel.id
                            ? 'bg-orange-500/90 border-orange-400 text-white shadow-lg shadow-orange-500/20 backdrop-blur-sm'
                            : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/10'
                            }`}
                    >
                        {hostel.name}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => onSelectCategory('all')}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 border ${selectedCategory === 'all'
                        ? 'bg-orange-500/90 border-orange-400 text-white shadow-lg shadow-orange-500/20 backdrop-blur-sm'
                        : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/10'
                        }`}
                >
                    All
                </button>
                {showMyProducts && (
                    <button
                        onClick={onToggleMyProducts}
                        className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 border ${myProductsActive
                            ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 backdrop-blur-md'
                            : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/10'
                            }`}
                    >
                        My Products
                    </button>
                )}
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => onSelectCategory(category)}
                        className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 border ${selectedCategory === category
                            ? 'bg-orange-500/90 border-orange-400 text-white shadow-lg shadow-orange-500/20 backdrop-blur-sm'
                            : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/10'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
    );
}
