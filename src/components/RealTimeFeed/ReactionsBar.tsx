import React, { useState, useRef, useEffect } from 'react';
import { Heart, ThumbsUp, Star, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReactionsBarProps {
  product: any;
  onReactionChange?: () => void;
}

const reactions = [
  { id: 'like', icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
  { id: 'love', icon: Heart, label: 'Love', color: 'text-red-500' },
  { id: 'star', icon: Star, label: 'Star', color: 'text-yellow-500' },
  { id: 'comment', icon: MessageCircle, label: 'Comment', color: 'text-green-500' },
  { id: 'share', icon: Share2, label: 'Share', color: 'text-purple-500' },
];

export default function ReactionsBar({ product, onReactionChange }: ReactionsBarProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState({
    like: product.reactions?.like || 0,
    love: product.reactions?.love || 0,
    star: product.reactions?.star || 0,
    comment: product.comments_count || 0,
    share: product.shares_count || 0,
  });
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleReaction = async (reactionType: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setReactionCounts(prev => ({
        ...prev,
        [reactionType]: prev[reactionType as keyof typeof prev] + 1
      }));
      
      setCurrentReaction(reactionType);
      setShowReactions(false);
      
      toast.success(`${reactions.find(r => r.id === reactionType)?.label} added!`);
      onReactionChange?.();
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const handleLongPress = () => {
    setShowReactions(true);
  };

  const handleMouseDown = () => {
    timeoutRef.current = setTimeout(handleLongPress, 500);
  };

  const handleMouseUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleTouchStart = () => {
    timeoutRef.current = setTimeout(handleLongPress, 500);
  };

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get the most popular reaction for the main button
  const getMainReaction = () => {
    const maxCount = Math.max(...Object.values(reactionCounts));
    const mainReaction = Object.entries(reactionCounts).find(([_, count]) => count === maxCount)?.[0];
    return reactions.find(r => r.id === mainReaction) || reactions[0];
  };

  const mainReaction = getMainReaction();
  const mainCount = reactionCounts[mainReaction.id as keyof typeof reactionCounts] || 0;
  const isMainReactionActive = currentReaction === mainReaction.id;

  return (
    <div className="relative">
      {/* Main Reaction Button */}
      <button
        ref={buttonRef}
        onClick={() => handleReaction(mainReaction.id)}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95 ${
          isMainReactionActive ? 'ring-2 ring-orange-500 animate-pulse' : ''
        }`}
      >
        <mainReaction.icon className={`w-5 h-5 ${mainReaction.color} ${isMainReactionActive ? 'fill-current' : ''} transition-all duration-200`} />
        <span className="text-white font-medium">{mainCount}</span>
      </button>

      {/* Expanded Reactions - Glassmorphism */}
      {showReactions && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl">
          <div className="flex items-center gap-3">
            {reactions.map((reaction) => {
              const Icon = reaction.icon;
              const count = reactionCounts[reaction.id as keyof typeof reactionCounts] || 0;
              const isActive = currentReaction === reaction.id;
              
              return (
                <button
                  key={reaction.id}
                  onClick={() => handleReaction(reaction.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                    isActive ? 'bg-white/30 animate-bounce' : ''
                  }`}
                >
                  <Icon className={`w-6 h-6 ${reaction.color} ${isActive ? 'fill-current' : ''} transition-all duration-200`} />
                  <span className="text-xs text-white font-medium">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 