import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader, CheckCircle, AlertCircle, Image, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { generateAndEmbedSingleProduct } from '../lib/generateEmbedding';

// Reusable functions from your original component
const uploadImageToSupabase = async (file, merchantId) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${merchantId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

    if (uploadError) {
        throw new Error(`Error uploading image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

    return publicUrl;
};

const deleteImageFromSupabase = async (imageUrl) => {
    const urlParts = imageUrl.split('/');
    const fileName = urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');

    if (fileName) {
        const { error: storageError } = await supabase.storage
            .from('product-images')
            .remove([fileName]);

        if (storageError) {
            console.warn('Error deleting image from storage:', storageError);
        }
    }
};

interface Product {
    id: string;
    merchant_id: string;
    product_description: string;
    product_price: string;
    is_available: boolean;
    created_at: string;
    image_urls: string[];
    embedding: number[];
    search_description: string;
    is_featured: boolean;
    discount_price?: string;
}

interface School {
    id: string;
    name: string;
    short_name: string;
}

export default function AllProductsPage() {
    // Original states
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productDescription, setProductDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [searchDescription, setSearchDescription] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [embeddingLoadingId, setEmbeddingLoadingId] = useState<string | null>(null);

    // New states for pagination and school filter
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 100;
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<string>(''); // Stores the school's UUID
    const [showDiscountedProducts, setShowDiscountedProducts] = useState(false);
    const [showFeaturedProducts, setShowFeaturedProducts] = useState(false);

    const { currentTheme } = useTheme();

    // Fetch schools on initial load
    useEffect(() => {
        fetchSchools();
    }, []);

    // Fetch products whenever the page or selected school changes
    useEffect(() => {
        fetchPaginatedProducts();
    }, [currentPage, selectedSchool, showDiscountedProducts, showFeaturedProducts]);

    const fetchSchools = async () => {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('id, short_name')
                .order('short_name');

            if (error) {
                throw error;
            }
            setSchools(data || []);
            // Default to first school if available
        } catch (err) {
            console.error('Error fetching schools:', err);
            setError('Failed to load schools.');
        }
    };

    const fetchPaginatedProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: functionError } = await supabase.functions.invoke('admin-fetch-products', {
                body: {
                    page_number: currentPage,
                    page_size: pageSize,
                    school_id: selectedSchool,
                    show_featured: showFeaturedProducts,
                    show_discount: showDiscountedProducts,
                },
            });

            if (functionError) {
                throw new Error(functionError.message);
            }

            const { results, pagination } = data;
            setAllProducts(results || []);
            // console.log('Fetched products:', results);
            setTotalPages(pagination.total_pages);
        } catch (err) {
            console.error('Error fetching paginated products:', err);
            setError('Failed to load products. ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSchoolId = e.target.value;
        setSelectedSchool(newSchoolId);
        setCurrentPage(1); // Reset to the first page whenever the filter changes
    };

    // The rest of your component logic remains the same.
    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return allProducts;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return allProducts.filter(product =>
            product.product_description.toLowerCase().includes(lowerCaseSearchTerm) ||
            product.search_description.toLowerCase().includes(lowerCaseSearchTerm) ||
            product.merchant_id.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [allProducts, searchTerm]);

    const startEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductDescription(product.product_description);
        setProductPrice(product.product_price);
        setSearchDescription(product.search_description);
        setIsAvailable(product.is_available);
        setNewFiles([]);
        setShowForm(true);
    };

    const resetForm = () => {
        setProductDescription('');
        setProductPrice('');
        setSearchDescription('');
        setIsAvailable(true);
        setNewFiles([]);
        setEditingProduct(null);
        setError(null);
        setShowForm(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const invalidFiles = filesArray.filter(file => file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/'));
            if (invalidFiles.length > 0) {
                setError('Some files were invalid. Max 5MB per file, and only image types are allowed.');
                return;
            }
            setNewFiles(filesArray);
            setError(null);
        }
    };

    const handleEditProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct || !productDescription || !productPrice) {
            setError('Product description and price are required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let newEmbedding = editingProduct.embedding;
            let newSearchDescription = searchDescription;

            const descriptionChanged = productDescription !== editingProduct.product_description || searchDescription !== editingProduct.search_description;

            if (descriptionChanged) {
                const { embedding, enhancedDescription } = await generateAndEmbedSingleProduct(productDescription);
                newEmbedding = embedding;
                newSearchDescription = enhancedDescription;
            }

            setUploadingImages(true);
            const newUrls = newFiles.length > 0 ? await Promise.all(newFiles.map(file => uploadImageToSupabase(file, editingProduct.merchant_id))) : [];
            setUploadingImages(false);

            const updatedImageUrls = [...(editingProduct?.image_urls || []), ...newUrls];

            const { error: updateError } = await supabase
                .from('merchant_products')
                .update({
                    product_description: productDescription,
                    product_price: productPrice,
                    is_available: isAvailable,
                    image_urls: updatedImageUrls,
                    embedding: newEmbedding,
                    search_description: newSearchDescription
                })
                .eq('id', editingProduct.id);

            if (updateError) {
                throw updateError;
            }

            resetForm();
            fetchPaginatedProducts();
        } catch (err) {
            console.error('Error editing product:', err);
            setUploadingImages(false);
            setError(err instanceof Error ? err.message : 'Failed to edit product');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async (product: Product) => {
        const newAvailability = !product.is_available;
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('merchant_products')
                .update({ is_available: newAvailability })
                .eq('id', product.id);

            if (updateError) {
                throw updateError;
            }

            setAllProducts(allProducts.map(p =>
                p.id === product.id ? { ...p, is_available: newAvailability } : p
            ));
        } catch (err) {
            console.error('Error toggling product availability:', err);
            setError('Failed to toggle product availability.');
        } finally {
            setLoading(false);
        }
    };
    const handleToggleFeatured = async (product: Product) => {
        const newFeatured = !product.is_featured;
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('merchant_products')
                .update({ is_featured: newFeatured })
                .eq('id', product.id);

            if (updateError) {
                throw updateError;
            }

            setAllProducts(allProducts.map(p =>
                p.id === product.id ? { ...p, is_featured: newFeatured } : p
            ));
        } catch (err) {
            console.error('Error toggling product featured status:', err);
            setError('Failed to toggle product featured status.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveImageFromEdit = async (imageUrlToRemove: string) => {
        if (!editingProduct) return;

        const updatedUrls = editingProduct.image_urls.filter(url => url !== imageUrlToRemove);
        setEditingProduct({ ...editingProduct, image_urls: updatedUrls });

        try {
            await deleteImageFromSupabase(imageUrlToRemove);
            const { error: dbError } = await supabase
                .from('merchant_products')
                .update({ image_urls: updatedUrls })
                .eq('id', editingProduct.id);

            if (dbError) {
                throw new Error(`Error updating product record: ${dbError.message}`);
            }

            fetchPaginatedProducts();
        } catch (err) {
            console.error('Error removing image:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove image');
            setEditingProduct(editingProduct);
            fetchPaginatedProducts();
        }
    };

    const handleUpdateEmbedding = async (product: Product) => {
        setEmbeddingLoadingId(product.id);
        setError(null);
        try {
            const { embedding, enhancedDescription } = await generateAndEmbedSingleProduct(product.product_description);

            const { error: updateError } = await supabase
                .from('merchant_products')
                .update({
                    embedding: embedding,
                    search_description: enhancedDescription
                })
                .eq('id', product.id);

            if (updateError) {
                throw updateError;
            }

            setAllProducts(allProducts.map(p =>
                p.id === product.id ? { ...p, embedding: embedding, search_description: enhancedDescription } : p
            ));
        } catch (err) {
            console.error('Error generating and updating embedding:', err);
            setError(err instanceof Error ? err.message : 'Failed to update embedding.');
        } finally {
            setEmbeddingLoadingId(null);
        }
    };

    const handleSearchDescriptionChange = async (productId: string, newDescription: string) => {
        try {
            const { embedding, enhancedDescription } = await generateAndEmbedSingleProduct(newDescription, true);

            const { error: updateError } = await supabase
                .from('merchant_products')
                .update({
                    embedding: embedding,
                    search_description: enhancedDescription
                })
                .eq('id', productId);

            if (updateError) {
                throw updateError;
            }
            console.log('Updated search description and embedding for product ID:', productId, embedding, enhancedDescription);
            setAllProducts(allProducts.map(p =>
                p.id === productId ? { ...p, search_description: newDescription } : p
            ));
        } catch (err) {
            console.error('Error updating search description:', err);
            setError(err instanceof Error ? err.message : 'Failed to update search description.');
        }
    };
    const handleProductPriceChange = async (productId: string, newPrice: string) => {
        try {
            const { error: updateError } = await supabase
                .from('merchant_products')
                .update({ product_price: newPrice })
                .eq('id', productId);

            if (updateError) {
                throw updateError;
            }

            setAllProducts(allProducts.map(p =>
                p.id === productId ? { ...p, product_price: newPrice } : p
            ));
        } catch (err) {
            console.error('Error updating price:', err);
            setError(err instanceof Error ? err.message : 'Failed to update price.');
        }
    };

    // New: update discount price (can be set to null if input is empty)
    const handleProductDiscountPriceChange = async (productId: string, newDiscountPrice: string) => {
        try {
            // Clean the input: remove currency symbols and non-numeric characters except dot
            const cleaned = newDiscountPrice.trim();

            const discountValue = cleaned === '' ? null : cleaned;

            const { error: updateError } = await supabase
                .from('merchant_products')
                .update({ discount_price: discountValue })
                .eq('id', productId);

            if (updateError) {
                throw updateError;
            }

            setAllProducts(allProducts.map(p =>
                p.id === productId ? { ...p, discount_price: discountValue === null ? undefined : discountValue } : p
            ));
        } catch (err) {
            console.error('Error updating discount price:', err);
            setError(err instanceof Error ? err.message : 'Failed to update discount price.');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-auto my-8 p-6">
            <div className="flex justify-between items-center pb-4">
                <h2 className="text-md sm:text-xl font-semibold text-gray-800">
                    Manage All Products
                </h2>
            </div>
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}
            {showForm ? (
                <div className="py-4 bg-white rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
                    <form onSubmit={handleEditProduct} className="space-y-4">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Product Description</label>
                            <textarea
                                id="description"
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                required
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Product Price</label>
                            <input
                                type="text"
                                id="price"
                                value={productPrice}
                                onChange={(e) => setProductPrice(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="searchDescription" className="block text-sm font-medium text-gray-700">Search Description (for better search results)</label>
                            <textarea
                                id="searchDescription"
                                value={searchDescription}
                                onChange={(e) => setSearchDescription(e.target.value)}
                                rows={2}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            ></textarea>
                        </div>
                        <div className="flex items-center">
                            <input
                                id="isAvailable"
                                type="checkbox"
                                checked={isAvailable}
                                onChange={(e) => setIsAvailable(e.target.checked)}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">Available for sale</label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Images
                                <span className="text-xs text-gray-500 ml-2">(Current images shown below. Add more, or remove existing ones.)</span>
                            </label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                disabled={uploadingImages || loading}
                            />
                        </div>
                        {(newFiles.length > 0 || (editingProduct && editingProduct.image_urls.length > 0)) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {editingProduct?.image_urls.map((url, index) => (
                                    <div key={url} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-300">
                                        <img src={url} alt={`Product image ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImageFromEdit(url)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                                            title="Remove image"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {newFiles.map((file, index) => (
                                    <div key={file.name + index} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-300">
                                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                        <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                disabled={loading || uploadingImages}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-md shadow-md transition-all duration-200 font-medium`}
                                disabled={loading || uploadingImages}
                            >
                                {(loading || uploadingImages) && <Loader className="w-4 h-4 animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="py-4">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h3 className="text-lg font-semibold text-gray-800">Products ({allProducts.length})</h3>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm w-full"
                                />
                            </div>
                            <div className="relative flex items-center gap-2">
                                <select
                                    value={selectedSchool}
                                    onChange={handleSchoolChange}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md shadow-sm"
                                >
                                    <option value="">All Schools</option>
                                    {schools.map(school => (
                                        <option key={school.id} value={school.id}>
                                            {school.short_name}
                                        </option>
                                    ))}
                                </select>

                                {/* Toggle: Show Discounted Products */}
                                <button
                                    type="button"
                                    onClick={() => { setShowDiscountedProducts(prev => !prev); setCurrentPage(1); }}
                                    className={`px-3 py-2 rounded-md border transition-colors text-sm ${showDiscountedProducts ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                    title="Toggle discounted products"
                                >
                                    Discounted
                                </button>

                                {/* Toggle: Show Featured Products */}
                                <button
                                    type="button"
                                    onClick={() => { setShowFeaturedProducts(prev => !prev); setCurrentPage(1); }}
                                    className={`px-3 py-2 rounded-md border transition-colors text-sm ${showFeaturedProducts ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                    title="Toggle featured products"
                                >
                                    Featured
                                </button>
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No products found.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredProducts.map((product) => (
                                <div key={product.id} className="border bg-white border-gray-200 rounded-lg p-4 flex flex-col items-center text-center">
                                    <div className="w-full h-40 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center mb-4">
                                        {product.image_urls && product.image_urls.length > 0 ? (
                                            <img src={product.image_urls[0]} alt={product.product_description} className="w-full h-full object-cover" />
                                        ) : (
                                            <Image className="w-16 h-16 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <h4 className="font-semibold text-gray-900 line-clamp-2">{product.product_description}</h4>
                                        <p
                                            className="text-sm text-gray-500 mt-1 px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            contentEditable={true}
                                            onBlur={(e) => handleSearchDescriptionChange(product.id, e.currentTarget.textContent || '')}
                                            suppressContentEditableWarning={true}
                                        >
                                            {product.search_description}
                                        </p>
                                        <p
                                            className="text-gray-700 mt-2 px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            contentEditable={true}
                                            onBlur={(e) => handleProductPriceChange(product.id, e.currentTarget.textContent || '')}
                                            suppressContentEditableWarning={true}
                                        >
                                            {product.product_price}
                                        </p>

                                        {/* Discount price (editable) */}
                                        <p
                                            className="text-sm text-gray-500 mt-1 px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            contentEditable={true}
                                            onBlur={(e) => handleProductDiscountPriceChange(product.id, e.currentTarget.textContent || '')}
                                            suppressContentEditableWarning={true}
                                        >
                                            {product.discount_price ?  product.discount_price : 'No discount'}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center justify-center gap-1 mt-1">
                                            {product.is_available ? (
                                                <><CheckCircle className="w-4 h-4 text-green-500" /> Available</>
                                            ) : (
                                                <><AlertCircle className="w-4 h-4 text-red-500" /> Not Available</>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center justify-center gap-1 mt-1">
                                            {product.is_featured ? (
                                                <><CheckCircle className="w-4 h-4 text-green-500" /> Featured</>
                                            ) : (
                                                <><AlertCircle className="w-4 h-4 text-red-500" /> Not Featured</>
                                            )}
                                        </p>
                                        <div className="flex flex-col gap-2 mt-4 w-full">
                                            <button
                                                onClick={() => startEditProduct(product)}
                                                className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleToggleAvailability(product)}
                                                className={`w-full py-2 rounded-md transition-colors ${product.is_available
                                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                                    : 'bg-green-500 text-white hover:bg-green-600'
                                                    }`}
                                            >
                                                {product.is_available ? 'Set Unavailable' : 'Set Available'}
                                            </button>
                                            <button
                                                onClick={() => handleToggleFeatured(product)}
                                                className={`w-full py-2 rounded-md transition-colors ${product.is_featured
                                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                                    : 'bg-green-500 text-white hover:bg-green-600'
                                                    }`}
                                            >
                                                {product.is_featured ? 'Set Unfeatured' : 'Set Featured'}
                                            </button>
                                            <button
                                                onClick={() => handleUpdateEmbedding(product)}
                                                className={`w-full py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${embeddingLoadingId === product.id ? 'bg-gray-400' : 'bg-orange-500 text-white hover:bg-orange-600'
                                                    }`}
                                                disabled={embeddingLoadingId === product.id}
                                            >
                                                {embeddingLoadingId === product.id && <Loader className="w-4 h-4 animate-spin" />}
                                                Update Embedding
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || loading}
                                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || loading}
                                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}