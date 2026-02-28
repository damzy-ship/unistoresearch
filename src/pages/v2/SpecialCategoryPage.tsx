import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase, SpecialCategory, HostelsProductUpdates } from '../../lib/supabase';
import { ProductDetailSheetV2 } from '../../components/v2/ProductDetailSheetV2';
import { ProductCardV2 } from '../../components/v2/ProductCardV2';

const SpecialCategoryPage: React.FC = () => {
  const { categoryId } = useParams();
  const [category, setCategory] = useState<SpecialCategory | null>(null);
  const [products, setProducts] = useState<HostelsProductUpdates[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<HostelsProductUpdates | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!categoryId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: catData } = await supabase
          .from('hostel_special_categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        setCategory(catData || null);

        const { data: prodData } = await supabase
          .from('hostel_product_updates')
          .select(`
            id,
            post_description,
            post_images,
            created_at,
            actual_user_id,
            unique_visitors:actual_user_id (
                id,
                full_name,
                profile_picture,
                phone_number,
                is_hostel_merchant,
                school_id
            ),
            status,
            post_type,
            price,
            discount_price,
            special_category_ids
          `)
          .contains('special_category_ids', [categoryId])
          .or('status.eq.open,status.is.null')
          .order('created_at', { ascending: false });

        setProducts((prodData || []) as HostelsProductUpdates[]);
      } catch (err) {
        console.error('Failed to load special category page data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  // Hook this up to exactly whatever your ProductDetailSheetV2 uses for the order action
  const handleOrder = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    // Example implementation (update this with your actual order logic)
    const phone = product.unique_visitors?.phone_number;
    const price = product.discount_price || product.price;
    const text = `Hi, I'm interested in ${product.post_description} priced at ₦${Number(price).toLocaleString()}.`;
    
    if (phone) {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
        console.log("No phone number available to route order.");
    }
  };

  if (!category && !loading) return (
    <div className="p-8">
      <Link to="/hostel" className="text-primary font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">arrow_back</span> Back</Link>
      <h2 className="mt-4 text-2xl font-bold">Category not found</h2>
    </div>
  );

  return (
    <div className="min-h-screen pb-12 sm:py-6 lg:p-12 bg-[#f8f6f5] dark:bg-[#1a1a1a]">
      <div className="max-w-6xl mx-auto">
        
        {/* Clean, Typography-Focused Header */}
        <div className="mb-6 sm:mb-10 pt-6 px-4 sm:px-6 lg:px-0">
            <Link to="/hostel" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-[#1a2a40] dark:hover:text-white transition-colors mb-3">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-[#1a2a40] dark:text-white tracking-tight">
                {category ? category.title : 'Loading...'}
            </h1>
            {category?.subtitle && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                    {category.subtitle}
                </p>
            )}
        </div>

        <AnimatePresence>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-96 bg-black/5 dark:bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="mx-4 sm:mx-6 lg:mx-0 p-12 rounded-2xl bg-black/5 dark:bg-white/5 text-center text-zinc-500 font-medium">
              No products found for this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 gap-y-2 sm:gap-y-6">
                {products.map((p, idx) => (
                  <ProductCardV2
                    key={p.id}
                    product={p}
                    index={idx}
                    onClick={() => {
                      setSelectedProduct(p);
                      setDetailOpen(true);
                    }}
                    onGetNowClick={handleOrder} // Bind your order action here
                    fallbackImage="/images/placeholder.png"
                  />
                ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      
      <ProductDetailSheetV2
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default SpecialCategoryPage;