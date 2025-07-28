import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadRealTimeImage(
  file: File,
  productId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { url: '', path: '', error: 'File must be an image' };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { url: '', path: '', error: 'Image size must be less than 5MB' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/image.${fileExt}`;
    const filePath = `real-time-products/images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Unexpected error uploading image:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Upload a video file to Supabase Storage
 */
export async function uploadRealTimeVideo(
  file: File,
  productId: string
): Promise<UploadResult & { metadata?: VideoMetadata }> {
  try {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      return { url: '', path: '', error: 'File must be a video' };
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return { url: '', path: '', error: 'Video size must be less than 50MB' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/video.${fileExt}`;
    const filePath = `real-time-products/videos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading video:', error);
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    // Get video metadata
    const metadata = await getVideoMetadata(file);

    return {
      url: urlData.publicUrl,
      path: filePath,
      metadata
    };
  } catch (error) {
    console.error('Unexpected error uploading video:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get video metadata (duration, dimensions)
 */
async function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        duration: Math.round(video.duration),
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    video.onerror = () => {
      // Fallback if metadata can't be loaded
      resolve({
        duration: 0,
        width: 0,
        height: 0
      });
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteRealTimeFile(filePath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting file:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate a thumbnail from a video file
 */
export async function generateVideoThumbnail(
  videoFile: File,
  productId: string
): Promise<UploadResult> {
  try {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = () => {
        // Set canvas size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx?.drawImage(video, 0, 0);

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve({ url: '', path: '', error: 'Failed to generate thumbnail' });
            return;
          }

          // Create file from blob
          const thumbnailFile = new File([blob], 'thumbnail.jpg', {
            type: 'image/jpeg'
          });

          // Upload thumbnail
          const fileName = `${productId}/thumbnail.jpg`;
          const filePath = `real-time-products/videos/${fileName}`;

          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, thumbnailFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error('Error uploading thumbnail:', error);
            resolve({ url: '', path: '', error: error.message });
            return;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          resolve({
            url: urlData.publicUrl,
            path: filePath
          });
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => {
        resolve({ url: '', path: '', error: 'Failed to load video for thumbnail generation' });
      };

      video.src = URL.createObjectURL(videoFile);
    });
  } catch (error) {
    console.error('Unexpected error generating thumbnail:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Validate file before upload
 */
export function validateRealTimeFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file size
  const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSize / (1024 * 1024)}MB`
    };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not supported. Please use JPEG, PNG, WebP, MP4, WebM, or OGG files.'
    };
  }

  return { isValid: true };
}

/**
 * Compress image before upload
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback to original file
        }
      }, file.type, quality);
    };

    img.src = URL.createObjectURL(file);
  });
} 