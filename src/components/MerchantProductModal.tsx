import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Image, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { Product, supabase, UniqueVisitor } from '../lib/supabase';
import { generateAndEmbedSingleProduct } from '../lib/generateEmbedding';
import { deleteImageFromSupabase, uploadImageToSupabase } from '../lib/databaseServices';

interface MerchantProductModalProps {
    actual_merchant_id?: string;
    merchantId: string;
    merchantName: string;
    onClose: () => void;
}

// Define the maximum image limit
const MAX_IMAGES = 5;

export default function MerchantProductModal({ actual_merchant_id, merchantId, merchantName, onClose }: MerchantProductModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddProductForm, setShowAddProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isHostelMerchant, setIsHostelMerchant] = useState(false);
    const [merchantDetails, setMerchantDetails] = useState<UniqueVisitor | null>(null);
    // Form states for adding/editing a product
    const [productDescription, setProductDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [isHostelProduct, setIsHostelProduct] = useState(false);
    const [newFiles, setNewFiles] = useState<File[]>([]); // New state for files to upload
    const [uploadingImages, setUploadingImages] = useState(false);

    useEffect(() => {
        fetchMerchant();
        fetchProducts();
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
                .select('*')
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            // setIsHostelMerchant(data[0]?.unique_visitor?.is_hostel_merchant || false);
            setProducts(data || []);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    // 💡 ADJUSTED FUNCTION: handleFileChange
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);

            // Check for file count limit (New Logic)
            const currentFilesCount = editingProduct?.image_urls.length || 0;
            const totalFilesAfterUpload = currentFilesCount + filesArray.length;

            if (totalFilesAfterUpload > MAX_IMAGES) {
                setError(`You can only upload a maximum of ${MAX_IMAGES} images. You currently have ${currentFilesCount} image(s) and are trying to upload ${filesArray.length} new image(s).`);
                // Clear the file input for a better UX, though the state setNewFiles won't be called.
                e.target.value = '';
                setNewFiles([]); // Ensure no files are mistakenly queued
                return;
            }

            // Check for file size and type limits (Existing Logic)
            const invalidFiles = filesArray.filter(file => file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/'));
            if (invalidFiles.length > 0) {
                setError('Some files were invalid. Max 5MB per file, and only image types are allowed.');
                e.target.value = '';
                setNewFiles([]); // Ensure no files are mistakenly queued
                return;
            }

            // If all checks pass, set the files
            setNewFiles(filesArray);
            setError(null);
        }
    };
    // 💡 END ADJUSTED FUNCTION

    const resetForm = () => {
        setProductDescription('');
        setProductPrice('');
        setIsAvailable(true);
        setNewFiles([]);
        setEditingProduct(null);
        setIsHostelProduct(false);
        setError(null);
        setShowAddProductForm(false);
    };
    const resetAndShowForm = () => {
        setProductDescription('');
        setProductPrice('');
        setIsAvailable(true);
        setNewFiles([]);
        setEditingProduct(null);
        setIsHostelProduct(false);
        setError(null);
        // setShowAddProductForm(false); // Original code commented out this line
    };

    // Modify handleAddProduct
    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productDescription || !productPrice) {
            setError('Product description and price are required.');
            return;
        }

        // Add an immediate check for a new product submission
        if (newFiles.length > MAX_IMAGES) {
            setError(`You can only upload a maximum of ${MAX_IMAGES} images.`);
            return;
        }


        setLoading(true);
        setError(null);

        try {
            // 1. Generate the embedding
            const { embedding, enhancedDescription } = await generateAndEmbedSingleProduct(productDescription);

            // 2. Upload images
            setUploadingImages(true);
            const imageUrls = newFiles.length > 0 ? await Promise.all(newFiles.map(file => uploadImageToSupabase(file, merchantId, 'product-images', 'product-images'))) : [];
            setUploadingImages(false);

            // 3. Insert the new product with the embedding
            const { error } = await supabase
                .from('merchant_products')
                .insert({
                    actual_merchant_id: actual_merchant_id,
                    merchant_id: merchantId,
                    product_description: productDescription,
                    product_price: productPrice,
                    is_available: isAvailable,
                    is_hostel_product: isHostelProduct,
                    image_urls: imageUrls,
                    embedding: embedding, // Store the embedding
                    search_description: enhancedDescription
                });

            if (error) {
                throw error;
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

    // Modify handleEditProduct
    const handleEditProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct || !productDescription || !productPrice) {
            setError('Product description and price are required.');
            return;
        }

        // Add an immediate check for the total image count during edit
        const totalImages = (editingProduct?.image_urls.length || 0) + newFiles.length;
        if (totalImages > MAX_IMAGES) {
            setError(`You can only have a total of ${MAX_IMAGES} images. You currently have ${editingProduct.image_urls.length} and are trying to add ${newFiles.length} new images.`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Generate a new embedding if the description changed
            let newEmbedding = editingProduct.embedding;
            let newSearchDescription = editingProduct.search_description;


            if (productDescription !== editingProduct.product_description) {
                const { embedding, enhancedDescription } = await generateAndEmbedSingleProduct(productDescription);
                newEmbedding = embedding;
                newSearchDescription = enhancedDescription;
            }

            // 2. Upload new images
            setUploadingImages(true);
            const newUrls = newFiles.length > 0 ? await Promise.all(newFiles.map(file => uploadImageToSupabase(file, merchantId, 'product-images', 'product-images'))) : [];
            setUploadingImages(false);

            const updatedImageUrls = [...(editingProduct?.image_urls || []), ...newUrls];

            // 3. Update the product record with the new embedding and image URLs
            const { error } = await supabase
                .from('merchant_products')
                .update({
                    product_description: productDescription,
                    product_price: productPrice,
                    is_available: isAvailable,
                    is_hostel_product: isHostelProduct,
                    image_urls: updatedImageUrls,
                    embedding: newEmbedding,
                    search_description: newSearchDescription
                })
                .eq('id', editingProduct.id);

            if (error) {
                throw error;
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
    const handleDeleteProduct = async (productId: string, imageUrls: string[]) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        setLoading(true);
        setError(null);

        try {
            // Use the reusable delete function
            await Promise.all(imageUrls.map(url => deleteImageFromSupabase(url, 'product-images')));

            const { error } = await supabase
                .from('merchant_products')
                .delete()
                .eq('id', productId);

            if (error) {
                throw error;
            }
            fetchProducts();
        } catch (err) {
            console.error('Error deleting product:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete product');
        } finally {
            setLoading(false);
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
            // On failure, revert the UI state
            setEditingProduct(editingProduct);
            fetchProducts();
        }
    };

    // 💡 MODIFIED RENDER LOGIC FOR INPUT FIELD
    const isImageUploadDisabled = editingProduct
        ? (editingProduct.image_urls.length + newFiles.length) >= MAX_IMAGES
        : newFiles.length >= MAX_IMAGES;

    const currentImageCount = editingProduct ? (editingProduct.image_urls.length + newFiles.length) : newFiles.length;
    const remainingUploads = MAX_IMAGES - currentImageCount;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-md sm:text-xl font-semibold text-gray-800">Manage Products for {merchantName}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {/* Add/Edit Product Form */}
                {(showAddProductForm) && (
                    <div className="p-4 border-b bg-gray-50">
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
                            {isHostelMerchant && (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
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
                                </div>)
                            }
                            {/* ----------- END TOGGLE SWITCH FOR is_hostel_product ----------------------------------------- */}


                            {/* Image Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Images 📸
                                    {editingProduct && <span className="text-xs text-gray-500 ml-2">(Current images shown below. Add more, or remove existing ones.)</span>}
                                </label>
                                {/* 💡 ADDED HINT MESSAGE */}
                                <p className={`text-xs ${isImageUploadDisabled ? 'text-red-500' : 'text-gray-500'} mb-1`}>
                                    Maximum of {MAX_IMAGES} images per product. (Can upload {remainingUploads} more)
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                    // 💡 MODIFIED DISABLED STATE
                                    disabled={uploadingImages || loading || isImageUploadDisabled}
                                    key={editingProduct?.id} // Add key to force re-render/reset the file input on product change
                                />
                            </div>
                            {/* Image previews and management */}
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
                                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
                                    disabled={loading || uploadingImages}
                                >
                                    {(loading || uploadingImages) && <Loader className="w-4 h-4 animate-spin" />}
                                    {editingProduct ? 'Save Changes' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Product List */}
                {(!showAddProductForm) && (<div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Products ({products.length})</h3>
                        {!showAddProductForm && (
                            <button
                                onClick={() => { setShowAddProductForm(true); resetAndShowForm(); }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add New Product
                            </button>
                        )}
                    </div>

                    {loading && !showAddProductForm ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No products added yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {products.map((product) => (
                                <div key={product.id} className="border border-gray-200 rounded-lg p-4 flex items-start gap-4">
                                    <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                                        {product.image_urls && product.image_urls.length > 0 ? (
                                            <img src={product.image_urls[0]} alt={product.product_description} className="w-full h-full object-cover" />
                                        ) : (
                                            <Image className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-semibold text-gray-900">{product.product_description}</h4>
                                        <p className="text-gray-700">₦{product.product_price}</p>
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
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
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => startEditProduct(product)}
                                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Product"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id, product.image_urls)}
                                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Product"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>)}
            </div>
        </div>
    );
}