import { X, Grid, Utensils, Shirt, Footprints, HardHat, Laptop, Smartphone, Diamond, ShoppingBag, Sparkles, User } from 'lucide-react';
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

    // Map categories to Lucide icons
    const getCategoryIcon = (category: string) => {
        const normalized = category.toLowerCase();
        if (normalized.includes('food')) return <Utensils className="w-5 h-5" />;
        if (normalized.includes('clothing')) return <Shirt className="w-5 h-5" />;
        if (normalized.includes('shoes')) return <Footprints className="w-5 h-5" />;
        if (normalized.includes('caps')) return <HardHat className="w-5 h-5" />; // or maybe a hat icon if available, using HardHat or similar as placeholder
        if (normalized.includes('gadgets')) return <Laptop className="w-5 h-5" />;
        if (normalized.includes('phones')) return <Smartphone className="w-5 h-5" />;
        if (normalized.includes('jewelries') || normalized.includes('jewelry')) return <Diamond className="w-5 h-5" />;
        if (normalized.includes('bags')) return <ShoppingBag className="w-5 h-5" />;
        if (normalized.includes('beauty')) return <Sparkles className="w-5 h-5" />;
        // Default
        return <ShoppingBag className="w-5 h-5" />;
    };

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
        <div className="pt-4 pb-2 space-y-4 md:hidden">
            {/* Hostels (Pill Filters) - Keep these as pills? Screenshot only shows categories. Assuming keep for now or hide? User didn't mention hostels. I'll keep them as pills above or remove if they declutter. I'll keep them for functionality but maybe style them simply. */}
            <div className="px-4 flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => onSelectHostel('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${selectedHostel === 'all'
                        ? `bg-gray-800 text-white border border-gray-700`
                        : 'bg-transparent text-gray-500 hover:text-gray-300 border border-transparent'
                        }`}
                >
                    All Hostels
                </button>
                {hostels.map((hostel) => (
                    <button
                        key={hostel.id}
                        onClick={() => onSelectHostel(hostel.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${selectedHostel === hostel.id
                            ? `bg-gray-800 text-white border border-gray-700`
                            : 'bg-transparent text-gray-500 hover:text-gray-300 border border-transparent'
                            }`}
                    >
                        {hostel.name}
                    </button>
                ))}
            </div>

            {/* Categories (Circular Icons) */}
            <div className="px-4 flex gap-4 overflow-x-auto pb-4 scrollbar-hide pr-6">
                {/* All Category */}
                <div className="flex flex-col items-center gap-2 min-w-[64px]">
                    <button
                        onClick={() => onSelectCategory('all')}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${selectedCategory === 'all'
                            ? `bg-orange-600 text-white shadow-lg shadow-orange-900/20 scale-110`
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <Grid className="w-6 h-6" />
                    </button>
                    <span className={`text-xs font-medium ${selectedCategory === 'all' ? 'text-orange-500' : 'text-gray-500'}`}>
                        All
                    </span>
                </div>

                {/* My Products (Merchant only) */}
                {showMyProducts && (
                    <div className="flex flex-col items-center gap-2 min-w-[64px]">
                        <button
                            onClick={onToggleMyProducts}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${myProductsActive
                                ? `bg-orange-600 text-white shadow-lg shadow-orange-900/20 scale-110`
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            <User className="w-6 h-6" />
                        </button>
                        <span className={`text-xs font-medium ${myProductsActive ? 'text-orange-500' : 'text-gray-500'}`}>
                            My Items
                        </span>
                    </div>
                )}

                {/* Categories Map */}
                {categories.map((category) => (
                    <div key={category} className="flex flex-col items-center gap-2 min-w-[64px]">
                        <button
                            onClick={() => onSelectCategory(category)}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${selectedCategory === category
                                ? `bg-orange-600 text-white shadow-lg shadow-orange-900/20 scale-110`
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {getCategoryIcon(category)}
                        </button>
                        <span className={`text-xs font-medium capitalize ${selectedCategory === category ? 'text-orange-500' : 'text-gray-500'}`}>
                            {category === 'beauty & skincare' ? 'Beauty' : category}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
