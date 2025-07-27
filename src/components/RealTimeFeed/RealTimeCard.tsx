import React, { useState, useEffect } from 'react';
import { Play, Eye, MessageCircle, Clock, MapPin, Tag } from 'lucide-react';
import { RealTimeProduct, formatRelativeTime, getTimeRemaining } from '../../lib/realTimeService';

interface RealTimeCardProps {
  product: RealTimeProduct;
  onClick: () => void;
}

export default function RealTimeCard({ product, onClick }: RealTimeCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(product.expires_at));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Update time remaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(product.expires_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [product.expires_at]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="group relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Media Container */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {!imageError ? (
          <>
            {/* Image/Video */}
            {product.media_type === 'video' ? (
              <div className="relative w-full h-full">
                <img
                  src={product.media_url}
                  alt={product.title}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                
                {/* Video Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                    <Play className="w-6 h-6 text-gray-800 fill-current" />
                  </div>
                </div>

                {/* Duration Badge */}
                {product.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(product.duration)}
                  </div>
                )}
              </div>
            ) : (
              <img
                src={product.media_url}
                alt={product.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}

            {/* Loading State */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-gray-400 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-xs">Image not available</p>
            </div>
          </div>
        )}

        {/* Expiration Badge */}
        {!timeRemaining.isExpired && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              {timeRemaining.hours}h {timeRemaining.minutes}m
            </span>
          </div>
        )}

        {/* Featured Badge */}
        {product.is_featured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
            ⭐ Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
          {product.title}
        </h3>

        {/* Price */}
        {product.price && (
          <div className="text-lg font-bold text-orange-600 mb-2">
            {formatPrice(product.price)}
          </div>
        )}

        {/* Location */}
        {product.location && (
          <div className="flex items-center space-x-1 text-gray-500 text-xs mb-2">
            <MapPin className="w-3 h-3" />
            <span>{product.location}</span>
          </div>
        )}

        {/* Category */}
        {product.category && (
          <div className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mb-3">
            {product.category}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{product.views_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span>{product.contact_clicks}</span>
            </div>
          </div>
          
          {/* Time Posted */}
          <div className="text-xs">
            {formatRelativeTime(product.created_at)}
          </div>
        </div>

        {/* Merchant Info */}
        {product.merchant && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {product.merchant.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {product.merchant.full_name}
                </p>
                {product.merchant.average_rating && (
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500 text-xs">★</span>
                    <span className="text-xs text-gray-500">
                      {product.merchant.average_rating.toFixed(1)} ({product.merchant.total_ratings})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-white bg-opacity-90 rounded-full p-3">
          <Play className="w-6 h-6 text-gray-800" />
        </div>
      </div>
    </div>
  );
} 