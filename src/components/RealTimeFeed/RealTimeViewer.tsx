import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, MessageCircle, Phone, Clock, MapPin, Tag, Share2 } from 'lucide-react';
import { RealTimeProduct, trackRealTimeProductContact, formatRelativeTime, getTimeRemaining } from '../../lib/realTimeService';
import { toast } from 'sonner';

interface RealTimeViewerProps {
  product: RealTimeProduct;
  onClose: () => void;
}

export default function RealTimeViewer({ product, onClose }: RealTimeViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(product.expires_at));
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update time remaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(product.expires_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [product.expires_at]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = (parseFloat(e.target.value) / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleContact = async (method: 'whatsapp' | 'call' | 'message') => {
    try {
      await trackRealTimeProductContact(product.id, method);
      
      let url = '';
      const message = `Hi! I'm interested in your product: ${product.title}`;
      
      switch (method) {
        case 'whatsapp':
          const phone = product.contact_phone || product.merchant?.phone_number;
          if (phone) {
            url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
          }
          break;
        case 'call':
          const callPhone = product.contact_phone || product.merchant?.phone_number;
          if (callPhone) {
            url = `tel:${callPhone}`;
          }
          break;
        case 'message':
          // For now, just show a toast
          toast.success('Contact method not implemented yet');
          return;
      }
      
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Contact information not available');
      }
    } catch (error) {
      console.error('Error tracking contact:', error);
      toast.error('Failed to track contact');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Check out this product: ${product.title}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="relative w-full h-full max-w-md mx-auto">
        {/* Media Container */}
        <div className="relative w-full h-full bg-black">
          {product.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={product.media_url}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              muted={isMuted}
              loop
            />
          ) : (
            <img
              src={product.media_url}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          )}

          {/* Video Controls Overlay */}
          {product.media_type === 'video' && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(currentTime / duration) * 100 || 0}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-white text-xs mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="bg-white bg-opacity-20 text-white p-3 rounded-full hover:bg-opacity-30 transition-all"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button
                  onClick={handleMuteToggle}
                  className="bg-white bg-opacity-20 text-white p-3 rounded-full hover:bg-opacity-30 transition-all"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6">
          {/* Title and Price */}
          <div className="mb-4">
            <h2 className="text-white text-xl font-bold mb-2">{product.title}</h2>
            {product.price && (
              <div className="text-orange-400 text-lg font-bold mb-2">
                {formatPrice(product.price)}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2 mb-4">
            {product.location && (
              <div className="flex items-center space-x-2 text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{product.location}</span>
              </div>
            )}
            {product.category && (
              <div className="flex items-center space-x-2 text-white/80">
                <Tag className="w-4 h-4" />
                <span className="text-sm">{product.category}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-white/80">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {timeRemaining.isExpired ? 'Expired' : `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-white/60 text-sm mb-4">
            <div className="flex items-center space-x-1">
              <span>👁️ {product.views_count} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💬 {product.contact_clicks} contacts</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{formatRelativeTime(product.created_at)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleContact('whatsapp')}
              className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => handleContact('call')}
              className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </button>
            <button
              onClick={handleShare}
              className="bg-white bg-opacity-20 text-white p-3 rounded-lg hover:bg-opacity-30 transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Merchant Info */}
          {product.merchant && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {product.merchant.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{product.merchant.full_name}</p>
                  {product.merchant.average_rating && (
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-white/80 text-sm">
                        {product.merchant.average_rating.toFixed(1)} ({product.merchant.total_ratings})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 