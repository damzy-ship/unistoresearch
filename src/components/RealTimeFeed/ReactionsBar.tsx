import React, { useState, useEffect } from 'react';
import { Heart, Zap, Star, ThumbsUp, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { addReaction, removeReaction, getUserReactions } from '../../lib/realTimeService';
import { RealTimeProduct } from '../../lib/realTimeService';

interface ReactionsBarProps {
  product: RealTimeProduct;
  onReactionChange?: () => void;
  className?: string;
}

type ReactionType = 'like' | 'love' | 'wow' | 'fire' | 'interested';

const reactionConfig = {
  like: { icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
  love: { icon: Heart, label: 'Love', color: 'text-red-500' },
  wow: { icon: Star, label: 'Wow', color: 'text-yellow-500' },
  fire: { icon: Zap, label: 'Fire', color: 'text-orange-500' },
  interested: { icon: MessageCircle, label: 'Interested', color: 'text-green-500' }
};

export default function ReactionsBar({ product, onReactionChange, className = '' }: ReactionsBarProps) {
  const [userReactions, setUserReactions] = useState<ReactionType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserReactions();
  }, [product.id]);

  const loadUserReactions = async () => {
    try {
      const result = await getUserReactions(product.id);
      if (result.data) {
        setUserReactions(result.data.map(r => r.reaction_type));
      }
    } catch (error) {
      console.error('Error loading user reactions:', error);
    }
  };

  const handleReaction = async (reactionType: ReactionType) => {
    if (loading) return;

    setLoading(true);
    try {
      const isReacted = userReactions.includes(reactionType);
      
      if (isReacted) {
        // Remove reaction
        const result = await removeReaction(product.id, reactionType);
        if (result.success) {
          setUserReactions(prev => prev.filter(r => r !== reactionType));
          toast.success('Reaction removed');
        } else {
          toast.error(result.error || 'Failed to remove reaction');
        }
      } else {
        // Add reaction
        const result = await addReaction(product.id, reactionType);
        if (result.success) {
          setUserReactions(prev => [...prev, reactionType]);
          toast.success('Reaction added!');
        } else {
          toast.error(result.error || 'Failed to add reaction');
        }
      }

      if (onReactionChange) {
        onReactionChange();
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to update reaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Object.entries(reactionConfig).map(([type, config]) => {
        const Icon = config.icon;
        const isReacted = userReactions.includes(type as ReactionType);
        
        return (
          <button
            key={type}
            onClick={() => handleReaction(type as ReactionType)}
            disabled={loading}
            className={`
              flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-200
              ${isReacted 
                ? `${config.color} bg-opacity-10 scale-110` 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
            `}
            title={config.label}
          >
            <Icon className={`w-4 h-4 ${isReacted ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
} 