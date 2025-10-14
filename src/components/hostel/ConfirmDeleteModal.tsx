import { X } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, deleting }: ConfirmDeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-white text-xl font-bold">Delete Post</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <p className="text-gray-300 mb-6">
                    Are you sure you want to delete this post? This action cannot be undone.
                </p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                        disabled={deleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:bg-red-500/50 disabled:cursor-not-allowed"
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
