import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../hooks/useTracking';

import { useTheme } from '../hooks/useTheme';
import { Loader } from 'lucide-react';
import AuthModal from './AuthModal';

// Define a type for your product data
interface Product {
    id: string;
    product_description: string;
    product_price: string;
    image_urls: string[];
    is_available: boolean;
    full_name: string;
    phone_number: string;
    school_id: string;
    school_name: string;
    school_short_name: string;
}

// Define the props interface
interface HorizontalProductListProps {
    categoryId?: string;
    schoolId: string;
    categoryName?: string;
    showFeatured?: boolean; // Optional prop to show featured products
}

const HorizontalProductList: React.FC<HorizontalProductListProps> = ({ categoryId, schoolId, categoryName, showFeatured }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingContactProduct, setPendingContactProduct] = useState<Product | null>(null);
    const { currentTheme } = useTheme();

    const handleContactSeller = async (product: Product) => {
        // Check if user is already authenticated
        const userAuthenticated = await isAuthenticated();
        if (!userAuthenticated) {
            setPendingContactProduct(product);
            setShowAuthModal(true);
            return;
        }

        // Proceed with contact
        contactSeller(product);
    };


    const contactSeller = async (product: Product) => {
        // Track the contact interaction for rating prompts
        // await trackContactInteraction(product.merchant_id, requestId);

        const message = `Hi! I'm looking for the following from ${product.school_short_name} University: ${product.product_description}`;
        const whatsappUrl = `https://wa.me/${product.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    };

    const handleAuthSuccess = () => {

        if (pendingContactProduct) {
            contactSeller(pendingContactProduct);
            setPendingContactProduct(null);
        }
    };

    const handleAuthClose = () => {
        setShowAuthModal(false);
        setPendingContactProduct(null);
    };


    useEffect(() => {
        const fetchProductsByCategory = async () => {
            if (!showFeatured && !categoryId || !schoolId) {
                setError('Missing category or school ID.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const { data, error: functionError } = await supabase.functions.invoke('smooth-service', {
                    body: {
                        category_id: categoryId,
                        school_id: schoolId,
                        show_featured: showFeatured || false,
                        match_count: showFeatured ? 10 : 20, // Fetch more if not featured
                    },
                });

                if (functionError) {
                    throw functionError;
                }

                const products = data?.results || [];
                setProducts(products);
            } catch (err: any) {
                console.error('Error during category search:', err);
                setError('An error occurred while fetching category results. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProductsByCategory();
    }, [categoryId, schoolId]);

    if (loading) {
        return (

            <div className="flex justify-center items-center h-44 bg-gray-50 w-full">
                <Loader />
                {/* <div className="text-xl font-semibold text-gray-700">Loading products...</div> */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-xl font-semibold text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="pb-6 sm:pb-8 font-sans bg-gray-50 max-w-full overflow-hidden">
            <div className="mx-auto">
                <div className={`px-4 flex gap-1 items-center justify-between mb-6 sm:mb-8 bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white py-1 shadow-md transition-all duration-200 font-medium w-full`}>

                    <p>
                        {categoryName?.toUpperCase()}
                    </p>

                    {products.length > 0 && (
                        !showFeatured && <button
                            onClick={() => { navigate(`/categories/${categoryId}/products?schoolId=${schoolId}&categoryName=${encodeURIComponent(categoryName)}`); window.scrollTo(0, 0); }}
                            className="text-base font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                        >
                            See more <span aria-hidden="true">&rarr;</span>
                        </button>
                    )}
                </div>

                {products.length === 0 ? (
                    <div className='w-screen flex justify-center items-center h-20 bg-gray-50'>

                        <p className="text-gray-500 text-xl">No products found for this category.</p>
                    </div>
                ) : (
                    <div className="flex overflow-x-auto gap-6 pb-2 scrollbar-hide px-4 sm:px-6 lg:px-8">
                        {products.map((product) => (
                            <div key={product.id} className="w-48 md:w-60 flex-shrink-0 bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100">
                                <Swiper
                                    modules={[Pagination, Navigation]}
                                    spaceBetween={10}
                                    slidesPerView={1}
                                    pagination={{ clickable: true }}
                                    navigation
                                    className="w-full h-32 md:h-32"

                                >
                                    {product.image_urls.map((url, imgIndex) => (
                                        <SwiperSlide key={imgIndex}>
                                            <img src={url} alt={product.product_description} className="w-full h-full object-cover" />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                                <div className="p-5 flex flex-col flex-grow">
                                    {/* <h3 className="text-xl font-bold mb-1 truncate text-gray-800">{product.product_description}</h3> */}
                                    <p className="text-xl text-indigo-600 font-extrabold mb-1 truncate">{product.product_price}</p>
                                    {product.full_name && (
                                        <p className="text-sm text-gray-500 mb-3">
                                            by <span className="font-medium text-gray-700">{product.full_name}</span>
                                        </p>
                                    )}
                                    {/* <p className={`text-sm font-semibold mb-4 ${product.is_available ? 'text-green-500' : 'text-red-500'}`}>
                                        {product.is_available ? 'In Stock' : 'Out of Stock'}
                                    </p> */}
                                    {product.phone_number && (
                                        <button
                                            onClick={() => handleContactSeller(product)}
                                            className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}
                                        >
                                            Get Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={handleAuthClose}
                onSuccess={handleAuthSuccess}
            />
        </div>
    );
};

export default HorizontalProductList;