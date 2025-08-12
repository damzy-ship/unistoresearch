import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, MessageCircle, Phone, Share2, Heart, Play, MapPin, Tag, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { RealTimeProduct, trackRealTimeProductContact, getTimeRemaining } from '../../lib/realTimeService';

interface ProductGalleryProps {
  product: RealTimeProduct;
  onClose: () => void;
}

export default function ProductGallery({ product, onClose }: ProductGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // const [showComments, setShowComments] = useState(false);

  // For now, we'll use the main image. In the future, you can add multiple images
  const images = [product.media_url];

  const handleContact = async (method: 'whatsapp' | 'call' | 'message') => {
    try {
      await trackRealTimeProductContact(product.id, method);

      if (method === 'whatsapp') {
        const message = `Hi! I'm interested in your product: ${product.title}`;
        const phoneNumber = product.contact_phone?.replace('+', '') || product.merchant?.phone_number?.replace('+', '') || '2349060859789';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } else if (method === 'call') {
        const phoneNumber = product.contact_phone || product.merchant?.phone_number || '+2349060859789';
        window.open(`tel:${phoneNumber}`, '_blank');
      }

      toast.success(`Contacted seller via ${method}`);
    } catch (error) {
      console.error('Error contacting seller:', error);
      toast.error('Failed to contact seller');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: product.description || `Check out this product: ${product.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const timeRemaining = getTimeRemaining(product.expires_at);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      {/* Blurred Background with Current Image - Only for non-text posts */}
      {!product.is_text_post && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${images[currentImageIndex]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.3)',
          }}
        />
      )}

      <div className="relative w-full max-w-4xl mx-4 bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden max-h-[90vh] z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="w-8 h-8 bg-gray-100/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-semibold text-gray-900">Product Gallery</h2>
              <p className="text-sm text-gray-500">{product.merchant?.full_name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>


        </div>

        <div className={`flex flex-col ${product.is_text_post ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
          {/* Image Gallery - Only show for non-text posts */}
          {!product.is_text_post && (
            <div className="relative lg:w-1/2 bg-gray-100/50">
              <div className="relative aspect-square">
                {product.media_type === 'video' ? (
                  <div className="relative w-full h-full">
                    <video
                      src={images[currentImageIndex]}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      muted
                      loop
                    />
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                      Video
                    </div>
                  </div>
                ) : (
                  <img
                    src={images[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnail Navigation */}
              {images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                          ? 'border-orange-500 ring-2 ring-orange-200'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Details */}
          <div className={`${product.is_text_post ? 'lg:w-full' : 'lg:w-1/2'} p-6 overflow-y-auto bg-white/80 backdrop-blur-sm`}>
            {/* Title and Price */}
            <div className={`mb-6 ${product.is_text_post ? 'text-center' : ''}`}>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.title}</h1>
              {product.price && (
                <div className="text-3xl font-bold text-orange-600 mb-3">
                  ₦{product.price.toLocaleString()}
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Product Info */}
            <div className="space-y-3 mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
              <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>

              {product.location && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span>{product.location}</span>
                </div>
              )}

              {product.category && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Tag className="w-4 h-4 text-orange-500" />
                  <span>{product.category}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>
                  {timeRemaining.isExpired
                    ? 'Expired'
                    : `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`
                  }
                </span>
              </div>

              {/* Views - COMMENTED OUT FOR NOW */}
              {/* <div className="flex items-center gap-2 text-gray-700">
                <Eye className="w-4 h-4 text-orange-500" />
                <span>{product.views_count} views</span>
              </div> */}
            </div>

            {/* Merchant Info */}
            {product.merchant && (
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/30">
                <h3 className="font-semibold text-gray-900 mb-3">Seller Information</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {product.merchant.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.merchant.full_name}</p>
                    {/* <p className="text-sm text-gray-500">{product.merchant.seller_id}</p> */}
                    {product.merchant.average_rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm text-gray-600">
                          {product.merchant.average_rating.toFixed(1)} ({product.merchant.total_ratings} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleContact('whatsapp')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleContact('call')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                </div>
              </div>
            )}

            {/* Reactions and Comments - COMMENTED OUT FOR NOW */}
            {/* <div className="space-y-4">
              <div className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
                <h3 className="font-semibold text-gray-900 mb-3">Reactions</h3>
                <ReactionsBar 
                  product={product}
                  onReactionChange={() => {
                    // Refresh product data if needed
                  }}
                />
              </div>

              <div className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
                <h3 className="font-semibold text-gray-900 mb-3">Comments</h3>
                <CommentsSection 
                  productId={product.id}
                  onCommentChange={() => {
                    // Refresh product data if needed
                  }}
                />
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
} 