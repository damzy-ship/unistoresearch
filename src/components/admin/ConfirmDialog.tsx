import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Merchant, supabase } from '../../lib/supabase';
import CustomAlert from './CustomAlert';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  merchant: Merchant;
}

export default function ConfirmDialog({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  merchant
}: ConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('merchants')
        .delete()
        .eq('id', merchant.id);

      if (error) {
        throw error;
      }
      
      onConfirm();
    } catch (error) {
      console.error('Error deleting merchant:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Delete Error',
        message: 'Error deleting merchant. Please try again.'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Merchant Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Seller ID:</span>
              <span className="text-sm font-mono text-gray-900">{merchant.seller_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Name:</span>
              <span className="text-sm text-gray-900">{merchant.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm text-gray-900 truncate ml-2">{merchant.email}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : confirmText}
          </button>
        </div>

        {/* Alert Dialog */}
        <CustomAlert
          isOpen={alert.isOpen}
          onClose={() => setAlert({ ...alert, isOpen: false })}
          type={alert.type}
          title={alert.title}
          message={alert.message}
        />
      </div>
    </div>
  );
}