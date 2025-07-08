import React, { useState, useEffect } from 'react';
import { Star, X, Clock } from 'lucide-react';
import { getContactsNeedingRatingPrompts, markContactAsRatingPrompted } from '../lib/ratingService';
import RatingModal from './RatingModal';

export default function RatingPrompt() {
  const [pendingContacts, setPendingContacts] = useState<any[]>([]);
  const [currentContact, setCurrentContact] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkForRatingPrompts = async () => {
      const contacts = await getContactsNeedingRatingPrompts();
      setPendingContacts(contacts.filter(contact => !dismissed.has(contact.id)));
    };

    checkForRatingPrompts();
    
    // Check every 30 minutes for new rating prompts
    const interval = setInterval(checkForRatingPrompts, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [dismissed]);

  const handleRateNow = (contact: any) => {
    setCurrentContact(contact);
    setShowRatingModal(true);
    markContactAsRatingPrompted(contact.id);
  };

  const handleDismiss = (contactId: string) => {
    setDismissed(prev => new Set([...prev, contactId]));
    setPendingContacts(prev => prev.filter(contact => contact.id !== contactId));
    markContactAsRatingPrompted(contactId);
  };

  const handleRatingSuccess = () => {
    // Remove the rated contact from pending list
    if (currentContact) {
      setPendingContacts(prev => prev.filter(contact => contact.id !== currentContact.id));
    }
  };

  // Show only the first pending contact
  const contactToShow = pendingContacts[0];

  if (!contactToShow) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 max-w-sm z-40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Rate your experience</span>
            </div>
            
            <h4 className="font-semibold text-gray-900 text-sm mb-1">
              How was your experience with {contactToShow.merchants?.full_name}?
            </h4>
            
            {contactToShow.request_logs?.request_text && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                "{contactToShow.request_logs.request_text}"
              </p>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => handleRateNow(contactToShow)}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              >
                Rate Now
              </button>
              <button
                onClick={() => handleDismiss(contactToShow.id)}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          
          <button
            onClick={() => handleDismiss(contactToShow.id)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && currentContact && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          merchantName={currentContact.merchants?.full_name || 'Seller'}
          merchantId={currentContact.merchant_id}
          requestId={currentContact.request_id}
          requestText={currentContact.request_logs?.request_text}
          onSuccess={handleRatingSuccess}
        />
      )}
    </>
  );
}