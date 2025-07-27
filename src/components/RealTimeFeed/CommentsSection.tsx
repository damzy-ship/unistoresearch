import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { addComment, getProductComments, deleteComment } from '../../lib/realTimeService';
import { RealTimeProductComment } from '../../lib/realTimeService';
import { getUserId } from '../../hooks/useTracking';

interface CommentsSectionProps {
  productId: string;
  onCommentChange?: () => void;
  className?: string;
}

export default function CommentsSection({ productId, onCommentChange, className = '' }: CommentsSectionProps) {
  const [comments, setComments] = useState<RealTimeProductComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    getCurrentUser();
  }, [productId]);

  const getCurrentUser = async () => {
    try {
      const userId = await getUserId();
      setCurrentUserId(userId);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const result = await getProductComments(productId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.data) {
        setComments(result.data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!currentUserId) {
      toast.error('Please log in to comment');
      return;
    }

    setSubmitting(true);
    try {
      // Get user name from localStorage or use a default
      const userName = localStorage.getItem('user_name') || 'Anonymous User';
      
      const result = await addComment(productId, newComment, userName);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.data) {
        setComments(prev => [result.data!, ...prev]);
        setNewComment('');
        toast.success('Comment added!');
        
        if (onCommentChange) {
          onCommentChange();
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const result = await deleteComment(commentId);
      
      if (result.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success('Comment deleted');
        
        if (onCommentChange) {
          onCommentChange();
        }
      } else {
        toast.error(result.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comment Input */}
      <form onSubmit={handleSubmitComment} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            disabled={submitting}
            maxLength={500}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
            {newComment.length}/500
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {comment.user_name}
                      {comment.is_verified && (
                        <span className="ml-1 text-blue-500">✓</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-700">{comment.comment_text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 