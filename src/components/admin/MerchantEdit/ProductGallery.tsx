import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2, Tag, Loader, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface ProductGalleryProps {
  merchantId: string;
}

interface ProductImage {
  id: string;
  merchant_id: string;
  image_url: string;
  label?: string;
  created_at: string;
}

export default function ProductGallery({ merchantId }: ProductGalleryProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageLabel, setImageLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, [merchantId]);

  const fetchImages = async () => {
    setLoading(true);
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
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setShowLabelInput(true);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setError('');
    
    try {
      // Check if bucket exists first
      // 1. Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${merchantId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `merchant_products/${fileName}`;
      
      // Try both bucket names
      let uploadError;
      let bucketId = 'product-images';
      
      try {
        const result = await supabase.storage
          .from(bucketId)
          .upload(filePath, selectedFile);
          
        uploadError = result.error;
      } catch (error) {
        console.error('Error with first bucket attempt:', error);
        // Try alternative bucket name
        bucketId = 'product_images';
        try {
          const result = await supabase.storage
            .from(bucketId)
            .upload(filePath, selectedFile);
            
          uploadError = result.error;
        } catch (fallbackError) {
          console.error('Error with fallback bucket attempt:', fallbackError);
          throw new Error('Storage bucket for product images not found. Please contact administrator to set up storage.');
        }
      }
      
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketId)
        .getPublicUrl(filePath);
        
      const publicUrl = urlData.publicUrl;
      
      // 3. Save record in database
      const { data, error: dbError } = await supabase
        .from('merchant_product_images')
        .insert({
          merchant_id: merchantId,
          image_url: publicUrl,
          label: imageLabel || null
        })
        .select()
        .single();
        
      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      // 4. Update local state
      setImages([data, ...images]);
      
      // 5. Reset form
      setSelectedFile(null);
      setImageLabel('');
      toast.success('Image uploaded successfully!');
      setShowLabelInput(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
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
        throw dbError;
      }
      
      // 2. Try to delete from storage (extract file path from URL)
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Determine which bucket to use
      const { data: buckets } = await supabase.storage.listBuckets();
      const productImagesBucket = buckets?.find(bucket => 
        bucket.id === 'product-images' || bucket.id === 'product_images'
      );
      
      if (productImagesBucket) {
        const bucketId = productImagesBucket.id;
        const filePath = `merchant_products/${fileName}`;
      
        try {
          await supabase.storage
            .from(bucketId)
            .remove([filePath]);
        } catch (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue even if storage deletion fails
        }
      }
      
      // 3. Update local state
      setImages(images.filter(img => img.id !== imageId));
      
      toast.success('Image deleted successfully');
      
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
      toast.error('Failed to delete image');
    }
  };

  const handleUpdateLabel = async (imageId: string, newLabel: string) => {
    try {
      const { error } = await supabase
        .from('merchant_product_images')
        .update({ label: newLabel || null })
        .eq('id', imageId);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setImages(images.map(img => 
        img.id === imageId ? { ...img, label: newLabel } : img
      ));
      toast.success('Label updated successfully');
      
    } catch (error) {
      console.error('Error updating label:', error);
      setError('Failed to update label');
      toast.error('Failed to update label');
    }
  };

  return (
    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-4 h-4 text-purple-600" />
        <h4 className="text-sm font-medium text-purple-800">Product Gallery</h4>
        <div className="ml-auto text-xs text-purple-600">
          {images.length} image{images.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        {!showLabelInput ? (
          <div 
            className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:bg-purple-100 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <Plus className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-purple-700 font-medium">Click to upload product image</p>
            <p className="text-xs text-purple-600 mt-1">JPG, PNG, GIF up to 5MB</p>
          </div>
        ) : (
          <div className="border-2 border-purple-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                {selectedFile && (
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500">
                  {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setShowLabelInput(false);
                  setImageLabel('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Image Label (Optional)
              </label>
              <input
                type="text"
                value={imageLabel}
                onChange={(e) => setImageLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="e.g., Product Front View"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
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
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Image Gallery */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 text-purple-500 animate-spin" />
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white">
              <img 
                src={image.image_url} 
                alt={image.label || 'Product image'} 
                className="w-full h-32 object-cover"
              />
              
              <div className="p-2">
                <input
                  type="text"
                  value={image.label || ''}
                  onChange={(e) => handleUpdateLabel(image.id, e.target.value)}
                  placeholder="Add label"
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <button
                onClick={() => handleDeleteImage(image.id, image.image_url)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No product images yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload images to showcase products</p>
        </div>
      )}
    </div>
  );
}