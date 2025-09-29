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
import ContactSellerLink from './ContactSellerLink'; // Assuming this is correct

// Define the props interface
interface VerticalProductListProps {
    categoryId?: string;
    schoolId: string;
    showFeatured?: boolean; // Optional prop to show featured products
    userIsAuthenticated?: boolean;
}

const VerticalProductList: React.FC<VerticalProductListProps> = ({ categoryId, schoolId, showFeatured, userIsAuthenticated }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchedCategoryName, setCategoryName] = useState<string | null>('');
    const navigate = useNavigate();
    const { currentTheme } = useTheme();

       useEffect(() => {
            const fetchCategoryName = async () => {
                if (!categoryId) return;
    
                try {
                    const { data, error } = await supabase
                        .from('merchant_product_categories')
                        .select('category_name')
                        .eq('id', categoryId)
                        .single();
                    if (error) {
                        console.error('Error fetching category name:', error);
                        return null;
                    }
                    setCategoryName(data.category_name);
                } catch (err) {
                    console.error('Unexpected error fetching category name:', err);
                    return null;
                }
            };
    
            fetchCategoryName();
    
        }, [categoryId, schoolId, showFeatured]);

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
                <Loader className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-44 bg-gray-50 p-4">
                <div className="text-xl font-semibold text-red-600 text-center">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="pb-6 sm:pb-8 font-sans bg-gray-50 max-w-full">
            <div className="mx-auto">
                <div className={`px-4 flex gap-1 items-center justify-between mb-6 sm:mb-8 bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white py-1 shadow-md transition-all duration-200 font-medium w-full`}>

                    <p className='text-lg font-bold'>
                        {showFeatured ? 'FEATURED PRODUCTS' : fetchedCategoryName?.toUpperCase()}
                    </p>

                    {products.length > 0 && (
                        !showFeatured && categoryId && (
                            <button
                                onClick={() => { navigate(`/categories/${categoryId}/products?schoolId=${schoolId || ''}&categoryName=${encodeURIComponent(fetchedCategoryName || '')}`); window.scrollTo(0, 0); }}
                                className="text-base font-semibold text-white hover:text-gray-100 transition-colors duration-200 underline"
                            >
                                See more <span aria-hidden="true">&rarr;</span>
                            </button>
                        )
                    )}
                </div>

                {products.length === 0 ? (
                    <div className='w-full flex justify-center items-center h-20 bg-gray-50 px-4'>
                        <p className="text-gray-500 text-xl text-center">No products found for this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 sm:px-6 lg:px-8">
                        {products.map((product) => (
                            <div key={product.id} className="col-span-1 bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100">
                                <Swiper
                                    modules={[Pagination, Navigation]}
                                    spaceBetween={10}
                                    slidesPerView={1}
                                    pagination={{ clickable: true }}
                                    navigation
                                    className="w-full h-32 md:h-40" // Increased height slightly for better visibility
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
                                <div className="p-3 sm:p-4 flex flex-col flex-grow">
                                    {/* <h3 className="text-base font-bold mb-1 truncate text-gray-800">{product.product_description}</h3> */}
                                    {product.discount_price ? (
                                        <div>
                                            <div className="text-xs text-gray-500 line-through truncate">₦{product.product_price}</div>
                                            <div className="text-lg text-indigo-600 font-extrabold mb-1">₦{product.discount_price}</div>
                                        </div>
                                    ) : (
                                        <p className="text-lg text-indigo-600 font-extrabold mb-1">₦{product.product_price}</p>
                                    )}
                                    {product.full_name && (
                                        <p className="text-xs text-gray-500 mb-3 flex-grow">
                                            by <span className="font-medium text-gray-700">{product.full_name}</span>
                                        </p>
                                    )}
                                    {product.phone_number && (
                                        userIsAuthenticated ? (
                                            // Render as link for authenticated users
                                            <ContactSellerLink product={product} className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-4 py-2 text-sm rounded-full shadow-md transition-all duration-200 font-medium w-full`}>
                                                Get Now
                                            </ContactSellerLink>
                                        ) : (
                                            <ContactSellerButton product={product} className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-4 py-2 text-sm rounded-full shadow-md transition-all duration-200 font-medium w-full`}>
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
        </div>
    );
};

export default VerticalProductList;