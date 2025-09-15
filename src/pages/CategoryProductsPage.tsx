import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Define a type for your product data to match the new rendering
interface Product {
  id: string;
  product_description: string;
  product_price: string;
  image_urls: string[];
  is_available: boolean; // Assuming this is part of your data
  full_name: string; // Assuming this is part of your data
  phone_number: string; // Assuming this is part of your data
}

const CategoryProductsPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const categoryName = searchParams.get('categoryName');

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
            school_id: schoolId
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
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-gray-700">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Products</h1>
          <p className="text-lg font-medium text-gray-500">
            in <span className="font-semibold">{categoryName}</span>
          </p>
        </div>
        {products.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full mt-8 text-xl">No products found for this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col border border-gray-200">
                <Swiper
                  modules={[Pagination, Navigation]}
                  spaceBetween={10}
                  slidesPerView={1}
                  pagination={{ clickable: true }}
                  navigation
                  className="w-full h-64"
                >
                  {product.image_urls.map((url, imgIndex) => (
                    <SwiperSlide key={imgIndex}>
                      <img src={url} alt={product.product_description} className="w-full h-full object-cover" />
                    </SwiperSlide>
                  ))}
                </Swiper>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold mb-2 truncate text-gray-800">{product.product_description}</h3>
                  <p className="text-3xl text-green-600 font-black mb-2">{product.product_price}</p>
                  {product.full_name && (
                    <p className="text-sm text-gray-500 mb-2">
                      <span className="font-semibold text-gray-700">{product.full_name}</span>
                    </p>
                  )}
                  <p className={`text-sm font-bold mb-4 ${product.is_available ? 'text-green-500' : 'text-red-500'}`}>
                    {product.is_available ? 'In Stock' : 'Out of Stock'}
                  </p>
                  {product.phone_number && (
                    <button
                      // onClick={() => handleContactSeller(product)}
                      className="flex gap-1 items-center justify-center bg-green-500 hover:bg-green-600 text-white px-8 py-2.5 rounded-full shadow-md transition-all duration-200 font-medium w-full"
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

export default CategoryProductsPage;