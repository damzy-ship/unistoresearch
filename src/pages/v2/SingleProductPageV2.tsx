import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, HostelsProductUpdates } from '../../lib/supabase';
import { ProductDetailSheetV2 } from '../../components/v2/ProductDetailSheetV2';
import { ProductCardV2 } from '../../components/v2/ProductCardV2';

const SingleProductPageV2: React.FC = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState<HostelsProductUpdates | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(true); // Open detail by default for single product view
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setError('Product ID not found');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: prodData, error: fetchError } = await supabase
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
          .eq('id', productId)
          .single();

        if (fetchError) {
          setError('Product not found');
          setProduct(null);
        } else {
          setProduct(prodData as HostelsProductUpdates);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Handle order action
  const handleOrder = (e: React.MouseEvent, productItem: any) => {
    e.stopPropagation();
    const phone = productItem.unique_visitors?.phone_number;
    const price = productItem.discount_price || productItem.price;
    const text = `Hi, I'm interested in ${productItem.post_description} priced at ₦${Number(price).toLocaleString()}.`;
    
    if (phone) {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
        console.log("No phone number available to route order.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f5] dark:bg-[#1a1a1a]">
        <div className="w-full sm:w-96 h-96 bg-black/5 dark:bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pb-12 sm:py-6 lg:p-12 bg-[#f8f6f5] dark:bg-[#1a1a1a]">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 px-4 sm:px-6 lg:px-0">
            <Link to="/hostel" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-[#1a2a40] dark:hover:text-white transition-colors mb-3">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back
            </Link>
          </div>
          <div className="mx-4 sm:mx-6 lg:mx-0 p-12 rounded-2xl bg-black/5 dark:bg-white/5 text-center">
            <h2 className="text-xl font-bold text-[#1a2a40] dark:text-white mb-2">
              {error || 'Product not found'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              The product you're looking for doesn't exist or is no longer available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 sm:py-6 lg:p-12 bg-[#f8f6f5] dark:bg-[#1a1a1a]">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 sm:mb-10 pt-6 px-4 sm:px-6 lg:px-0">
          <Link to="/hostel" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-[#1a2a40] dark:hover:text-white transition-colors mb-3">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-[#1a2a40] dark:text-white tracking-tight">
            Product Details
          </h1>
        </div>

        {/* Product Card */}
        <div className="px-4 sm:px-6 lg:px-0">
          <ProductCardV2
            product={product}
            index={0}
            onClick={() => setDetailOpen(true)}
            fallbackImage="/images/placeholder.png"
          />
        </div>
      </div>
      
      {/* Detail Sheet */}
      <ProductDetailSheetV2
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={product}
      />
    </div>
  );
};

export default SingleProductPageV2;
