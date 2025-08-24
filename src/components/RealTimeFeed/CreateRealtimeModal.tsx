import React, { useState, useRef } from 'react';
import { X, Camera, Edit3, Upload, Palette, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createRealTimeProduct } from '../../lib/realTimeService';
import { uploadRealTimeImage, compressImage } from '../../lib/realTimeStorage';
import { isAuthenticated } from '../../hooks/useTracking';

interface CreateRealtimeModalProps {
  mode: 'text' | 'image';
  onClose: () => void;
}

export default function CreateRealtimeModal({ mode, onClose }: CreateRealtimeModalProps) {
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FF6B35');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRESET_COLORS = [
    '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (mode === 'image' && !imageFile) {
      toast.error('Please select an image');
      return;
    }

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      toast.error('Please log in to create real-time products');
      return;
    }

    setIsSubmitting(true);
    try {
      let mediaUrl = '';
      
      if (mode === 'image' && imageFile) {
        // Generate a temporary product ID for file naming
        const tempProductId = `temp_${Date.now()}`;
        
        // Compress and upload image
        const compressedImage = await compressImage(imageFile);
        const uploadResult = await uploadRealTimeImage(compressedImage, tempProductId);
        
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        
        mediaUrl = uploadResult.url;
      } else {
        // For text-only posts, use a placeholder image
        mediaUrl = 'https://via.placeholder.com/400x400/FF6B35/FFFFFF?text=Text+Post';
      }

      const productData = {
        title: title.trim(),
        media_url: mediaUrl,
        media_type: mode === 'image' ? 'image' : 'image',
        text_color: mode === 'text' ? selectedColor : undefined,
        is_text_post: mode === 'text',
        price: 100
      };

      const result = await createRealTimeProduct(productData);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Real-time product created successfully!');
      onClose();
      
      // Reset form
      setTitle('');
      setImageFile(null);
      setImagePreview(null);
      
    } catch (error) {
      console.error('Error creating real-time product:', error);
      toast.error('Failed to create real-time product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      {/* Modal Content - Slides up from bottom */}
      <div className="w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {mode === 'image' ? (
              <Camera className="w-6 h-6 text-green-500" />
            ) : (
              <Edit3 className="w-6 h-6 text-gray-600" />
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'image' ? 'Create Image Post' : 'Create Text Post'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          {mode === 'image' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Upload Image
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Click to select or drag and drop
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        Select Image
                      </button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === 'image' ? "What's in this image?" : "What's on your mind?"}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              rows={3}
              maxLength={200}
              disabled={isSubmitting}
            />
            <div className="text-xs text-gray-500 text-right">
              {title.length}/200
            </div>
          </div>

          {/* Color Selection for Text Posts */}
          {mode === 'text' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Background Color
              </label>
              
              {/* Preset Colors */}
              <div className="flex items-center gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-[20px] h-[20px] lg:w-[32px] lg:h-[32px] rounded-full border-2 transition-all ${
                      selectedColor === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Color: ${color}`}
                  />
                ))}
                
                {/* Custom Color Picker */}
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-105 transition-all flex items-center justify-center bg-gradient-to-r from-purple-400 to-pink-400"
                  title="Custom color"
                >
                  <Palette className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* Custom Color Input */}
              {showColorPicker && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    placeholder="#FF6B35"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || (mode === 'image' && !imageFile)}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Create Post
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 