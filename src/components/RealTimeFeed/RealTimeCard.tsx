import { Clock, MapPin, Play } from 'lucide-react';
import { RealTimeProduct, formatRelativeTime, getTimeRemaining } from '../../lib/realTimeService';

interface RealTimeCardProps {
  product: RealTimeProduct;
  onClick?: () => void;
  className?: string;
}

export default function RealTimeCard({ product, onClick, className = '' }: RealTimeCardProps) {
  const timeRemaining = getTimeRemaining(product.expires_at);
  const isTextPost = product.is_text_post;
  const textColor = product.text_color || '#FF6B35';

  return (
    <div 
      className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${className}`}
      onClick={onClick}
    >
      {/* Media Container */}
      <div className="relative aspect-square overflow-hidden">
        {isTextPost ? (
          // Text Post - Full colored background
          <div 
            className="w-full h-full flex items-center justify-center p-6"
            style={{ backgroundColor: textColor }}
          >
            <div className="text-center text-white w-full h-full flex items-center justify-center">
              <h3 className={`font-bold ${
                product.title.length > 50 ? 'text-left' : 'text-center'
              }`}>
                {product.title}
              </h3>
            </div>
          </div>
        ) : (
          // Image/Video Post
          <>
            {product.media_type === 'video' ? (
              <div className="relative w-full h-full">
                <video
                  src={product.media_url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
              </div>
            ) : (
              <img
                src={product.media_url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            )}

            {/* Time Remaining Badge */}
            {!timeRemaining.isExpired && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeRemaining.hours}h {timeRemaining.minutes}m</span>
              </div>
            )}

            {/* Category Badge */}
            {product.category && product.category.trim() && (
              <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                {product.category}
              </div>
            )}
          </>
        )}
      </div>

      {/* Content - Only show for image/video posts */}
      {!isTextPost && (
        <div className="p-4">
          {/* Title and Price */}
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
              {product.title}
            </h3>
            {product.price && product.price > 0 && (
              <p className="text-orange-500 font-bold text-lg">
                ₦{product.price.toLocaleString()}
              </p>
            )}
          </div>

          {/* Description - Only show if exists */}
          {product.description && product.description.trim() && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Location - Only show if exists */}
          {product.location && product.location.trim() && (
            <div className="flex items-center space-x-1 text-gray-500 text-sm mb-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{product.location}</span>
            </div>
          )}

          {/* Category - Only show if exists */}
          {product.category && product.category.trim() && (
            <div className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full mb-2 font-medium">
              {product.category}
            </div>
          )}

          {/* Time Posted - SIMPLIFIED */}
          <div className="text-xs text-gray-400 text-right">
            {formatRelativeTime(product.created_at)}
          </div>
        </div>
      )}

      {/* Time Posted for Text Posts */}
      {isTextPost && (
        <div className="p-4">
          <div className="text-xs text-gray-400 text-right">
            {formatRelativeTime(product.created_at)}
          </div>
        </div>
      )}
    </div>
  );
} 