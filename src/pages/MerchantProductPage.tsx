import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Loader, CheckCircle, AlertCircle, Image, X } from 'lucide-react';
import { Product, supabase, UniqueVisitor } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { deleteImageFromSupabase, uploadImageToSupabase } from '../lib/databaseServices';
import { categorizePost, extractProductKeywordsFromDescription } from '../lib/gemini';


// Define the maximum number of images allowed
const MAX_IMAGES = 5;

export default function MerchantProductPage() {
    const { actual_merchant_id, merchantId, merchantName } = useParams<{ actual_merchant_id: string, merchantId: string, merchantName: string }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddProductForm, setShowAddProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [merchantDetails, setMerchantDetails] = useState<UniqueVisitor | null>(null);

    // Form states for adding/editing a product
    const [productDescription, setProductDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [isHostelProduct, setIsHostelProduct] = useState(false);
    const [newFiles, setNewFiles] = useState<File[]>([]); // State for new files to upload
    const [uploadingImages, setUploadingImages] = useState(false);
    const [isHostelMerchant, setIsHostelMerchant] = useState(false);
    const { currentTheme } = useTheme();

    // Calculate the total number of images that will exist after adding/editing
    const totalCurrentImages = editingProduct?.image_urls.length || 0;
    const totalProspectiveImages = totalCurrentImages + newFiles.length;
    const canAddMoreImages = totalProspectiveImages < MAX_IMAGES;
    const remainingImageSlots = MAX_IMAGES - totalCurrentImages;

    useEffect(() => {
        if (merchantId) {
            fetchMerchant();
            fetchProducts();
        }
    }, [merchantId]);

    const fetchMerchant = async () => {
        try {
            if (!actual_merchant_id) return null;
            const { data, error } = await supabase
                .from('unique_visitors')
                .select('*')
                .eq('id', actual_merchant_id)
                .single();
            if (error) {
                console.error('Error fetching merchant:', error);
                return null;
            }
            setMerchantDetails(data);
            setIsHostelMerchant(data.is_hostel_merchant || false);
        } catch (err) { console.error('Error fetching merchant:', err); }
    };

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('merchant_products')
                .select(`*`)
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setProducts(data);
            // setIsHostelMerchant(data[0]?.unique_visitor?.is_hostel_merchant || false);
            // console.log('Fetched products:', data);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const totalImagesIfAdded = (editingProduct?.image_urls.length || 0) + filesArray.length;

            if (totalImagesIfAdded > MAX_IMAGES) {
                // Show error if the total number of images exceeds the limit
                setError(`Image upload limit: You can only upload a maximum of ${MAX_IMAGES} images in total. You are trying to upload ${filesArray.length} new files, but you already have ${editingProduct?.image_urls.length || 0} images.`);
                setNewFiles([]); // Clear selected files to prevent them from being processed later
                // The input file value must also be reset for the user to select the same file(s) again after the error
                e.target.value = '';
                return;
            }

            const invalidFiles = filesArray.filter(file => file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/'));
            if (invalidFiles.length > 0) {
                setError('Some files were invalid. Max 5MB per file, and only image types are allowed.');
                e.target.value = '';
                return;
            }

            setNewFiles(filesArray);
            setError(null);
        }
    };

    const startEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductDescription(product.product_description);
        setProductPrice(product.product_price);
        setIsAvailable(product.is_available);
        setIsHostelProduct(product.is_hostel_product);
        setNewFiles([]);
        setShowAddProductForm(true);
    };

    const resetForm = () => {
        setProductDescription('');
        setProductPrice('');
        setIsAvailable(true);
        setIsHostelProduct(false);
        setNewFiles([]);
        setEditingProduct(null);
        setError(null);
        setShowAddProductForm(false);
    };

    const resetAndShowForm = () => {
        setProductDescription('');
        setProductPrice('');
        setIsAvailable(true);
        setIsHostelProduct(false);
        setNewFiles([]);
        setEditingProduct(null);
        setError(null);
        setShowAddProductForm(true);
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productDescription || !productPrice) {
            setError('Product description and price are required.');
            return;
        }

        if (newFiles.length > MAX_IMAGES) {
            setError(`You can only upload a maximum of ${MAX_IMAGES} images. You selected ${newFiles.length}.`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const query_category = await categorizePost(productDescription);
            const query_search_words = await extractProductKeywordsFromDescription(productDescription);
            setUploadingImages(true);
            const imageUrls = newFiles.length > 0 ? await Promise.all(newFiles.map(file => uploadImageToSupabase(file, merchantId ? merchantId : "", 'product-images', 'product-images'))) : [];
            setUploadingImages(false);

            const { error: dbError } = await supabase
                .from('merchant_products')
                .insert({
                    actual_merchant_id: actual_merchant_id,
                    merchant_id: merchantId,
                    product_description: productDescription,
                    product_price: productPrice,
                    is_available: isAvailable,
                    is_hostel_product: isHostelProduct,
                    image_urls: imageUrls,
                    product_category: query_category,
                    search_words: query_search_words
                });

            if (dbError) {
                throw dbError;
            }

            resetForm();
            fetchProducts();
        } catch (err) {
            console.error('Error adding product:', err);
            setUploadingImages(false);
            setError(err instanceof Error ? err.message : 'Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct || !productDescription || !productPrice) {
            setError('Product description and price are required.');
            return;
        }

        const updatedImageUrls = [...(editingProduct?.image_urls || []), ...newFiles.map(file => URL.createObjectURL(file))];
        if (updatedImageUrls.length > MAX_IMAGES) {
            setError(`You can only have a maximum of ${MAX_IMAGES} images. You are adding ${newFiles.length} new files to your existing ${editingProduct.image_urls.length} images.`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let query_category = editingProduct.product_category;
            let query_search_words = editingProduct.search_words;

            if (productDescription !== editingProduct.product_description) {
                query_category = await categorizePost(editingProduct.product_description);
                query_search_words = await extractProductKeywordsFromDescription(editingProduct.product_description);
            }

            setUploadingImages(true);
            const newUrls = newFiles.length > 0 ? await Promise.all(newFiles.map(file => uploadImageToSupabase(file, merchantId ? merchantId : "", 'product-images', 'product-images'))) : [];
            setUploadingImages(false);

            const finalImageUrls = [...(editingProduct?.image_urls || []), ...newUrls];

            const { error: dbError } = await supabase
                .from('merchant_products')
                .update({
                    product_description: productDescription,
                    product_price: productPrice,
                    is_available: isAvailable,
                    is_hostel_product: isHostelProduct,
                    image_urls: finalImageUrls,
                    product_category: query_category,
                    search_words: query_search_words
                })
                .eq('id', editingProduct.id);

            if (dbError) {
                throw dbError;
            }

            resetForm();
            fetchProducts();
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
            const { error: dbError } = await supabase
                .from('merchant_products')
                .update({ is_available: newAvailability })
                .eq('id', product.id);

            if (dbError) {
                throw dbError;
            }

            // Update the state to reflect the change immediately
            setProducts(products.map(p =>
                p.id === product.id ? { ...p, is_available: newAvailability } : p
            ));
        } catch (err) {
            console.error('Error toggling product availability:', err);
            setError('Failed to toggle product availability.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveImageFromEdit = async (imageUrlToRemove: string) => {
        if (!editingProduct) return;

        // Optimistic UI update: remove from state immediately
        const updatedUrls = editingProduct.image_urls.filter(url => url !== imageUrlToRemove);
        setEditingProduct({ ...editingProduct, image_urls: updatedUrls });

        // Delete from Supabase Storage and database
        try {
            await deleteImageFromSupabase(imageUrlToRemove, 'product-images');
            const { error: dbError } = await supabase
                .from('merchant_products')
                .update({ image_urls: updatedUrls })
                .eq('id', editingProduct.id);

            if (dbError) {
                throw new Error(`Error updating product record: ${dbError.message}`);
            }

            // Re-fetch products to ensure state is in sync
            fetchProducts();
        } catch (err) {
            console.error('Error removing image:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove image');
            // On failure, revert the UI state by re-fetching
            fetchProducts();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto my-8 p-6"
        >
            <div className="flex justify-between items-center pb-4">
                <h2 className="text-md sm:text-xl font-semibold text-gray-800">
                    Manage Products for {merchantName}
                </h2>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {showAddProductForm ? (
                <div className="py-4 bg-white rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                    <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="space-y-4">
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

                        {/* --- NEW TOGGLE SWITCH FOR is_hostel_product --- */}
                        {isHostelMerchant && <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <label htmlFor="isHostelProductToggle" className="text-sm font-medium text-gray-700 select-none">
                                Hostel Product
                            </label>
                            <label
                                htmlFor="isHostelProductToggle"
                                className={`relative inline-flex items-center cursor-pointer transition-all duration-300 ${loading || uploadingImages ? 'opacity-50' : ''}`}
                            >
                                <input
                                    id="isHostelProductToggle"
                                    type="checkbox"
                                    checked={isHostelProduct}
                                    onChange={(e) => setIsHostelProduct(e.target.checked)}
                                    disabled={loading || uploadingImages}
                                    className="sr-only peer"
                                />
                                {/* Track (Rectangular Look) */}
                                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-sm peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:bg-yellow-500 transition-colors duration-300 ease-in-out"></div>

                                {/* Thumb (Square Look) */}
                                <div
                                    className={`absolute left-[4px] top-[4px] bg-white w-5 h-5 transition-all duration-300 ease-in-out border border-gray-300 
                                                ${isHostelProduct ? 'translate-x-7 bg-white shadow-md' : 'translate-x-0 bg-gray-100 shadow-sm'}`}
                                ></div>
                            </label>
                        </div>}
                        {/* ----------- END TOGGLE SWITCH FOR is_hostel_product ----------------------------------------- */}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Images <span className="text-xs text-orange-600 font-bold">(Max {MAX_IMAGES} images)</span>
                                {editingProduct && <span className="text-xs text-gray-500 ml-2">({totalCurrentImages} existing, {remainingImageSlots} slots remaining.)</span>}
                            </label>

                            {!editingProduct || canAddMoreImages ? (
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                    disabled={uploadingImages || loading}
                                    // Use 'max' attribute to hint the limit to the browser, though validation is in handleFileChange
                                    {...(!editingProduct && { max: MAX_IMAGES })}
                                />
                            ) : (
                                <p className="text-sm text-red-500 font-medium mt-1">You have reached the maximum limit of {MAX_IMAGES} images for this product.</p>
                            )}

                        </div>

                        {(newFiles.length > 0 || (editingProduct && editingProduct.image_urls.length > 0)) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {editingProduct?.image_urls.map((url, index) => (
                                    <div key={url} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-300">
                                        <img src={url} alt={`Product image ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImageFromEdit(url)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-700 transition-colors"
                                            title="Remove image"
                                            disabled={loading || uploadingImages}
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
                                {editingProduct ? 'Save Changes' : 'Add Product'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="py-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Products ({products.length})</h3>
                        <button
                            onClick={() => resetAndShowForm()}
                            className={`flex gap-1 items-center justify-center bg-gradient-to-r ${currentTheme.buttonGradient} hover:shadow-lg text-white px-8 py-2.5 rounded-md shadow-md transition-all duration-200 font-medium`}
                        >
                            <Plus className="w-4 h-4" /> Add New Product
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No products added yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
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
                                        <p className="text-gray-700">₦{product.product_price}</p>
                                        <p className="text-sm text-gray-600 flex items-center justify-center gap-1 mt-1">
                                            {product.is_available ? (
                                                <><CheckCircle className="w-4 h-4 text-green-500" /> Available</>
                                            ) : (
                                                <><AlertCircle className="w-4 h-4 text-red-500" /> Not Available</>
                                            )}
                                        </p>
                                        {/* --- DISPLAY HOSTEL STATUS --- */}
                                        {product.is_hostel_product && isHostelMerchant && (<p className="text-xs text-gray-500 flex items-center justify-center gap-1">

                                            <span className='font-medium text-purple-600'>[Hostel Product]</span>

                                        </p>)}

                                        <div className="flex gap-2 mt-4 w-full">
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

                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}