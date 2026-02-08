import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Product, supabase, UniqueVisitor } from '../lib/supabase';
import { deleteImageFromSupabase, uploadImageToSupabase } from '../lib/databaseServices';
import { categorizePost, extractProductKeywordsFromDescription } from '../lib/gemini';
import { AppDrawer } from './ui/Drawer';
import { Button } from './ui/Button';

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

    const [_, setMerchantDetails] = useState<UniqueVisitor | null>(null);
    // Form states for adding/editing a product
    const [productDescription, setProductDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
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
        setError(null);
        setShowAddProductForm(false);
    };
    const resetAndShowForm = () => {
        setProductDescription('');
        setProductPrice('');
        setIsAvailable(true);
        setNewFiles([]);
        setEditingProduct(null);
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
            const query_category = await categorizePost(productDescription);
            const query_search_words = await extractProductKeywordsFromDescription(productDescription);


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
                    image_urls: imageUrls,
                    product_category: query_category,
                    search_words: query_search_words
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
            let query_category = editingProduct.product_category;
            let query_search_words = editingProduct.search_words;

            if (productDescription !== editingProduct.product_description) {
                query_category = await categorizePost(editingProduct.product_description);
                query_search_words = await extractProductKeywordsFromDescription(editingProduct.product_description);
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
                    image_urls: updatedImageUrls,
                    product_category: query_category,
                    search_words: query_search_words
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

    const isImageUploadDisabled = editingProduct
        ? (editingProduct.image_urls.length + newFiles.length) >= MAX_IMAGES
        : newFiles.length >= MAX_IMAGES;

    const currentImageCount = editingProduct ? (editingProduct.image_urls.length + newFiles.length) : newFiles.length;



    return (
        <AppDrawer
            open={true} // Controlled by parent rendering this component conditionally, or we can add open prop if changed
            onOpenChange={(open) => !open && onClose()}
            title={showAddProductForm ? (editingProduct ? 'Edit Product' : 'New Product') : `Manage ${merchantName}`}
        >
            <div className="flex flex-col h-full bg-white dark:bg-gray-900 pb-safe">

                {/* Error Display */}
                {error && (
                    <div className="mx-4 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm" role="alert">
                        <p className="font-bold mb-1">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {/* Add/Edit Product Form */}
                {showAddProductForm ? (
                    <div className="flex-1 overflow-y-auto p-4">
                        <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Description</label>
                                <textarea
                                    id="description"
                                    value={productDescription}
                                    onChange={(e) => setProductDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                                    placeholder="Describe your product..."
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="price" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Price (₦)</label>
                                <input
                                    type="number"
                                    id="price"
                                    value={productPrice}
                                    onChange={(e) => setProductPrice(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-mono"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <input
                                    id="isAvailable"
                                    type="checkbox"
                                    checked={isAvailable}
                                    onChange={(e) => setIsAvailable(e.target.checked)}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300 bg-white dark:bg-gray-700"
                                />
                                <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900 dark:text-white">Available for sale</label>
                            </div>

                            {/* Image Upload Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100">
                                        Images
                                    </label>
                                    <span className={`text-xs ${isImageUploadDisabled ? 'text-red-500' : 'text-gray-400'}`}>
                                        {currentImageCount}/{MAX_IMAGES}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {/* Current/New Images */}
                                    {editingProduct?.image_urls.map((url, index) => (
                                        <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group">
                                            <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImageFromEdit(url)}
                                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Icon icon="vuesax:linear:close-circle" width={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {newFiles.map((file, index) => (
                                        <div key={file.name + index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover opacity-80" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="bg-black/50 text-white text-[10px] px-1 rounded truncate max-w-[90%]">New</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Upload Button */}
                                    {!isImageUploadDisabled && (
                                        <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800/50">
                                            <Icon icon="vuesax:linear:add" className="text-gray-400" width={24} />
                                            <span className="text-xs text-gray-400 mt-1">Add</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                disabled={uploadingImages || loading}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <Button
                                    type="submit"
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg rounded-xl"
                                    disabled={loading || uploadingImages}
                                >
                                    {(loading || uploadingImages) && <Icon icon="vuesax:linear:refresh-2" className="w-5 h-5 animate-spin mr-2" />}
                                    {editingProduct ? 'Save Changes' : 'Add Product'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetForm}
                                    className="w-full text-gray-500"
                                    disabled={loading || uploadingImages}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* Product List */
                    <div className="flex-col h-full overflow-hidden flex">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 flex justify-between items-center">
                            <div className="text-sm text-gray-500">{products.length} Products</div>
                            <Button
                                onClick={() => { setShowAddProductForm(true); resetAndShowForm(); }}
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                            >
                                <Icon icon="vuesax:linear:add" width={16} className="mr-1" /> Add New
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                                        <Icon icon="vuesax:linear:gallery" className="w-8 h-8 text-orange-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No products yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xs">
                                        Start building your store by adding your first product.
                                    </p>
                                </div>
                            ) : (
                                products.map((product) => (
                                    <div key={product.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 flex gap-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                            {product.image_urls && product.image_urls.length > 0 ? (
                                                <img src={product.image_urls[0]} alt={product.product_description} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Icon icon="vuesax:linear:gallery" width={20} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{product.product_description}</h4>
                                                <p className="text-orange-500 font-mono font-bold text-sm">₦{product.product_price}</p>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${product.is_available ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {product.is_available ? 'In Stock' : 'Sold Out'}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEditProduct(product)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Icon icon="vuesax:linear:edit" width={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id, product.image_urls)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Icon icon="vuesax:linear:trash" width={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppDrawer>
    );
}