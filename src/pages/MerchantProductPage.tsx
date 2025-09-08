import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Loader, CheckCircle, AlertCircle, Image, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Add this new async function inside your component, before the return statement.
const getProductEmbedding = async (description: string) => {
    try {
        const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
        const result = await embeddingModel.embedContent(description);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate product embedding.');
    }
};

// Reusable function to handle image upload, inspired by ProductGallery
const uploadImageToSupabase = async (file, merchantId) => {
    const fileExt = file.name.split('.').pop();
    // Ensure unique file name to prevent conflicts
    const fileName = `${merchantId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

    if (uploadError) {
        throw new Error(`Error uploading image: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

    return publicUrl;
};

// Reusable function to delete image from Supabase Storage
const deleteImageFromSupabase = async (imageUrl) => {
    const urlParts = imageUrl.split('/');
    // Extract the filename with its folder from the public URL
    const fileName = urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');

    if (fileName) {
        const { error: storageError } = await supabase.storage
            .from('product-images')
            .remove([fileName]);

        if (storageError) {
            console.warn('Error deleting image from storage:', storageError);
            // We can continue as the database record might be the primary source of truth
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
    embedding: number[]; // New field for the embedding vector
}

export default function MerchantProductPage() {
    const { merchantId, merchantName } = useParams<{ merchantId: string, merchantName: string }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddProductForm, setShowAddProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form states for adding/editing a product
    const [productDescription, setProductDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [newFiles, setNewFiles] = useState<File[]>([]); // New state for files to upload
    const [uploadingImages, setUploadingImages] = useState(false);

    useEffect(() => {
        if (merchantId) {
            fetchProducts();
        }
    }, [merchantId]);

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

    const startEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductDescription(product.product_description);
        setProductPrice(product.product_price);
        setIsAvailable(product.is_available);
        setNewFiles([]);
        setShowAddProductForm(true);
    };

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
        setShowAddProductForm(true);
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productDescription || !productPrice) {
            setError('Product description and price are required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const embedding = await getProductEmbedding(productDescription);
            setUploadingImages(true);
            const imageUrls = newFiles.length > 0 ? await Promise.all(newFiles.map(file => uploadImageToSupabase(file, merchantId))) : [];
            setUploadingImages(false);

            const { error } = await supabase
                .from('merchant_products')
                .insert({
                    merchant_id: merchantId,
                    product_description: productDescription,
                    product_price: productPrice,
                    is_available: isAvailable,
                    image_urls: imageUrls,
                    embedding: embedding
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
            if (productDescription !== editingProduct.product_description) {
                newEmbedding = await getProductEmbedding(productDescription);
            }

            setUploadingImages(true);
            const newUrls = newFiles.length > 0 ? await Promise.all(newFiles.map(file => uploadImageToSupabase(file, merchantId))) : [];
            setUploadingImages(false);

            const updatedImageUrls = [...(editingProduct?.image_urls || []), ...newUrls];

            const { error } = await supabase
                .from('merchant_products')
                .update({
                    product_description: productDescription,
                    product_price: productPrice,
                    is_available: isAvailable,
                    image_urls: updatedImageUrls,
                    embedding: newEmbedding
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

    const handleToggleAvailability = async (product: Product) => {
        const newAvailability = !product.is_available;
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('merchant_products')
                .update({ is_available: newAvailability })
                .eq('id', product.id);

            if (error) {
                throw error;
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
            await deleteImageFromSupabase(imageUrlToRemove);
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

    return (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto my-8 p-6">
            <div className="flex justify-between items-center pb-4 border-b">
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
                <div className="py-4 border-b bg-gray-50">
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Images
                                {editingProduct && <span className="text-xs text-gray-500 ml-2">(Current images shown below. Add more, or remove existing ones.)</span>}
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
                                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
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
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
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
                                <div key={product.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center text-center">
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