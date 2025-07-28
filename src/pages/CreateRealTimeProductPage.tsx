import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Camera, Video, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createRealTimeProduct } from '../lib/realTimeService';
import { uploadRealTimeImage, uploadRealTimeVideo, validateRealTimeFile, compressImage } from '../lib/realTimeStorage';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';

interface FormData {
  title: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  duration?: number;
}

export default function CreateRealTimeProductPage() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    media_url: '',
    media_type: 'image',
    duration: undefined
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateRealTimeFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Set media type
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    setFormData(prev => ({ ...prev, media_type: mediaType }));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      // Generate a temporary product ID for file naming
      const tempProductId = `temp_${Date.now()}`;
      
      let uploadResult;
      if (formData.media_type === 'video') {
        uploadResult = await uploadRealTimeVideo(selectedFile, tempProductId);
      } else {
        // Compress image before upload
        const compressedFile = await compressImage(selectedFile);
        uploadResult = await uploadRealTimeImage(compressedFile, tempProductId);
      }

      if (uploadResult.error) {
        toast.error(uploadResult.error);
        return;
      }

      setFormData(prev => ({ 
        ...prev, 
        media_url: uploadResult.url,
        duration: (uploadResult as any).metadata?.duration
      }));
      
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.media_url) {
      toast.error('Please upload a media file');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      // Create product with only essential fields
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        media_url: formData.media_url,
        media_type: formData.media_type,
        duration: formData.duration
      };

      const result = await createRealTimeProduct(productData);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Real-time product created successfully!');
      navigate('/real-time');
    } catch (error) {
      console.error('Error creating real-time product:', error);
      toast.error('Failed to create real-time product');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, media_url: '', duration: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="min-h-screen py-8 transition-colors duration-300"
      style={{ backgroundColor: currentTheme.background }}
    >
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/real-time')}
              className="p-2 rounded-full transition-colors"
              style={{ 
                backgroundColor: currentTheme.primary + '10',
                color: currentTheme.primary 
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: currentTheme.text }}
              >
                Create Real-time Product
              </h1>
              <p 
                className="text-sm"
                style={{ color: currentTheme.textSecondary }}
              >
                Your product will be visible for 24 hours
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className="rounded-2xl shadow-xl border p-6 transition-colors duration-300"
          style={{ 
            backgroundColor: currentTheme.surface,
            borderColor: currentTheme.textSecondary + '20'
          }}
        >
          {/* Media Upload */}
          <div className="mb-6">
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: currentTheme.text }}
            >
              Product Media *
            </label>
            
            {!previewUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Upload Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      <span>Upload Video</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Supported: JPEG, PNG, WebP, MP4, WebM, OGG (Max: 5MB images, 50MB videos)
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {formData.media_type === 'video' ? (
                  <video
                    src={previewUrl}
                    className="w-full h-64 object-cover rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {selectedFile && !formData.media_url && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
              </button>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter product title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your product in detail..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                maxLength={500}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={false}
              className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              style={{ 
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                color: 'white'
              }}
            >
              <Clock className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Real-time Product'}</span>
            </button>
            <p 
              className="text-xs text-center mt-2"
              style={{ color: currentTheme.textSecondary }}
            >
              Your product will be visible for 24 hours and then automatically expire
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 