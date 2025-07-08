import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Image, X, Plus, Loader } from 'lucide-react';

interface ProductGalleryProps {
  merchantId: string;
  editable?: boolean;
  className?: string;
}

interface ProductImage {
  id: string;
  image_url: string;
  label?: string;
  created_at: string;
}

export default function ProductGallery({ merchantId, editable = false, className = '' }: ProductGalleryProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newImageLabel, setNewImageLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchImages();
  }, [merchantId]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('merchant_product_images')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setImages(data || []);
    } catch (err) {
      console.error('Error fetching product images:', err);
      setError('Failed to load product images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      setSelectedFile(file);
      setShowLabelInput(true);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // 1. Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${merchantId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, selectedFile);
      
      if (uploadError) {
        throw new Error(`Error uploading image: ${uploadError.message}`);
      }
      
      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);
      
      // 3. Store metadata in database
      const { error: dbError } = await supabase
        .from('merchant_product_images')
        .insert({
          merchant_id: merchantId,
          image_url: publicUrl,
          label: newImageLabel || null
        });
      
      if (dbError) {
        throw new Error(`Error storing image metadata: ${dbError.message}`);
      }
      
      // 4. Refresh images
      fetchImages();
      
      // 5. Reset form
      setSelectedFile(null);
      setNewImageLabel('');
      setShowLabelInput(false);
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('merchant_product_images')
        .delete()
        .eq('id', imageId);
      
      if (dbError) {
        throw new Error(`Error deleting image metadata: ${dbError.message}`);
      }
      
      // 2. Delete from storage (extract file path from URL)
      // This is a bit tricky as we need to extract the file name from the URL
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('product_images')
          .remove([fileName]);
        
        if (storageError) {
          console.warn('Error deleting image file:', storageError);
          // Continue anyway as the metadata is deleted
        }
      }
      
      // 3. Refresh images
      fetchImages();
      
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setNewImageLabel('');
    setShowLabelInput(false);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error && images.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">{error}</div>
        <button 
          onClick={fetchImages}
          className="text-orange-600 hover:text-orange-700 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div 
              key={image.id} 
              className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square"
            >
              <img 
                src={image.image_url} 
                alt={image.label || 'Product image'} 
                className="w-full h-full object-cover"
              />
              
              {image.label && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm truncate">
                  {image.label}
                </div>
              )}
              
              {editable && (
                <button
                  onClick={() => handleDeleteImage(image.id, image.image_url)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No product images available</p>
        </div>
      )}
      
      {/* Upload Controls (only shown when editable) */}
      {editable && (
        <div className="mt-4">
          {!showLabelInput ? (
            <div className="flex justify-center">
              <label className="cursor-pointer bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />
                Add Product Image
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Label (optional)
                </label>
                <input
                  type="text"
                  value={newImageLabel}
                  onChange={(e) => setNewImageLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Blue Tote Bag"
                  disabled={uploading}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancelUpload}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Upload Image
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}