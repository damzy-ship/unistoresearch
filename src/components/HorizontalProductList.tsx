import React, { useState, useEffect } from 'react';
import { Product, supabase } from '../lib/supabase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { Loader } from 'lucide-react';
import ContactSellerButton from './ContactSellerButton';
import ContactSellerLink from './ContactSellerLink';


// Define the props interface
interface HorizontalProductListProps {
    categoryId?: string;
    schoolId: string;
    categoryName?: string;
    showFeatured?: boolean; // Optional prop to show featured products
    userIsAuthenticated?: boolean;
}

const HorizontalProductList: React.FC<HorizontalProductListProps> = ({ categoryId, schoolId, categoryName, showFeatured, userIsAuthenticated }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { currentTheme } = useTheme();


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

                const { data, error: functionError } = await supabase.functions.invoke('product-category-fetch', {
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
                // console.log('Fetched products:', products);
                setProducts(products);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error('Error during category search:', err);
                setError('An error occurred while fetching category results. Please try again. ' + msg);
            } finally {
                setLoading(false);
            }
        };

        fetchProductsByCategory();
    }, [categoryId, schoolId, showFeatured]);

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
                        !showFeatured && categoryId && (
                            <button
                                onClick={() => { navigate(`/categories/${categoryId}/products?schoolId=${schoolId || ''}&categoryName=${encodeURIComponent(categoryName || '')}`); window.scrollTo(0, 0); }}
                                className="text-base font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                            >
                                See more <span aria-hidden="true">&rarr;</span>
                            </button>
                        )
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
                                            <div className="relative w-full h-full">
                                                <img src={url} alt={product.product_description} className="w-full h-full object-cover" />
                                                {product.school_short_name && (
                                                    <div className="absolute top-2 right-2 bg-white bg-opacity-80 text-xs font-semibold px-2 py-1 rounded-md shadow">
                                                        {product.school_short_name}
                                                    </div>
                                                )}
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                                <div className="p-5 flex flex-col flex-grow">
                                    {/* <h3 className="text-xl font-bold mb-1 truncate text-gray-800">{product.product_description}</h3> */}
                                    {product.discount_price ? (
                                        <div>
                                            <div className="text-sm text-gray-500 line-through truncate">₦{product.product_price}</div>
                                            <div className="text-xl text-indigo-600 font-extrabold mb-1">₦{product.discount_price}</div>
                                        </div>
                                    ) : (
                                        <p className="text-xl text-indigo-600 font-extrabold mb-1">₦{product.product_price}</p>
                                    )}
                                    {product.full_name && (
                                        <p className="text-sm text-gray-500 mb-3 flex-grow">
                                            by <span className="font-medium text-gray-700">{product.full_name}</span>
                                        </p>
                                    )}
                                    {/* <p className={`text-sm font-semibold mb-4 ${product.is_available ? 'text-green-500' : 'text-red-500'}`}>
                                        {product.is_available ? 'In Stock' : 'Out of Stock'}
                                    </p> */}
                                    {product.phone_number && (
                                        userIsAuthenticated ? (
                                            // Render as link for authenticated users
                                                <ContactSellerLink product={product} className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}>
                                                    Get Now
                                                </ContactSellerLink>
                                        ) : (
                                            <ContactSellerButton product={product} className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full`}>
                                                Get Now
                                            </ContactSellerButton>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Auth handled inside ContactSellerButton */}
        </div>
    );
};

export default HorizontalProductList;