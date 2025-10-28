import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Product, supabase } from '../lib/supabase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import ContactSellerButton from '../components/ContactSellerButton';
import ConfirmContactModal from '../components/ConfirmContactModal';
import ContactSellerLink from '../components/ContactSellerLink';
import { isAuthenticated } from '../hooks/useTracking';
import { useTheme } from '../hooks/useTheme';
import { useHostelMode } from '../hooks/useHostelMode';
import ProductImageModal from '../components/ProductImageModal';


const CategoryProductsPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const [searchParams] = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const categoryName = searchParams.get('categoryName');

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { currentTheme } = useTheme();
    const { hostelMode } = useHostelMode();
    const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingProduct, setPendingProduct] = useState<Partial<Product> | null>(null);
    const [selectedImageModal, setSelectedImageModal] = useState<{ product: Product; imageIndex: number } | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const auth = await isAuthenticated();
            setUserIsAuthenticated(auth);
            if (auth) {
                // if there's a pending product stored, show confirm modal
                const raw = localStorage.getItem('pending_contact_product');
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        setPendingProduct(parsed);
                        setShowConfirmModal(true);
                    } catch {
                        console.warn('Invalid pending contact product in localStorage');
                        localStorage.removeItem('pending_contact_product');
                    }
                }
            }
        };
        checkAuth();
        const onPending = (e: Event) => {
            const detail = (e as CustomEvent).detail as Partial<Product>;
            setPendingProduct(detail);
            setShowConfirmModal(true);
        };
        window.addEventListener('pending-contact-available', onPending as EventListener);
        // cleanup for this effect
        return () => {
            window.removeEventListener('pending-contact-available', onPending as EventListener);
        };
    }, []);

    useEffect(() => {
        if (!categoryId || !schoolId) {
            setError('Missing category or school ID.');
            setLoading(false);
            return;
        }

        const fetchProductsByCategory = async () => {
            if (!categoryId || !schoolId) {
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
                        school_id: schoolId
                    },
                });

                if (functionError) {
                    throw functionError;
                }

                const products = data?.results || [];
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
        <div className="min-h-screen p-6 sm:p-8 font-sans"
            style={{ backgroundColor: currentTheme.surface }}
        >
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className={`text-2xl text-${currentTheme.primaryTsFormat} font-extrabold mb-2 tracking-tight`}>Products</h1>
                    <p className="text-lg font-medium"
                        style={{ color: currentTheme.text }}
                    >
                        in <span className="font-semibold">{categoryName}</span>
                    </p>
                </div>
                {products.length === 0 ? (
                    <p
                        style={{ color: currentTheme.primary }}
                        className="text-center col-span-full mt-8 text-xl">No products found for this category.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <div key={product.id} className="rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col border border-gray-200"
                                style={{ backgroundColor: currentTheme.background }}
                            >
                                <div
                                    className="relative w-full h-64 cursor-pointer"
                                    onClick={() => setSelectedImageModal({ product, imageIndex: 0 })}
                                >
                                    <Swiper
                                        modules={[Pagination, Navigation]}
                                        spaceBetween={10}
                                        slidesPerView={1}
                                        pagination={{ clickable: true }}
                                        navigation
                                        className="w-full h-full"
                                        onSlideChange={(swiper) => {
                                            const currentSlide = swiper.activeIndex;
                                            setSelectedImageModal(prev => prev ? { ...prev, imageIndex: currentSlide } : null);
                                        }}
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
                                </div>

                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold mb-2 text-gray-800"
                                        style={{ color: currentTheme.text }}
                                    >{product.product_description}</h3>
                                    {product.discount_price ? (
                                        <div className="mb-2">
                                            <div className="text-sm line-through"
                                                style={{ color: currentTheme.text }}
                                            >₦{product.product_price}</div>
                                            <div
                                                style={{ color: currentTheme.primary }}
                                                className="text-3xl font-black">₦{product.discount_price}</div>
                                        </div>
                                    ) : (
                                        <p
                                            style={{ color: currentTheme.primary }}
                                            className="text-3xl font-black mb-2">₦{product.product_price}</p>
                                    )}
                                    {product.full_name && (
                                        <p className="text-sm mb-1"
                                            style={{ color: currentTheme.text }}
                                        >
                                            by <span className="font-semibold">{product.full_name}</span>
                                        </p>
                                    )}
                                    {hostelMode && (product.is_hostel_product || product.unique_visitors?.is_hostel_merchant) && (
                                        <p className="text-xs mb-2"
                                            style={{ color: currentTheme.text }}
                                        >
                                            Hostel: <span className="font-medium">{product.unique_visitors?.hostels?.name || 'Unknown Hostel'}</span>
                                            {product.unique_visitors?.room ? ` • Room ${product.unique_visitors.room}` : ''}
                                        </p>
                                    )}
                                    <p className={`text-sm font-bold mb-4 ${product.is_available ? 'text-green-500' : 'text-red-500'}`}>
                                        {product.is_available ? 'In Stock' : 'Out of Stock'}
                                    </p>
                                    {product.phone_number && (
                                        userIsAuthenticated ? (
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

                <ConfirmContactModal
                    isOpen={showConfirmModal}
                    product={pendingProduct || undefined}
                    onClose={() => { setShowConfirmModal(false); setPendingProduct(null); localStorage.removeItem('pending_contact_product'); }}
                    onConfirm={() => {
                        // nothing special here other than close
                        setShowConfirmModal(false);
                        setPendingProduct(null);
                        localStorage.removeItem('pending_contact_product');
                    }}
                />
            </div>

            {/* Image Modal */}
            {selectedImageModal && (
                <ProductImageModal
                    images={selectedImageModal.product.image_urls}
                    initialIndex={selectedImageModal.imageIndex}
                    isOpen={!!selectedImageModal}
                    onClose={() => setSelectedImageModal(null)}
                    productTitle={selectedImageModal.product.product_description}
                    merchantName={selectedImageModal.product.brand_name || selectedImageModal.product.full_name || 'Unknown Seller'}
                />
            )}

            {/* Auth handled inside ContactSellerButton */}
        </div>
    );
};

export default CategoryProductsPage;