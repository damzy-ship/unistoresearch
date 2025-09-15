import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getUserId } from '../hooks/useTracking';

// Define the types for your data
interface Category {
  id: string;
  category_name: string;
  category_image: string;
}

const MerchantCategoriesGrid: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


  const schoolId = '1724171a-6664-44fd-aa1e-f509b124ab51';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('merchant_product_categories')
          .select('id, category_name, category_image');

        if (error) throw error;

        setCategories(data || []);
      } catch (err: any) {
        console.error('Error fetching categories:', err.message);
        setError('Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    window.scrollTo(0, 0); // Scroll to top
    navigate(`/categories/${categoryId}/products?schoolId=${schoolId}&categoryName=${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-gray-700">Loading categories...</div>
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
    <div className="p-4 sm:p-6 md:p-8 mt-3"> {/* Adjust padding for better spacing */}
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-700">Product Categories</h1> {/* Hide the main heading as per the image */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCategoryClick(category.id, category.category_name)}
            // New styles for the container:
            // Remove the border, add a more subtle shadow, and adjust the padding.
            className="cursor-pointer rounded-xl text-center overflow-hidden transition-transform transform hover:scale-105"
          >
            <img
              src={category.category_image}
              alt={category.category_name}
              // Set a fixed aspect ratio for consistent image size and apply rounded corners
              className="w-full h-32 md:h-40 object-cover rounded-xl shadow-md transition-shadow hover:shadow-lg"
            />
            {/* New styles for the category name */}
            <h3 className="mt-2 text-sm md:text-base font-medium text-gray-800 truncate">
              {category.category_name}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MerchantCategoriesGrid;