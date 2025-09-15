import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Define a type for your product data
interface Product {
    id: string;
    product_description: string;
    product_price: string;
    image_urls: string[];
    is_available: boolean;
    full_name: string;
    phone_number: string;
}

// Define the props interface
interface HorizontalProductListProps {
    categoryId: string;
    schoolId: string;
    categoryName: string;
}

const HorizontalProductList: React.FC<HorizontalProductListProps> = ({ categoryId, schoolId, categoryName }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProductsByCategory = async () => {
            if (!categoryId || !schoolId) {
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
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-xl font-semibold text-gray-700">Loading products...</div>
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
        <div className="py-8 sm:py-12 font-sans bg-gray-50 max-w-full overflow-hidden">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Products
                        </h2>
                        <p className="mt-1 text-lg font-medium text-gray-500">
                            in <span className="font-semibold text-indigo-600">{categoryName}</span>
                        </p>
                    </div>
                    {products.length > 0 && (
                        <a
                            href="#"
                            className="text-base font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                        >
                            View All <span aria-hidden="true">&rarr;</span>
                        </a>
                    )}
                </div>

                {products.length === 0 ? (
                    <p className="text-center text-gray-500 mt-16 text-xl">No products found for this category.</p>
                ) : (
                    <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
                        {products.map((product) => (
                            <div key={product.id} className="w-52 md:w-60 flex-shrink-0 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100">
                                <Swiper
                                    modules={[Pagination, Navigation]}
                                    spaceBetween={10}
                                    slidesPerView={1}
                                    pagination={{ clickable: true }}
                                    navigation
                                    className="w-full h-44 md:h-48"
                                    
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
                                            <span className="font-medium text-gray-700">{product.full_name}</span>
                                        </p>
                                    )}
                                    {/* <p className={`text-sm font-semibold mb-4 ${product.is_available ? 'text-green-500' : 'text-red-500'}`}>
                                        {product.is_available ? 'In Stock' : 'Out of Stock'}
                                    </p> */}
                                    {product.phone_number && (
                                        <button
                                            // onClick={() => handleContactSeller(product)}
                                            className="mt-auto flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full shadow-md transition-all duration-200 font-medium w-full"
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
        </div>
    );
};

export default HorizontalProductList;