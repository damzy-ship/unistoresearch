import React, { useState, useEffect } from 'react';
import { Theme } from '../hooks/useTheme';
import { FileUp, FileCheck } from 'lucide-react';
import { uploadImageToSupabase } from '../lib/databaseServices';

interface VerifyIDModalProps {
  onClose: () => void;
  onSave: (uploadedUrl: string) => void;
  currentTheme: Theme;
  uniqueId: string;
  currentVerificationId: string | undefined; // Added new prop
}

export default function VerifyIDModal({ onClose, onSave, currentTheme, uniqueId, currentVerificationId }: VerifyIDModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentVerificationId);

  useEffect(() => {
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const publicUrl = await uploadImageToSupabase(file, uniqueId, 'verifications', 'user_ids');
      onSave(publicUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="rounded-2xl p-8 shadow-lg max-w-lg w-full m-4 transition-all duration-300"
        style={{ backgroundColor: currentTheme.surface, color: currentTheme.text }}
      >
        <h3 
          className="text-2xl font-bold mb-4"
          style={{ color: currentTheme.primary }}
        >
          Verify Your Identity
        </h3>
        <p className="mb-6" style={{ color: currentTheme.textSecondary }}>
          {previewUrl ? 'You have already uploaded an ID. You can upload a new one to change it.' : 'To verify your account, please upload a valid SCHOOL ID.'}
        </p>

        {previewUrl && (
          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border-2" style={{ borderColor: currentTheme.textSecondary + '30' }}>
            {/* Display image preview */}
            <img src={previewUrl} alt="ID Preview" className="w-full h-full object-contain" />
          </div>
        )}

        <div 
          className="p-6 rounded-lg border-2 border-dashed flex items-center justify-center text-center cursor-pointer transition-colors duration-200"
          style={{ borderColor: currentTheme.textSecondary + '30' }}
        >
          <label htmlFor="id-upload" className="w-full h-full cursor-pointer flex flex-col items-center justify-center">
            {file ? (
              <div className="flex flex-col items-center">
                <FileCheck className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-green-500 font-medium">{file.name} is ready for upload.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <FileUp className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-400">Drag & drop your ID here, or click to browse</p>
              </div>
            )}
            <input 
              id="id-upload" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
              accept="image/*,.pdf" 
            />
          </label>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium transition-colors duration-200"
            style={{
              backgroundColor: currentTheme.background,
              color: currentTheme.text
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className={`px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})`
            }}
            disabled={!file || loading}
          >
            {loading ? 'Uploading...' : 'Upload & Change'}
          </button>
        </div>
      </div>
    </div>
  );
}